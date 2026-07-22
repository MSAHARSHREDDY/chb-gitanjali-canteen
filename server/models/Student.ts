import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  parentId: { type: mongoose.Schema.Types.Mixed, required: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  rollNo: { type: String, required: true },
  studentClass: { type: String, required: true },
  section: { type: String, required: true },
  subscribedPlan: { type: String, default: "" },
  planStartDate: { type: Date },
  planExpiryDate: { type: Date },
  planDaysRemaining: { type: Number, default: 0 },
  planActive: { type: Boolean, default: false },
});

export const Student: mongoose.Model<any> = mongoose.models.Student || mongoose.model("Student", studentSchema);
