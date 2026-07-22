import mongoose from "mongoose";

const offlineExpenseSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  category: { type: String, default: "Ingredients" }
});

export const OfflineExpense: mongoose.Model<any> = mongoose.models.OfflineExpense || mongoose.model("OfflineExpense", offlineExpenseSchema, "offlineexpenses");
