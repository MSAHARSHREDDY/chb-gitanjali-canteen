import express from "express";
import path from "path";
import cors from "cors";
import mongoose from "mongoose";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import fs from "fs";

import authRoutes from "./server/routes/auth.js";
import ordersRoutes from "./server/routes/orders.js";
import adminRoutes from "./server/routes/admin.js";
import reservationsRoutes from "./server/routes/reservations.js";
import paymentRoutes from "./server/routes/payment.js";
import studentsRoutes from "./server/routes/students.js";
import menuRoutes from "./server/routes/menu.js";
import { authMiddleware } from "./server/middleware/auth.js";
import { User } from "./server/models/User.js";
import bcrypt from "bcryptjs";

dotenv.config();

// Fallback to load any undefined key from .env.example
try {
  const envExamplePath = path.join(process.cwd(), ".env.example");
  if (fs.existsSync(envExamplePath)) {
    const parsed = dotenv.parse(fs.readFileSync(envExamplePath, "utf-8"));
    for (const key in parsed) {
      if (!process.env[key] || process.env[key] === "*****" || process.env[key]?.trim() === "") {
        process.env[key] = parsed[key];
      }
    }
  }
} catch (e) {
  console.error("Failed to load environment variables from .env.example fallback:", e);
}

mongoose.set("bufferCommands", false);


const app = express();
const PORT = process.env.NODE_ENV === "production" ? (process.env.PORT ? parseInt(process.env.PORT) : 8080) : 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- API Routes ---

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", authRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reservations", reservationsRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/students", studentsRoutes);
app.use("/api/menu", menuRoutes);

// Since the cart is just client side, we can optionally save order history or track items in backend.
// For now, let's keep cart checkout API as a placeholder that requires auth
app.post("/api/checkout", authMiddleware, async (req, res) => {
  // Normally you would process the items, create an order in DB, and handle payment here
  res.json({ success: true, message: "Order placed successfully!" });
});

async function startServer() {
  // Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri && mongoUri !== "*****") {
    // Event listeners to handle and track connection states
    mongoose.connection.on("connected", async () => {
      console.log("MongoDB connection established successfully.");
    });
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection stream error:", err);
    });
    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB link disconnected! Re-establishing connection...");
    });
    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB connection reconnected successfully.");
    });

    mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000, // wait up to 10 seconds for service selection
      socketTimeoutMS: 45000,          // standard socket timeout
    })
      .then(() => console.log("Connected to MongoDB init"))
      .catch((err) => console.error("MongoDB init connection error:", err));
  } else {
    console.warn("MongoDB URI not provided or is set to default '*****'. Database features will be unavailable.");
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    
    // Explicitly return 404 for missing assets so they don't fall back to index.html
    app.use("/assets/*", (req, res) => {
      res.type("text/javascript").status(404).send("// Asset not found");
    });

    app.get("*", (req, res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
