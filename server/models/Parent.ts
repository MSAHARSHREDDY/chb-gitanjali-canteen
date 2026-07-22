import mongoose from "mongoose";

const parentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: false, default: "" },
  createdAt: { type: Date, default: Date.now }
});

export const Parent: mongoose.Model<any> = mongoose.models.Parent || mongoose.model("Parent", parentSchema, "parents");
