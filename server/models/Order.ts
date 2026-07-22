import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  categoryId: { type: String },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  studentName: { type: String, default: "" },
  studentClass: { type: String, default: "" },
  section: { type: String, default: "" },
  rollNo: { type: String, default: "" },
});

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, default: "" },
  address: { type: String, required: true },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  status: { type: String, default: "Pending" },
  paymentStatus: { type: String, default: "Pending" }, // "Pending", "Paid", "Failed"
  paymentMethod: { type: String, default: "Counter" }, // "Counter", "Stripe"
  stripePaymentIntentId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const Order: mongoose.Model<any> = mongoose.models.Order || mongoose.model("Order", orderSchema, "orders");
