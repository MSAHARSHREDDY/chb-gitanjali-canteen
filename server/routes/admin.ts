import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { Teacher } from '../models/Teacher.js';
import { Student } from '../models/Student.js';
import { Parent } from '../models/Parent.js';
import { Order } from '../models/Order.js';
import { OfflineSale } from '../models/OfflineSale.js';
import { OfflineExpense } from '../models/OfflineExpense.js';
import { Notification } from '../models/Notification.js';
import { CanteenSettings } from '../models/CanteenSettings.js';
import { addSseClient, removeSseClient } from '../utils/sse.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { readDb, writeDb, generateId } from '../utils/fallbackDb.js';


export const adminMiddleware = async (req: any, res: any, next: any) => {
  try {
    let user: any;
    if (mongoose.connection.readyState === 1) {
      user = await User.findById(req.user.userId);
    } else {
      const db = readDb();
      user = db.users.find((u: any) => u._id === req.user.userId);
    }
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: "Server error checking admin status" });
  }
};

const router = express.Router();

// Get dashboard metrics
router.get("/metrics", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    let totalUsers = 0;
    let totalOrders = 0;
    let orders: any[] = [];
    let offlineSales: any[] = [];
    let offlineExpenses: any[] = [];

    if (mongoose.connection.readyState === 1) {
      const parentCount = await User.countDocuments();
      const teacherCount = await Teacher.countDocuments();
      totalUsers = parentCount + teacherCount;
      totalOrders = await Order.countDocuments();
      orders = await Order.find();
      offlineSales = await OfflineSale.find();
      offlineExpenses = await OfflineExpense.find();
    } else {
      const db = readDb();
      totalUsers = (db.users?.length || 0) + (db.teachers?.length || 0);
      totalOrders = db.orders?.length || 0;
      orders = db.orders || [];
      offlineSales = db.offlineSales || [];
      offlineExpenses = db.offlineExpenses || [];
    }

    const onlineRevenue = orders.filter((o: any) => o.status !== "Cancelled").reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const offlineRevenue = offlineSales.reduce((sum, sale) => sum + (sale.amount || 0), 0);
    const totalRevenue = onlineRevenue + offlineRevenue;
    const totalExpenses = offlineExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

    // 1. Monthly Sales Chart Flow Setup
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const salesByMonth: { [key: string]: number } = {};
    const ordersCountByMonth: { [key: string]: number } = {};

    // Initialize last 6 months to make sure chart flow looks uniform
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mName = monthNames[d.getMonth()];
      salesByMonth[mName] = 0;
      ordersCountByMonth[mName] = 0;
    }

    orders.forEach((order: any) => {
      const date = new Date(order.createdAt || Date.now());
      const mName = monthNames[date.getMonth()];
      if (salesByMonth[mName] !== undefined) {
        if (order.status !== "Cancelled") {
          salesByMonth[mName] += order.totalAmount || 0;
        }
        ordersCountByMonth[mName] += 1;
      }
    });

    offlineSales.forEach((sale: any) => {
      const date = new Date(sale.date || Date.now());
      const mName = monthNames[date.getMonth()];
      if (salesByMonth[mName] !== undefined) {
        salesByMonth[mName] += sale.amount || 0;
      }
    });

    const monthlySales = Object.keys(salesByMonth).map(month => ({
      month,
      revenue: salesByMonth[month],
      orders: ordersCountByMonth[month],
    }));

    // 2. Category-wise Sales Breakdown
    const categoryRevenue: { [key: string]: number } = {};
    orders.forEach((order: any) => {
      if (order.status !== "Cancelled" && order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const cat = item.categoryId || "general";
          categoryRevenue[cat] = (categoryRevenue[cat] || 0) + ((item.price || 0) * (item.quantity || 1));
        });
      }
    });

    // Merge offline categories
    offlineSales.forEach((sale: any) => {
      const cat = sale.category ? sale.category.toLowerCase().replace(/\s+/g, '-') : "counter";
      categoryRevenue[cat] = (categoryRevenue[cat] || 0) + (sale.amount || 0);
    });

    const categorySales = Object.keys(categoryRevenue).map(cat => ({
      category: cat.split('-').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
      revenue: categoryRevenue[cat]
    }));

    // 3. Top dishes
    const dishSales: { [key: string]: { name: string, quantity: number, revenue: number, image?: string } } = {};
    orders.forEach((order: any) => {
      if (order.status !== "Cancelled" && order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          if (!dishSales[item.id]) {
            dishSales[item.id] = { name: item.name, quantity: 0, revenue: 0, image: item.image };
          }
          dishSales[item.id].quantity += item.quantity || 0;
          dishSales[item.id].revenue += ((item.price || 0) * (item.quantity || 1));
        });
      }
    });
    const topDishes = Object.values(dishSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // 4. Order Status distribution
    const statusBreakdown: { [key: string]: number } = {
      Pending: 0,
      Preparing: 0,
      "Out for Delivery": 0,
      Delivered: 0,
      Cancelled: 0
    };
    orders.forEach((order: any) => {
      const status = order.status || "Pending";
      if (statusBreakdown[status] !== undefined) {
        statusBreakdown[status]++;
      }
    });

    res.json({ 
      totalUsers, 
      totalOrders, 
      totalRevenue,
      onlineRevenue,
      offlineRevenue,
      totalExpenses,
      monthlySales,
      categorySales,
      topDishes,
      statusBreakdown
    });
  } catch (error) {
    console.error("Fetch metrics error:", error);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

// GET /api/admin/offline-sales - Retrieve all offline sales
router.get("/offline-sales", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    let sales = [];
    if (mongoose.connection.readyState === 1) {
      sales = await OfflineSale.find().sort({ date: -1 });
    } else {
      const db = readDb();
      sales = [...db.offlineSales].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    res.json(sales);
  } catch (error) {
    console.error("Fetch offline sales error:", error);
    res.status(500).json({ error: "Failed to fetch offline sales" });
  }
});

// POST /api/admin/offline-sales - Add a manually generated offline sale transaction
router.post("/offline-sales", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { amount, description, date, paymentMethod, category } = req.body;
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: "A valid positive sale amount is required" });
    }
    if (!description || description.trim() === "") {
      return res.status(400).json({ error: "Transaction description is required" });
    }

    const saleData = {
      amount: Number(amount),
      description: description.trim(),
      date: date ? new Date(date) : new Date(),
      paymentMethod: paymentMethod || "Cash",
      category: category || "Counter"
    };

    let newSale: any;
    if (mongoose.connection.readyState === 1) {
      const saleInstance = new OfflineSale(saleData);
      await saleInstance.save();
      newSale = saleInstance;
    } else {
      const db = readDb();
      newSale = {
        _id: generateId(),
        ...saleData,
        date: saleData.date.toISOString()
      };
      db.offlineSales.push(newSale);
      writeDb(db);
    }
    res.status(201).json(newSale);
  } catch (error) {
    console.error("Create offline sale error:", error);
    res.status(500).json({ error: "Failed to create offline sale transaction" });
  }
});

// DELETE /api/admin/offline-sales/:id - Remove an offline sale record
router.delete("/offline-sales/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const deleted = await OfflineSale.findByIdAndDelete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Offline transaction record not found" });
      }
      return res.json({ message: "Transaction record deleted successfully", id: req.params.id });
    } else {
      const db = readDb();
      const index = db.offlineSales.findIndex((s: any) => s._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ error: "Offline transaction record not found" });
      }
      db.offlineSales.splice(index, 1);
      writeDb(db);
      return res.json({ message: "Transaction record deleted successfully", id: req.params.id });
    }
  } catch (error) {
    console.error("Delete offline sale error:", error);
    res.status(500).json({ error: "Failed to delete offline sale transaction" });
  }
});

// GET /api/admin/offline-expenses - Retrieve all offline expenses
router.get("/offline-expenses", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    let expenses = [];
    if (mongoose.connection.readyState === 1) {
      expenses = await OfflineExpense.find().sort({ date: -1 });
    } else {
      const db = readDb();
      expenses = [...db.offlineExpenses].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    res.json(expenses);
  } catch (error) {
    console.error("Fetch offline expenses error:", error);
    res.status(500).json({ error: "Failed to fetch offline expenses" });
  }
});

// POST /api/admin/offline-expenses - Add a manually generated offline expense transaction
router.post("/offline-expenses", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { amount, description, date, category } = req.body;
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: "A valid positive expense amount is required" });
    }
    if (!description || description.trim() === "") {
      return res.status(400).json({ error: "Expense description is required" });
    }

    const expData = {
      amount: Number(amount),
      description: description.trim(),
      date: date ? new Date(date) : new Date(),
      category: category || "Ingredients"
    };

    let newExpense: any;
    if (mongoose.connection.readyState === 1) {
      const expInstance = new OfflineExpense(expData);
      await expInstance.save();
      newExpense = expInstance;
    } else {
      const db = readDb();
      newExpense = {
        _id: generateId(),
        ...expData,
        date: expData.date.toISOString()
      };
      db.offlineExpenses.push(newExpense);
      writeDb(db);
    }
    res.status(201).json(newExpense);
  } catch (error) {
    console.error("Create offline expense error:", error);
    res.status(500).json({ error: "Failed to create offline expense transaction" });
  }
});

// DELETE /api/admin/offline-expenses/:id - Remove an offline expense record
router.delete("/offline-expenses/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const deleted = await OfflineExpense.findByIdAndDelete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Offline expense record not found" });
      }
      return res.json({ message: "Expense record deleted successfully", id: req.params.id });
    } else {
      const db = readDb();
      const index = db.offlineExpenses.findIndex((e: any) => e._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ error: "Offline expense record not found" });
      }
      db.offlineExpenses.splice(index, 1);
      writeDb(db);
      return res.json({ message: "Expense record deleted successfully", id: req.params.id });
    }
  } catch (error) {
    console.error("Delete offline expense error:", error);
    res.status(500).json({ error: "Failed to delete offline expense transaction" });
  }
});

// Helper to compute remaining days dynamically
const computePlanDaysRemaining = (planExpiryDate: any) => {
  if (!planExpiryDate) return 0;
  const expiry = new Date(planExpiryDate).getTime();
  const diff = expiry - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

function getPlanDates(planName: string, planActive: boolean) {
  if (!planName || !planActive) {
    return { planStartDate: null, planExpiryDate: null, planDaysRemaining: 0 };
  }

  const startDate = new Date();
  const expiryDate = new Date();
  if (planName.toLowerCase().includes("daily")) {
    expiryDate.setDate(startDate.getDate() + 1);
  } else if (planName.toLowerCase().includes("weekly")) {
    expiryDate.setDate(startDate.getDate() + 7);
  } else if (planName.toLowerCase().includes("monthly")) {
    expiryDate.setMonth(startDate.getMonth() + 1);
  } else if (planName.toLowerCase().includes("quarterly")) {
    expiryDate.setMonth(startDate.getMonth() + 3);
  } else if (planName.toLowerCase().includes("half-yearly")) {
    expiryDate.setMonth(startDate.getMonth() + 6);
  } else if (planName.toLowerCase().includes("yearly")) {
    expiryDate.setFullYear(startDate.getFullYear() + 1);
  }

  const diffTime = Math.abs(expiryDate.getTime() - startDate.getTime());
  const planDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return { planStartDate: startDate, planExpiryDate: expiryDate, planDaysRemaining };
}

// Get all users
router.get("/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    let users = [];
    let teachers = [];
    if (mongoose.connection.readyState === 1) {
      users = await User.find().select("-password").sort({ _id: -1 }).lean();
      teachers = await Teacher.find().select("-password").sort({ _id: -1 }).lean();
    } else {
      const db = readDb();
      users = (db.users || []).map(({ password, ...u }: any) => u).reverse();
      teachers = (db.teachers || []).map(({ password, ...t }: any) => t).reverse();
    }

    let allStudents: any[] = [];
    if (mongoose.connection.readyState === 1) {
      allStudents = await Student.find().lean();
    } else {
      const db = readDb();
      allStudents = db.students || [];
    }

    // Ensure users have isTeacher property correctly set
    const mappedUsers = users.map((u: any) => {
      let planStr = u.subscribedPlan;
      let active = !!u.planActive;
      let expiry = u.planExpiryDate;

      if (!u.isTeacher && !u.isAdmin) {
        // Fallback to finding a student's plan if parent's own user record doesn't have it
        const parentStudents = allStudents.filter(s => {
          const sParentId = s.parentId ? s.parentId.toString() : '';
          const uId = u._id ? u._id.toString() : (u.id ? u.id.toString() : '');
          return sParentId && uId && sParentId === uId;
        });
        const studentWithPlan = parentStudents.find(s => s.planActive && s.subscribedPlan);
        if (studentWithPlan && (!planStr || !active)) {
          planStr = studentWithPlan.subscribedPlan;
          active = true;
          expiry = studentWithPlan.planExpiryDate;
        }
      }

      return {
        ...u,
        isTeacher: !!u.isTeacher,
        subscribedPlan: planStr,
        planActive: active,
        planExpiryDate: expiry,
        planDaysRemaining: computePlanDaysRemaining(expiry || u.planExpiryDate)
      };
    });
    // Ensure teachers have isTeacher forced to true
    const mappedTeachers = teachers.map((t: any) => ({ 
      ...t, 
      isTeacher: true,
      planDaysRemaining: computePlanDaysRemaining(t.planExpiryDate)
    }));

    res.json([...mappedUsers, ...mappedTeachers]);
  } catch (error) {
    console.error("Failed to fetch all users/teachers:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get all teachers
router.get("/teachers", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    let teachers = [];
    if (mongoose.connection.readyState === 1) {
      const rawTeachers = await Teacher.find().select("-password").sort({ _id: -1 }).lean();
      teachers = rawTeachers.map((t: any) => ({
        ...t,
        planDaysRemaining: computePlanDaysRemaining(t.planExpiryDate)
      }));
    } else {
      const db = readDb();
      teachers = (db.teachers || []).map(({ password, ...t }: any) => ({
        ...t,
        planDaysRemaining: computePlanDaysRemaining(t.planExpiryDate)
      })).reverse();
    }
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch teachers" });
  }
});

// Get all parents
router.get("/parents", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    let parentsList = [];
    if (mongoose.connection.readyState === 1) {
      parentsList = await Parent.find().sort({ _id: -1 });
    } else {
      const db = readDb();
      parentsList = (db.parents || []).reverse();
    }
    res.json(parentsList);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch parents" });
  }
});

// Delete a teacher
router.delete("/teachers/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const deleted = await Teacher.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Teacher not found" });
      res.json({ message: "Teacher deleted successfully" });
    } else {
      const db = readDb();
      const initialLen = (db.teachers || []).length;
      db.teachers = (db.teachers || []).filter((t: any) => t._id !== req.params.id);
      if (db.teachers.length === initialLen) {
        db.teachers = (db.teachers || []).filter((t: any) => t.id !== req.params.id);
      }
      writeDb(db);
      res.json({ message: "Teacher deleted successfully" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to delete teacher" });
  }
});

// Toggle admin status
router.put("/users/:id/admin", authMiddleware, adminMiddleware, async (req: any, res) => {
  try {
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ error: "Cannot change own admin status" });
    }
    if (mongoose.connection.readyState === 1) {
      let user = await User.findById(req.params.id);
      if (!user) {
        user = await Teacher.findById(req.params.id);
      }
      if (!user) return res.status(404).json({ error: "User not found" });

      user.isAdmin = req.body.isAdmin;
      await user.save();
      return res.json({ message: "Admin status updated", user: { id: user._id, isAdmin: user.isAdmin } });
    } else {
      const db = readDb();
      let index = db.users.findIndex((u: any) => u._id === req.params.id);
      let isTeacher = false;
      if (index === -1) {
        index = (db.teachers || []).findIndex((t: any) => t._id === req.params.id);
        isTeacher = true;
      }
      if (index === -1) return res.status(404).json({ error: "User not found" });

      if (isTeacher) {
        db.teachers[index].isAdmin = req.body.isAdmin;
      } else {
        db.users[index].isAdmin = req.body.isAdmin;
      }
      writeDb(db);
      return res.json({ message: "Admin status updated", user: { id: req.params.id, isAdmin: req.body.isAdmin } });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to update user admin status" });
  }
});


// Delete User and associated children
router.delete("/users/:id", authMiddleware, adminMiddleware, async (req: any, res: any) => {
  try {
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ error: "Cannot delete yourself" });
    }
    if (mongoose.connection.readyState === 1) {
      let user = await User.findById(req.params.id);
      if (user) {
        await Student.deleteMany({ parentId: user._id });
        await User.findByIdAndDelete(req.params.id);
        return res.json({ message: "User and associated children deleted successfully" });
      } else {
        // Check if it's a teacher
        const teacher = await Teacher.findById(req.params.id);
        if (teacher) {
          await Teacher.findByIdAndDelete(req.params.id);
          return res.json({ message: "Teacher deleted successfully" });
        }
      }
      return res.status(404).json({ error: "User not found" });
    } else {
      const db = readDb();
      let index = db.users.findIndex((u: any) => u._id === req.params.id);
      if (index !== -1) {
        db.users.splice(index, 1);
        db.students = (db.students || []).filter((s: any) => s.parentId !== req.params.id);
        writeDb(db);
        return res.json({ message: "User and associated children deleted successfully" });
      }
      index = (db.teachers || []).findIndex((t: any) => t._id === req.params.id);
      if (index !== -1) {
        db.teachers.splice(index, 1);
        writeDb(db);
        return res.json({ message: "Teacher deleted successfully" });
      }
      return res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// Update user subscription plan (Admin)
router.put("/users/:id/subscription", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { subscribedPlan, planActive } = req.body;
    const dateFields = getPlanDates(subscribedPlan, planActive);

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });

      user.subscribedPlan = subscribedPlan;
      user.planActive = planActive;
      user.planStartDate = dateFields.planStartDate;
      user.planExpiryDate = dateFields.planExpiryDate;
      user.planDaysRemaining = dateFields.planDaysRemaining;
      
      await user.save();
      return res.json({ message: "Subscription plan updated successfully", user });
    } else {
      const db = readDb();
      const index = db.users.findIndex((u: any) => u._id === req.params.id);
      if (index === -1) return res.status(404).json({ error: "User not found" });

      db.users[index].subscribedPlan = subscribedPlan;
      db.users[index].planActive = planActive;
      db.users[index].planStartDate = dateFields.planStartDate ? dateFields.planStartDate.toISOString() : null;
      db.users[index].planExpiryDate = dateFields.planExpiryDate ? dateFields.planExpiryDate.toISOString() : null;
      db.users[index].planDaysRemaining = dateFields.planDaysRemaining;

      writeDb(db);
      return res.json({ message: "Subscription plan updated successfully", user: db.users[index] });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to update user subscription plan" });
  }
});

// Update teacher subscription plan (Admin)
router.put("/teachers/:id/subscription", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { subscribedPlan, planActive } = req.body;
    const dateFields = getPlanDates(subscribedPlan, planActive);

    if (mongoose.connection.readyState === 1) {
      const teacher = await Teacher.findById(req.params.id);
      if (!teacher) return res.status(404).json({ error: "Teacher not found" });

      teacher.subscribedPlan = subscribedPlan;
      teacher.planActive = planActive;
      teacher.planStartDate = dateFields.planStartDate;
      teacher.planExpiryDate = dateFields.planExpiryDate;
      teacher.planDaysRemaining = dateFields.planDaysRemaining;

      await teacher.save();
      return res.json({ message: "Subscription plan updated successfully", teacher });
    } else {
      const db = readDb();
      let index = (db.teachers || []).findIndex((t: any) => (t._id || t.id) === req.params.id);
      if (index === -1) return res.status(404).json({ error: "Teacher not found" });

      db.teachers[index].subscribedPlan = subscribedPlan;
      db.teachers[index].planActive = planActive;
      db.teachers[index].planStartDate = dateFields.planStartDate ? dateFields.planStartDate.toISOString() : null;
      db.teachers[index].planExpiryDate = dateFields.planExpiryDate ? dateFields.planExpiryDate.toISOString() : null;
      db.teachers[index].planDaysRemaining = dateFields.planDaysRemaining;

      writeDb(db);
      return res.json({ message: "Subscription plan updated successfully", teacher: db.teachers[index] });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to update teacher subscription plan" });
  }
});

// Get all orders
router.get("/orders", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    let orders = [];
    let students: any[] = [];
    let teachers: any[] = [];

    if (mongoose.connection.readyState === 1) {
      orders = await Order.find().sort({ createdAt: -1 });
      students = await Student.find();
      teachers = await Teacher.find();
    } else {
      const db = readDb();
      orders = [...db.orders].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      students = db.students || [];
      teachers = db.teachers || [];
    }

    // Enrich and correct order items dynamically based on the actual placing user role
    const enrichedOrders = await Promise.all(orders.map(async (order: any) => {
      const plainOrder = order.toObject ? order.toObject() : JSON.parse(JSON.stringify(order));
      
      const orderUserEmail = (plainOrder.customerEmail || "").trim().toLowerCase();
      const orderUserIdStr = String(plainOrder.userId);
      
      // Look up if this order belongs to an actually registered teacher account
      const isRealTeacher = teachers.some((t: any) => 
        String(t._id) === orderUserIdStr || 
        String(t.id) === orderUserIdStr || 
        (t.email || "").trim().toLowerCase() === orderUserEmail
      );

      let orderNeedsUpdateInDb = false;

      if (plainOrder.items && Array.isArray(plainOrder.items)) {
        plainOrder.items = plainOrder.items.map((item: any) => {
          const sName = (item.studentName || "").trim().toLowerCase();
          
          if (isRealTeacher) {
            // A real teacher's item should be labeled as Teacher/Faculty
            if (item.studentClass !== "Teacher" || item.section !== "Faculty") {
              item.studentClass = "Teacher";
              item.section = "Faculty";
              item.rollNo = "Teacher";
              orderNeedsUpdateInDb = true;
            }
          } else {
            // This order was placed by a Parent or general non-Teacher user!
            // If the item previously got a default "Staff" or "Teacher" value on the old backend, we repair it.
            const isMismatchedAsStaff = 
              item.studentClass === "Staff" || 
              item.studentClass === "Teacher" || 
              item.section === "Faculty" || 
              item.section === "Staff";
              
            const isMissingClass = !item.studentClass || item.studentClass === "N/A" || !item.section || item.section === "N/A";

            if (isMismatchedAsStaff || isMissingClass || sName === "registered student" || sName === "" || sName === "registered_student") {
              let matchedStudent = students.find((s: any) => (s.name || "").trim().toLowerCase() === sName);
              
              // Retroactive healing: if the order has "Registered Student" name, resolve to the parent's actual registered student!
              if (!matchedStudent && (sName === "registered student" || sName === "" || sName === "registered_student")) {
                matchedStudent = students.find((s: any) => 
                  String(s.parentId) === orderUserIdStr || 
                  (s.parentId && String(s.parentId._id || s.parentId) === orderUserIdStr)
                );
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
              } else {
                // If they are not found in students database, default to clean student/parent representation "N/A" (instead of Staff category)
                if (item.studentClass !== "N/A" || item.section !== "N/A") {
                  item.studentClass = "N/A";
                  item.section = "N/A";
                  item.rollNo = "N/A";
                  orderNeedsUpdateInDb = true;
                }
              }
            }
          }
          return item;
        });

        // Save corrected classification back to database to permanently repair existing records!
        if (orderNeedsUpdateInDb && mongoose.connection.readyState === 1) {
          try {
            await Order.updateOne(
              { _id: order._id },
              { $set: { items: plainOrder.items } }
            );
            console.log(`Successfully healed mismatched classification database record for Order #${order._id.toString().slice(-8).toUpperCase()}`);
          } catch (updateErr) {
            console.error(`Failed to repair order ${plainOrder._id} DB items:`, updateErr);
          }
        } else if (orderNeedsUpdateInDb) {
          // If fallback db is in use
          try {
            const db = readDb();
            const idx = db.orders.findIndex((o: any) => String(o._id) === String(order._id));
            if (idx !== -1) {
              db.orders[idx].items = plainOrder.items;
              writeDb(db);
            }
          } catch (fallbackDbErr) {
            console.error(`Failed to repair local db order items:`, fallbackDbErr);
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


// Update order status
router.put("/orders/:id/status", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (mongoose.connection.readyState === 1) {
      const order = await Order.findById(req.params.id);
      if (!order) return res.status(404).json({ error: "Order not found" });

      order.status = status;
      await order.save();
      return res.json(order);
    } else {
      const db = readDb();
      const index = db.orders.findIndex((o: any) => o._id === req.params.id);
      if (index === -1) return res.status(404).json({ error: "Order not found" });

      db.orders[index].status = status;
      writeDb(db);
      return res.json(db.orders[index]);
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// Delete an order
router.delete("/orders/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const order = await Order.findByIdAndDelete(req.params.id);
      if (!order) return res.status(404).json({ error: "Order not found" });
      return res.json({ message: "Order deleted successfully", id: req.params.id });
    } else {
      const db = readDb();
      const index = db.orders.findIndex((o: any) => o._id === req.params.id);
      if (index === -1) return res.status(404).json({ error: "Order not found" });
      db.orders.splice(index, 1);
      writeDb(db);
      return res.json({ message: "Order deleted successfully", id: req.params.id });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to delete order" });
  }
});

// GET /api/admin/notifications - Retrieve all notifications (latest first, limit 50)
router.get("/notifications", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    let notifications = [];
    if (mongoose.connection.readyState === 1) {
      notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
    } else {
      const db = readDb();
      notifications = [...db.notifications].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 50);
    }
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications." });
  }
});

// PUT /api/admin/notifications/mark-read - Mark all notifications as read
router.put("/notifications/mark-read", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      await Notification.updateMany({ isRead: false }, { isRead: true });
    } else {
      const db = readDb();
      db.notifications.forEach((n: any) => n.isRead = true);
      writeDb(db);
    }
    res.json({ success: true, message: "All notifications read successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to read notifications." });
  }
});

// DELETE /api/admin/notifications - Clear all notifications
router.delete("/notifications", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      await Notification.deleteMany({});
    } else {
      const db = readDb();
      db.notifications = [];
      writeDb(db);
    }
    res.json({ success: true, message: "All notifications cleared." });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear notifications." });
  }
});

// PUT /api/admin/notifications/:id/read - Mark a single notification as read
router.put("/notifications/:id/read", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const notification = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      return res.json(notification);
    } else {
      const db = readDb();
      const index = db.notifications.findIndex((n: any) => n._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ error: "Notification not found" });
      }
      db.notifications[index].isRead = true;
      writeDb(db);
      return res.json(db.notifications[index]);
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to update notification." });
  }
});

// Export today's orders as an Excel (CSV)
router.get("/orders/export-today", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    let orders: any[] = [];
    if (mongoose.connection.readyState === 1) {
      orders = await Order.find().sort({ createdAt: -1 });
    } else {
      const db = readDb();
      orders = db.orders || [];
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todayOrders = orders.filter(o => {
      const oDate = new Date(o.createdAt).toISOString().split('T')[0];
      return oDate === todayStr;
    });

    // Columns requested: Name of student, Items, Class Section, regarding what they have ordered, plus Date
    const headers = ["Date", "Name of student", "Items", "Class Section", "Regarding what they have ordered"];
    
    const rows = [];
    for (const o of todayOrders) {
      if (!o.items || o.items.length === 0) continue;
      for (const item of o.items) {
        const dateVal = new Date(o.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
        const nameOfStudent = item.studentName || "N/A";
        const itemsVal = `${item.name} (x${item.quantity})`;
        const classSection = `${item.studentClass || 'N/A'} - ${item.section || 'N/A'}`;
        const regarding = `Order ID ${o._id || o.id || 'N/A'} is ${o.status || 'Confirmed'}, paid via ${o.paymentMethod || 'Subscription'}. Total order value: INR ${o.totalAmount || 0}`;

        const escapedStr = (val: string) => `"${val.toString().replace(/"/g, '""')}"`;

        rows.push([
          escapedStr(dateVal),
          escapedStr(nameOfStudent),
          escapedStr(itemsVal),
          escapedStr(classSection),
          escapedStr(regarding)
        ].join(","));
      }
    }

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n"); // \uFEFF is UTF-8 BOM so Excel opens it with correct characters!
    
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=today_orders_${todayStr}.csv`);
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error("Failed to export today's orders:", error);
    res.status(500).json({ error: "Failed to generate CSV file" });
  }
});

// GET /api/admin/notifications/sse - Real-time SSE channel
router.get("/notifications/sse", async (req, res) => {
  const providedToken = (req.query.token as string) || (req.headers.authorization?.split(" ")[1] as string);
  
  if (!providedToken) {
    return res.status(401).json({ error: "Access denied. Token missing." });
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-do-not-use-in-production";
    const decoded: any = jwt.verify(providedToken, JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: "Access denied. Invalid session." });
    }

    let user: any;
    if (mongoose.connection.readyState === 1) {
      user = await User.findById(decoded.userId);
    } else {
      const db = readDb();
      user = db.users.find((u: any) => u._id === decoded.userId);
    }
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Access denied. Privileged session required." });
    }

    // Set connection headers for SSE
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    });

    const connectionId = Math.random().toString(36).substring(2, 10);
    addSseClient(connectionId, res);

    res.write(`comment: Connected to AI Studio Flight Admin SSE notifications connection [${connectionId}]\n\n`);

    const heartbeatInterval = setInterval(() => {
      try {
        res.write(`comment: heartbeat\n\n`);
      } catch (err) {
        clearInterval(heartbeatInterval);
      }
    }, 30000); // 30 seconds

    req.on("close", () => {
      clearInterval(heartbeatInterval);
      removeSseClient(connectionId);
    });
  } catch (error) {
    console.error("SSE connection validation error:", error);
    return res.status(401).json({ error: "Invalid token authentication failed." });
  }
});

// GET canteen-settings. Accessible to any user.
router.get("/canteen-settings/:key", async (req, res) => {
  const { key } = req.params;
  try {
    let setting: any = null;
    if (mongoose.connection.readyState === 1) {
      setting = await CanteenSettings.findOne({ key });
    } else {
      const db = readDb();
      setting = db.canteenSettings?.find((s: any) => s.key === key);
    }

    if (setting) {
      return res.json({ key, value: setting.value });
    }

    // Default fallbacks
    if (key === "meal_prices") {
      return res.json({
        key,
        value: {
          breakfast: 55,
          lunch: 75,
          breakfastLunch: 130,
          lunchSnacks: 110,
          allTogether: 165
        }
      });
    }

    return res.status(404).json({ error: "Setting not found" });
  } catch (err: any) {
    console.error("Error reading setting:", err);
    res.status(500).json({ error: "Server error reading setting" });
  }
});

// PUT canteen-settings. Admin only.
router.put("/canteen-settings/:key", authMiddleware, adminMiddleware, async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  try {
    if (mongoose.connection.readyState === 1) {
      await CanteenSettings.findOneAndUpdate(
        { key },
        { value },
        { upsert: true, new: true }
      );
    } else {
      const db = readDb();
      if (!db.canteenSettings) db.canteenSettings = [];
      const index = db.canteenSettings.findIndex((s: any) => s.key === key);
      if (index > -1) {
        db.canteenSettings[index].value = value;
      } else {
        db.canteenSettings.push({ key, value });
      }
      writeDb(db);
    }

    res.json({ success: true, message: `Setting ${key} updated successfully.`, value });
  } catch (err: any) {
    console.error("Error updating setting:", err);
    res.status(500).json({ error: "Server error updating setting" });
  }
});

export default router;
