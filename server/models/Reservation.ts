import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  guests: { type: Number, required: true, default: 1 },
  tables: { type: Number, required: true, default: 1 },
  seatNumber: { type: String },
  classType: { type: String, default: "First Class" },
  status: { type: String, default: "Pending" },
  createdAt: { type: Date, default: Date.now },
});

export const Reservation: mongoose.Model<any> = mongoose.models.Reservation || mongoose.model("Reservation", reservationSchema, "reservations");
