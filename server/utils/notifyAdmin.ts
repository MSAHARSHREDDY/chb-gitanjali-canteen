import { Notification } from "../models/Notification.js";
import { sseBroadcast } from "./sse.js";
import { readDb, writeDb, generateId } from "./fallbackDb.js";
import mongoose from "mongoose";

interface NotificationParams {
  type: string; // 'new_order', 'new_reservation', etc.
  title: string;
  message: string;
  metadata?: any;
}

export async function notifyAdmin({ type, title, message, metadata }: NotificationParams) {
  try {
    let notification: any;
    
    if (mongoose.connection.readyState === 1) {
      notification = new Notification({
        type,
        title,
        message,
        metadata,
      });
      await notification.save();
    } else {
      const db = readDb();
      notification = {
        _id: generateId(),
        type,
        title,
        message,
        isRead: false,
        metadata,
        createdAt: new Date().toISOString()
      };
      db.notifications.unshift(notification);
      writeDb(db);
    }
    
    // Broadcast real-time
    sseBroadcast("admin_notification", notification);
    console.log(`[Notification] Success broadcasting notification: "${title}"`);
    return notification;
  } catch (err) {
    console.error(`[Notification] Failed to create or broadcast:`, err);
  }
}

