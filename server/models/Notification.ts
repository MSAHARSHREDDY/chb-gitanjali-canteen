import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  type: { type: String, required: true }, // 'new_order', 'new_reservation'
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  metadata: { type: mongoose.Schema.Types.Mixed }, // { orderId: "..." }
  createdAt: { type: Date, default: Date.now },
});

export const Notification: mongoose.Model<any> = mongoose.models.Notification || mongoose.model("Notification", notificationSchema, "notifications");
