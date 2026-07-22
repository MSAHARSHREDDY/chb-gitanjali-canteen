import express from "express";
import mongoose from "mongoose";
import { MenuItem } from "../models/MenuItem.js";
import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "./admin.js";
import { readDb, writeDb, generateId } from "../utils/fallbackDb.js";

const router = express.Router();

const initialMenuItems = [
  { categoryId: "breakfast", day: "Monday", name: "Chapathi and Curry", price: 65, prepTime: "10 min", isVeg: true, image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80" },
  { categoryId: "lunch", day: "Monday", name: "Any Leafy Vegetable rice, Salad, Curd", price: 110, prepTime: "15 min", isVeg: true, image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80" },
  { categoryId: "snacks", day: "Monday", name: "Veg /Paneer Puff", price: 50, prepTime: "8 min", isVeg: true, image: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=600&q=80" },
  
  { categoryId: "breakfast", day: "Tuesday", name: "Guntaponganalu with Chutney", price: 70, prepTime: "12 min", isVeg: true, image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&q=80" },
  { categoryId: "lunch", day: "Tuesday", name: "White Rice, Tomato Dal, Veg Fry, Curd, Salad", price: 120, prepTime: "15 min", isVeg: true, image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80" },
  { categoryId: "snacks", day: "Tuesday", name: "Fruit Chat", price: 60, prepTime: "10 min", isVeg: true, image: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=600&q=80" },
  
  { categoryId: "breakfast", day: "Wednesday", name: "Idly and Chutney", price: 60, prepTime: "10 min", isVeg: true, image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8dhN-PbM2B41fR3MKZjMyev13PgckcztNIg&s" },
  { categoryId: "lunch", day: "Wednesday", name: "Carrot Rice, Beet Root Rice, Curd, Papad, Fresh Fruits", price: 130, prepTime: "18 min", isVeg: true, image: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80" },
  { categoryId: "snacks", day: "Wednesday", name: "Corn Sandwich", price: 55, prepTime: "5 min", isVeg: true, image: "https://www.vegrecipesofindia.com/wp-content/uploads/2016/08/masala-corn-recipe-2.jpg" },
  
  { categoryId: "breakfast", day: "Thursday", name: "Poha, Fresh Fruits", price: 80, prepTime: "12 min", isVeg: true, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&q=80" },
  { categoryId: "lunch", day: "Thursday", name: "Veg Fried Rice, Salad, Curd", price: 105, prepTime: "12 min", isVeg: true, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80" },
  { categoryId: "snacks", day: "Thursday", name: "Veg Manchurian", price: 65, prepTime: "7 min", isVeg: true, image: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=600&q=80" },
  
  { categoryId: "breakfast", day: "Friday", name: "Dosa and Chutney", price: 60, prepTime: "10 min", isVeg: true, image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&q=80" },
  { categoryId: "lunch", day: "Friday", name: "Bagara Rice, Masala Curry, Salad, Curd", price: 130, prepTime: "20 min", isVeg: true, image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80" },
  { categoryId: "snacks", day: "Friday", name: "Garlic Bread", price: 70, prepTime: "10 min", isVeg: true, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=80" },
  
  { categoryId: "breakfast", day: "Saturday", name: "Veg Bambino", price: 75, prepTime: "12 min", isVeg: true, image: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=600&q=80" },
  { categoryId: "lunch", day: "Saturday", name: "Tomato Rice, Curd Rice, Papad", price: 115, prepTime: "15 min", isVeg: true, image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRlvjd5_lTRMztYLqVgLT27V1sd5QdwfgXcOg&s" },
  { categoryId: "snacks", day: "Saturday", name: "Mini Donut and Kharis", price: 75, prepTime: "8 min", isVeg: true, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=80" },
];

router.get("/", async (req, res) => {
  try {
    const { category, day } = req.query;
    let items = [];

    if (mongoose.connection.readyState === 1) {
      items = await MenuItem.find().lean();
      
      if (items.length === 0) {
        // Seed default items
        await MenuItem.insertMany(initialMenuItems);
        items = await MenuItem.find().lean();
      }

      if (category && category !== "all") {
        items = items.filter((i: any) => i.categoryId === category);
      }
      if (day && day !== "all") {
        items = items.filter((i: any) => i.day.toLowerCase() === (day as string).toLowerCase());
      }
    } else {
      const db = readDb();
      items = db.menuItems || [];
      
      if (items.length === 0) {
        // Seed default items
        items = initialMenuItems.map(i => ({ ...i, id: generateId(), _id: generateId() }));
        db.menuItems = items;
        writeDb(db);
      }

      if (category && category !== "all") {
        items = items.filter((item: any) => item.categoryId === category);
      }
      if (day && day !== "all") {
        items = items.filter((item: any) => item.day?.toLowerCase() === (day as string).toLowerCase());
      }
    }
    
    // Convert _id to id for frontend compatibility
    const formattedItems = items.map((item: any) => ({
      ...item,
      id: item._id || item.id,
    }));
    
    return res.json(formattedItems);
  } catch (error) {
    console.error("Get menu items error:", error);
    return res.status(500).json({ error: "Failed to fetch menu items" });
  }
});

router.post("/reset", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      await MenuItem.deleteMany({});
      await MenuItem.insertMany(initialMenuItems);
      return res.json({ success: true, message: "Menu reset to default." });
    } else {
      const db = readDb();
      db.menuItems = initialMenuItems.map(i => ({ ...i, id: generateId(), _id: generateId() }));
      writeDb(db);
      return res.json({ success: true, message: "Menu reset to default." });
    }
  } catch (error) {
    console.error("Reset menu items error:", error);
    return res.status(500).json({ error: "Failed to reset menu items" });
  }
});

router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const newItem = new MenuItem(req.body);
      await newItem.save();
      return res.status(201).json({ ...newItem.toObject(), id: newItem._id });
    } else {
      const db = readDb();
      db.menuItems = db.menuItems || [];
      const newId = generateId();
      const newItem = { ...req.body, id: newId, _id: newId };
      db.menuItems.push(newItem);
      writeDb(db);
      return res.status(201).json(newItem);
    }
  } catch (error) {
    console.error("Create menu item error:", error);
    return res.status(500).json({ error: "Failed to create menu item" });
  }
});

router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.id;

    if (mongoose.connection.readyState === 1) {
      const updated = await MenuItem.findByIdAndUpdate(req.params.id, updateData, { new: true }).lean();
      if (!updated) return res.status(404).json({ error: "Item not found" });
      return res.json({ ...updated, id: updated._id });
    } else {
      const db = readDb();
      db.menuItems = db.menuItems || [];
      const index = db.menuItems.findIndex((item: any) => 
        (item.id !== undefined && String(item.id) === String(req.params.id)) || 
        (item._id !== undefined && String(item._id) === String(req.params.id))
      );
      if (index === -1) return res.status(404).json({ error: "Item not found" });
      db.menuItems[index] = { ...db.menuItems[index], ...updateData };
      writeDb(db);
      return res.json(db.menuItems[index]);
    }
  } catch (error) {
    console.error("Update menu item error:", error);
    return res.status(500).json({ error: "Failed to update menu item" });
  }
});

router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const deleted = await MenuItem.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Item not found" });
      return res.json({ success: true });
    } else {
      const db = readDb();
      db.menuItems = db.menuItems || [];
      const index = db.menuItems.findIndex((item: any) => 
        (item.id !== undefined && String(item.id) === String(req.params.id)) || 
        (item._id !== undefined && String(item._id) === String(req.params.id))
      );
      if (index === -1) return res.status(404).json({ error: "Item not found" });
      db.menuItems.splice(index, 1);
      writeDb(db);
      return res.json({ success: true });
    }
  } catch (error) {
    console.error("Delete menu item error:", error);
    return res.status(500).json({ error: "Failed to delete menu item" });
  }
});

export default router;
