import mongoose from "mongoose";

const offlineSaleSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  paymentMethod: { type: String, default: "Cash" },
  category: { type: String, default: "Counter" }
});

export const OfflineSale: mongoose.Model<any> = mongoose.models.OfflineSale || mongoose.model("OfflineSale", offlineSaleSchema, "offlinesales");
