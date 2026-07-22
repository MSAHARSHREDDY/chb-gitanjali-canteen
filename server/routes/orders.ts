import express from "express";
import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { User } from "../models/User.js";
import { Student } from "../models/Student.js";
import { authMiddleware } from "../middleware/auth.js";
import { notifyAdmin } from "../utils/notifyAdmin.js";
import { readDb, writeDb, generateId } from "../utils/fallbackDb.js";

const router = express.Router();

router.get("/", authMiddleware, async (req: any, res) => {
  try {
    let orders: any[] = [];
    let students: any[] = [];
    if (mongoose.connection.readyState === 1) {
      orders = await Order.find({ userId: req.user.userId }).sort({ createdAt: -1 });
      students = await Student.find({ parentId: req.user.userId });
    } else {
      const db = readDb();
      orders = db.orders.filter((o: any) => String(o.userId) === String(req.user.userId))
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      students = (db.students || []).filter((s: any) => String(s.parentId) === String(req.user.userId));
    }

    const orderUserIdStr = String(req.user.userId);
    const enrichedOrders = await Promise.all(orders.map(async (order: any) => {
      const plainOrder = order.toObject ? order.toObject() : JSON.parse(JSON.stringify(order));
      let orderNeedsUpdateInDb = false;

      if (plainOrder.items && Array.isArray(plainOrder.items)) {
        plainOrder.items = plainOrder.items.map((item: any) => {
          const sName = (item.studentName || "").trim().toLowerCase();
          const isMissingClass = !item.studentClass || item.studentClass === "N/A" || !item.section || item.section === "N/A";

          if (isMissingClass || sName === "registered student" || sName === "" || sName === "registered_student") {
            let matchedStudent = students.find((s: any) => (s.name || "").trim().toLowerCase() === sName);
            
            if (!matchedStudent && (sName === "registered student" || sName === "" || sName === "registered_student")) {
              matchedStudent = students[0]; // Fallback to first student if we have one
              if (matchedStudent) {
                item.studentName = matchedStudent.name;
                orderNeedsUpdateInDb = true;
              }
            }

            if (matchedStudent) {
              const newClass = matchedStudent.studentClass || "N/A";
              const newSection = matchedStudent.section || "N/A";
              const newRollNo = matchedStudent.rollNo || "N/A";

              if (item.studentClass !== newClass || item.section !== newSection || item.rollNo !== newRollNo) {
                item.studentClass = newClass;
                item.section = newSection;
                item.rollNo = newRollNo;
                orderNeedsUpdateInDb = true;
              }
            }
          }
          return item;
        });

        if (orderNeedsUpdateInDb && mongoose.connection.readyState === 1) {
          try {
            await Order.updateOne(
              { _id: order._id },
              { $set: { items: plainOrder.items } }
            );
            console.log(`Successfully healed parent order record in DB for order ID: ${order._id}`);
          } catch (updateErr) {
            console.error("Failed to dynamically update parent order items in DB:", updateErr);
          }
        } else if (orderNeedsUpdateInDb) {
          try {
            const db = readDb();
            const idx = db.orders.findIndex((o: any) => String(o._id) === String(order._id));
            if (idx !== -1) {
              db.orders[idx].items = plainOrder.items;
              writeDb(db);
            }
          } catch (writeErr) {
            console.error("Failed to write to file DB during parent order healing:", writeErr);
          }
        }
      }
      return plainOrder;
    }));

    res.json(enrichedOrders);
  } catch (error) {
    console.error("Fetch orders error:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Generate and download Excel file for today's orders in backend
router.get("/export-today", authMiddleware, async (req: any, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    let orders: any[] = [];
    if (mongoose.connection.readyState === 1) {
      orders = await Order.find({
        createdAt: { $gte: startOfToday }
      }).sort({ createdAt: -1 });
    } else {
      const db = readDb();
      orders = (db.orders || []).filter((o: any) => {
        return new Date(o.createdAt).getTime() >= startOfToday.getTime();
      }).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Generate CSV representing Excel
    const headers = [
      "Name of student",
      "Items",
      "Class Section",
      "Regarding what they have ordered",
      "Date"
    ];

    const rows: string[][] = [];
    orders.forEach((order: any) => {
      const dateStr = new Date(order.createdAt).toISOString().split("T")[0];
      if (order.items && order.items.length > 0) {
        order.items.forEach((item: any) => {
          const studentName = item.studentName || order.customerName || "N/A";
          const itemsOrdered = `${item.name} (Qty: ${item.quantity || 1})`;
          const classSection = `${item.studentClass || "N/A"} - ${item.section || "N/A"}`;
          const regarding = `Order #${order._id.toString().slice(-8).toUpperCase()} - ${order.status || "Confirmed"} via ${order.paymentMethod || "Subscription"}`;
          rows.push([studentName, itemsOrdered, classSection, regarding, dateStr]);
        });
      } else {
        rows.push([
          order.customerName || "N/A",
          "N/A",
          "N/A",
          `Order #${order._id.toString().slice(-8).toUpperCase()} of value ₹${order.totalAmount || 0}`,
          dateStr
        ]);
      }
    });

    const escapeCSV = (val: string) => {
      const escaped = (val || "").replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const csvContent = "\uFEFF" + [
      headers.map(escapeCSV).join(","),
      ...rows.map(row => row.map(escapeCSV).join(","))
    ].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="orders_today_${today.toISOString().split("T")[0]}.csv"`);
    return res.send(csvContent);
  } catch (error) {
    console.error("Export orders error:", error);
    return res.status(500).json({ error: "Failed to export today's orders" });
  }
});

router.post("/", authMiddleware, async (req: any, res) => {
  try {
    const { items, customerName, customerEmail, customerPhone, address } = req.body;
    
    if (!items || !items.length) {
      return res.status(400).json({ error: "Your order is empty" });
    }

    // STRICT TIME CUTOFF CHECK (Kolkata Time)
    const now = new Date();
    const kolkataTimeMs = now.getTime() + (5.5 * 60 * 60 * 1000);
    const kolkataDate = new Date(kolkataTimeMs);
    const curHour = kolkataDate.getUTCHours();
    
    if (curHour >= 6 && curHour < 12) {
      return res.status(400).json({ error: "Canteen ordering is strictly closed between 6:00 AM and 12:00 PM IST." });
    }

    // Check for duplicate orders placed today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    let todayOrders: any[] = [];
    if (mongoose.connection.readyState === 1) {
      todayOrders = await Order.find({
        userId: req.user.userId,
        createdAt: { $gte: startOfToday }
      });
    } else {
      const db = readDb();
      todayOrders = (db.orders || []).filter((o: any) => 
        String(o.userId) === String(req.user.userId) && 
        new Date(o.createdAt).getTime() >= startOfToday.getTime()
      );
    }

    for (const newItem of items) {
      const hasDuplicate = todayOrders.some((existingOrder: any) => {
        return (existingOrder.items || []).some((exItem: any) => 
          String(exItem.studentName).toLowerCase() === String(newItem.studentName).toLowerCase() &&
          String(exItem.name).toLowerCase() === String(newItem.name).toLowerCase()
        );
      });

      if (hasDuplicate) {
        return res.status(400).json({ 
          error: "You have already ordered" 
        });
      }
    }

    // Validate that each student has an active subscription plan on the backend
    const studentNames: string[] = Array.from(new Set(items.map((i: any) => i.studentName as string))).filter(Boolean) as string[];
    const studentDetails: Record<string, any> = {};
    const isTeacher = !!req.user.isTeacher || req.user.role === 'teacher';
    
    // Always resolve details for each student Name so we don't display "N/A"
    for (const sName of studentNames) {
      let dbStudent: any = null;
      if (mongoose.connection.readyState === 1) {
        // First try with parentId constraint
        const parentQuery: any = {
          name: { $regex: new RegExp("^" + sName.trim() + "$", "i") }
        };
        if (mongoose.Types.ObjectId.isValid(req.user.userId)) {
          parentQuery.$or = [
            { parentId: req.user.userId },
            { parentId: new mongoose.Types.ObjectId(req.user.userId) }
          ];
        } else {
          parentQuery.parentId = req.user.userId;
        }
        dbStudent = await Student.findOne(parentQuery);

        // If not found, find globally by name (extremely useful for teachers or cross-linked rosters)
        if (!dbStudent) {
          dbStudent = await Student.findOne({
            name: { $regex: new RegExp("^" + sName.trim() + "$", "i") }
          });
        }
      } else {
        const db = readDb();
        // First try with parentId constraint
        dbStudent = (db.students || []).find((s: any) => 
          String(s.parentId) === String(req.user.userId) && 
          s.name.trim().toLowerCase() === sName.trim().toLowerCase()
        );
        // Fallback globally
        if (!dbStudent) {
          dbStudent = (db.students || []).find((s: any) => 
            s.name.trim().toLowerCase() === sName.trim().toLowerCase()
          );
        }
      }

      if (dbStudent) {
        // Enforcing active subscription is now completely optional; parents can proceed directly.
        console.log(`Bypassing plan check for: ${sName}`);
        
        studentDetails[sName] = {
          studentClass: dbStudent.studentClass || "N/A",
          section: dbStudent.section || "N/A",
          rollNo: dbStudent.rollNo || "N/A",
          isTeacher: false
        };
      } else {
        // Not found in student database (assign default Teacher metadata if logged user is indeed a Teacher; otherwise treat as standard parent/student order with 'N/A' to avoid 'Staff' classification)
        studentDetails[sName] = {
          studentClass: isTeacher ? "Teacher" : "N/A",
          section: isTeacher ? "Faculty" : "N/A",
          rollNo: isTeacher ? "Teacher" : "N/A",
          isTeacher: isTeacher
        };
      }
    }

    let finalPhone = customerPhone || "";
    if (!finalPhone && req.user && req.user.userId) {
      try {
        if (mongoose.connection.readyState === 1) {
          const user = await User.findById(req.user.userId);
          if (user && user.mobile) {
            finalPhone = user.mobile;
          }
        } else {
          const db = readDb();
          const user = db.users.find((u: any) => u._id === req.user.userId);
          if (user && user.mobile) {
            finalPhone = user.mobile;
          }
        }
      } catch (dbErr) {
        console.warn("Could not retrieve user mobile fallback:", dbErr);
      }
    }

    // Keep the real price to display amount in database and checkout page
    const processedItems = items.map((i: any) => ({
      ...i,
      studentClass: studentDetails[i.studentName]?.studentClass || "N/A",
      section: studentDetails[i.studentName]?.section || "N/A",
      rollNo: studentDetails[i.studentName]?.rollNo || "N/A",
      price: Number(i.price) || 0
    }));

    // Calculate actual total amount based on processed items
    const computedTotalAmount = processedItems.reduce((sum: number, item: any) => sum + (Number(item.price) * (Number(item.quantity) || 1)), 0);

    const orderData: any = {
      userId: req.user.userId,
      customerName,
      customerEmail,
      customerPhone: finalPhone,
      address,
      items: processedItems,
      totalAmount: computedTotalAmount,
      paymentMethod: "UPI",
      paymentStatus: "Paid",
      stripePaymentIntentId: undefined,
      status: "Confirmed"
    };

    let order: any;
    if (mongoose.connection.readyState === 1) {
      const ordInstance = new Order(orderData);
      await ordInstance.save();
      order = ordInstance;
    } else {
      const db = readDb();
      order = {
        _id: generateId(),
        ...orderData,
        createdAt: new Date().toISOString()
      };
      db.orders.push(order);
      writeDb(db);
    }
    
    // Notify admin
    try {
      await notifyAdmin({
        type: "new_order",
        title: "Staff Classroom Delivery Assigned",
        message: `${customerName} ordered meals for ${studentNames.join(', ')} (Total: ₹${computedTotalAmount})`,
        metadata: { orderId: order._id, totalAmount: computedTotalAmount, customerName }
      });
      
    } catch (notifErr) {
      console.error("Delayed or failed admin system broadcast notification:", notifErr);
    }
    
    res.status(201).json(order);
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

router.put("/:id/cancel", authMiddleware, async (req: any, res) => {
  try {
    const orderId = req.params.id;
    let order: any = null;

    if (mongoose.connection.readyState === 1) {
      order = await Order.findOne({ _id: orderId, userId: req.user.userId });
      if (!order) {
        return res.status(404).json({ error: "Order not found or access denied" });
      }
      if (order.status === "Delivered") {
        return res.status(400).json({ error: "Cannot cancel an order that has already been delivered" });
      }
      order.status = "Cancelled";
      await order.save();
    } else {
      const db = readDb();
      const index = db.orders.findIndex((o: any) => o._id === orderId && o.userId === req.user.userId);
      if (index === -1) {
        return res.status(404).json({ error: "Order not found or access denied" });
      }
      order = db.orders[index];
      if (order.status === "Delivered") {
        return res.status(400).json({ error: "Cannot cancel an order that has already been delivered" });
      }
      db.orders[index].status = "Cancelled";
      writeDb(db);
      order = db.orders[index];
    }

    // Try to notify admin about cancellation
    try {
      await notifyAdmin({
        type: "order_cancelled",
        title: "Order Cancelled by User",
        message: `${order.customerName} cancelled their order (Order ID: #${order._id.toString().slice(-8).toUpperCase()})`,
        metadata: { orderId: order._id, totalAmount: order.totalAmount, customerName: order.customerName }
      });
    } catch (notifErr) {
      console.error("Failed to notify admin of cancellation:", notifErr);
    }

    res.json({ message: "Order cancelled successfully", order });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ error: "Failed to cancel order" });
  }
});

export default router;
