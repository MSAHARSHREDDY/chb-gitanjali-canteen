import mongoose from "mongoose";

const canteenSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });

export const CanteenSettings: mongoose.Model<any> = mongoose.models.CanteenSettings || mongoose.model("CanteenSettings", canteenSettingsSchema, "canteensettings");
