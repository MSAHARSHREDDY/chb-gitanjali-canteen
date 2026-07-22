import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: false, default: "" },
  password: { type: String, required: true },
  isTeacher: { type: Boolean, default: true },
  subscribedPlan: { type: String, default: "" },
  planActive: { type: Boolean, default: false },
  planStartDate: { type: Date, default: null },
  planExpiryDate: { type: Date, default: null },
  planDaysRemaining: { type: Number, default: 0 },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
});

export const Teacher: mongoose.Model<any> = mongoose.models.Teacher || mongoose.model("Teacher", teacherSchema);
