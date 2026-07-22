import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema({
  categoryId: { type: String, required: true },
  day: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true, default: 0 },
  spicy: { type: Boolean, default: false },
  prepTime: { type: String },
  rating: { type: Number, default: 4.8 },
  calories: { type: Number },
  isVeg: { type: Boolean, default: true },
  image: { type: String }
}, { timestamps: true });

export const MenuItem = mongoose.model("MenuItem", menuItemSchema);
