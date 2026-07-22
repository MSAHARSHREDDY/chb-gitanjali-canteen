import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const DB_DIR = path.join(process.cwd(), "server", "data");
const DB_FILE = path.join(DB_DIR, "fallback.json");

// In-memory fallback for serverless environments with read-only file systems
let memoryDb: any = null;

function getInitialData() {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync("password", salt);
  
  return {
    users: [
      {
        _id: "fallback_admin_user_id001",
        name: "Saharsh Reddy",
        email: "saharshreddym59@gmail.com",
        mobile: "+91 9999999999",
        password: hash,
        isAdmin: true,
        isParent: false
      }
    ],
    reservations: [
      {
        _id: "fallback_res_id001",
        name: "Aryan Roy",
        email: "support@geetanjalicanteen.in",
        phone: "+91 9999999999",
        date: new Date().toISOString().split("T")[0],
        time: "12:30",
        guests: 1,
        tables: 1,
        seatNumber: "4B",
        classType: "Class 4B",
        status: "Pending",
        createdAt: new Date().toISOString()
      }
    ],
    orders: [
      {
        _id: "fallback_order_id001",
        userId: "fallback_admin_user_id001",
        customerName: "Saharsh Reddy",
        customerEmail: "saharshreddym59@gmail.com",
        customerPhone: "+91 9999999999",
        address: "Geetanjali Canteen Main Canteen Bench B3",
        items: [
          {
            id: "sc-102",
            name: "Organic Dal Fry & Basmati Rice",
            price: 95,
            image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80",
            quantity: 2
          }
        ],
        totalAmount: 190,
        status: "Confirmed",
        paymentStatus: "Paid",
        paymentMethod: "Counter",
        createdAt: new Date().toISOString()
      }
    ],
    offlineSales: [
      {
        _id: "fallback_sale_id001",
        amount: 1540,
        description: "Counter Snacks Sale Batch A",
        date: new Date().toISOString(),
        paymentMethod: "UPI",
        category: "Counter"
      }
    ],
    offlineExpenses: [
      {
        _id: "fallback_expense_id001",
        amount: 850,
        description: "Fresh Organic Apples Sourcing",
        date: new Date().toISOString(),
        category: "Ingredients"
      }
    ],
    notifications: [
      {
        _id: "fallback_notif_id001",
        type: "system",
        title: "Resilient Sandbox Mode Active",
        message: "Operating in resilient local fallback database. System is 100% operational.",
        isRead: false,
        createdAt: new Date().toISOString()
      }
    ],
    students: [],
    teachers: [],
    parents: [],
    canteenSettings: [
      {
        key: "meal_prices",
        value: {
          breakfast: 55,
          lunch: 75,
          breakfastLunch: 130,
          lunchSnacks: 110,
          allTogether: 165
        }
      }
    ]
  };
}

function initDb() {
  if (memoryDb) return; // already initialized in memory

  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initialData = getInitialData();
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf8");
    }
  } catch (err) {
    console.warn("Could not write to file system. Using in-memory fallback database.", err);
    if (!memoryDb) {
      memoryDb = getInitialData();
    }
  }
}

export function readDb() {
  initDb();
  
  if (memoryDb) {
    return JSON.parse(JSON.stringify(memoryDb)); // Return deep copy to prevent direct mutation
  }

  try {
    const content = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(content);
  } catch (err) {
    console.error("Error reading fallback database file, using in-memory:", err);
    if (!memoryDb) memoryDb = getInitialData();
    return JSON.parse(JSON.stringify(memoryDb));
  }
}

export function writeDb(data: any) {
  initDb();
  
  // Always update memoryDb if we have fallen back to it
  if (memoryDb !== null || !fs.existsSync(DB_DIR)) {
    memoryDb = JSON.parse(JSON.stringify(data));
  }
  
  try {
    // Still try to write to file if possible
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    // It's ok if this fails in serverless, we already updated memoryDb
  }
}

export function generateId() {
  return "fallback_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}
