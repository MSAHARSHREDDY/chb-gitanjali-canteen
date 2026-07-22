import express from "express";
import mongoose from "mongoose";
import { Student } from "../models/Student.js";
import { User } from "../models/User.js";
import { Teacher } from "../models/Teacher.js";
import { authMiddleware } from "../middleware/auth.js";
import { readDb, writeDb, generateId } from "../utils/fallbackDb.js";

const router = express.Router();

// Helper to compute remaining days dynamically
const computePlanDaysRemaining = (planExpiryDate: any) => {
  if (!planExpiryDate) return 0;
  const expiry = new Date(planExpiryDate).getTime();
  const diff = expiry - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

// Get students for a parent
const getParentQuery = (parentId: string) => {
  if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(parentId)) {
    return {
      $or: [
        { parentId: parentId },
        { parentId: new mongoose.Types.ObjectId(parentId) }
      ]
    };
  }
  return { parentId };
};

const getStudentQuery = (studentId: string, parentId: string) => {
  const baseQuery: any = { _id: studentId };
  if (mongoose.connection.readyState === 1) {
    if (mongoose.Types.ObjectId.isValid(parentId)) {
      baseQuery.$or = [
        { parentId: parentId },
        { parentId: new mongoose.Types.ObjectId(parentId) }
      ];
    } else {
      baseQuery.parentId = parentId;
    }
  } else {
    baseQuery.parentId = parentId;
  }
  return baseQuery;
};

router.get("/", authMiddleware, async (req: any, res) => {
  try {
    const parentId = req.user.userId;
    if (mongoose.connection.readyState === 1) {
      const rawStudents = await Student.find(getParentQuery(parentId)).lean();
      const students = rawStudents.map((s: any) => ({...s, planDaysRemaining: computePlanDaysRemaining(s.planExpiryDate)}));
      res.json(students);
    } else {
      const db = readDb();
      const students = (db.students || []).filter((s: any) => s.parentId === parentId).map((s: any) => ({...s, planDaysRemaining: computePlanDaysRemaining(s.planExpiryDate)}));
      res.json(students);
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

// Admin: Get all students
router.get("/all", authMiddleware, async (req: any, res) => {
  try {
    // Basic admin check - ideally implement admin middleware
    if (!req.user.email) return res.status(403).json({ error: "Forbidden" });

    if (mongoose.connection.readyState === 1) {
      const studentsRaw = await Student.find().lean();
      const dbUsers = await User.find().lean();
      const dbTeachers = await Teacher.find().lean();
      
      const allParents = [...dbUsers, ...dbTeachers];

      const students = studentsRaw.map((s: any) => {
        const parentIdStr = s.parentId ? s.parentId.toString() : '';
        const parent = allParents.find((u: any) => u._id.toString() === parentIdStr);
        return {
          ...s,
          planDaysRemaining: computePlanDaysRemaining(s.planExpiryDate),
          parentId: parent ? { _id: parent._id, name: parent.name, email: parent.email, mobile: parent.mobile } : null
        };
      });
      res.json(students);
    } else {
      const db = readDb();
      const students = (db.students || []).map((s: any) => {
        const parent = (db.users || []).find((u: any) => u._id === s.parentId) || (db.teachers || []).find((t: any) => t._id === s.parentId);
        return {
          ...s,
          planDaysRemaining: computePlanDaysRemaining(s.planExpiryDate),
          parentId: parent ? { _id: parent._id, name: parent.name, email: parent.email, mobile: parent.mobile } : null
        };
      });
      res.json(students);
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch all students" });
  }
});

// Add a new student
router.post("/", authMiddleware, async (req: any, res) => {
  try {
    let { name, age, rollNo, studentClass, section } = req.body;
    const parentId = req.user.userId;

    if (!rollNo) {
      rollNo = `GJS-${Math.floor(10000 + Math.random() * 90000)}`;
    }

    if (!name || !age || !studentClass || !section) {
      return res.status(400).json({ error: `Missing required fields: name=${name}, age=${age}, studentClass=${studentClass}, section=${section}` });
    }

    if (mongoose.connection.readyState === 1) {
      const pId = mongoose.Types.ObjectId.isValid(parentId) ? new mongoose.Types.ObjectId(parentId) : parentId;
      const newStudent = new Student({ parentId: pId, name, age, rollNo, studentClass, section });
      await newStudent.save();
      res.status(201).json(newStudent);
    } else {
      const db = readDb();
      if (!db.students) db.students = [];
      const newStudent = {
        _id: generateId(),
        parentId,
        name,
        age: parseInt(age, 10),
        rollNo,
        studentClass,
        section,
        createdAt: new Date().toISOString()
      };
      db.students.push(newStudent);
      writeDb(db);
      res.status(201).json(newStudent);
    }
  } catch (error: any) {
    res.status(500).json({ error: "Failed to add student", details: error.message });
  }
});

// Update a student
router.put("/:id", authMiddleware, async (req: any, res) => {
  try {
    let { name, age, rollNo, studentClass, section } = req.body;
    const parentId = req.user.userId;

    if (mongoose.connection.readyState === 1 && !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: "Student not found" });
    }

    if (!rollNo) {
      rollNo = `GJS-${Math.floor(10000 + Math.random() * 90000)}`;
    }

    if (mongoose.connection.readyState === 1) {
      const student = await Student.findOneAndUpdate(
        getStudentQuery(req.params.id, parentId),
        { name, age, rollNo, studentClass, section },
        { new: true }
      );
      if (!student) return res.status(404).json({ error: "Student not found" });
      res.json(student);
    } else {
      const db = readDb();
      const sIndex = (db.students || []).findIndex((s: any) => s._id === req.params.id && s.parentId === parentId);
      if (sIndex === -1) return res.status(404).json({ error: "Student not found" });
      
      const updated = { ...db.students[sIndex], name, age: parseInt(age, 10), rollNo, studentClass, section };
      db.students[sIndex] = updated;
      writeDb(db);
      res.json(updated);
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to update student" });
  }
});

// Admin update student
router.put("/admin/:id", authMiddleware, async (req: any, res) => {
  try {
    const { name, age, rollNo, studentClass, section } = req.body;

    if (mongoose.connection.readyState === 1) {
      const student = await Student.findByIdAndUpdate(
        req.params.id,
        { name, age, rollNo, studentClass, section },
        { new: true }
      );
      if (!student) return res.status(404).json({ error: "Student not found" });
      res.json(student);
    } else {
      const db = readDb();
      const sIndex = (db.students || []).findIndex((s: any) => s._id === req.params.id);
      if (sIndex === -1) return res.status(404).json({ error: "Student not found" });
      
      const updated = { ...db.students[sIndex], name, age: parseInt(age, 10), rollNo, studentClass, section };
      db.students[sIndex] = updated;
      writeDb(db);
      res.json(updated);
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to update student" });
  }
});


// Delete a student
router.delete("/:id", authMiddleware, async (req: any, res) => {
  try {
    const parentId = String(req.user.userId);

    if (mongoose.connection.readyState === 1) {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({ error: "Student not found (Invalid ID format)" });
      }
      
      const student = await Student.findById(req.params.id);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      await Student.findByIdAndDelete(req.params.id);
      res.json({ message: "Student deleted" });
    } else {
      const db = readDb();
      db.students = (db.students || []).filter((s: any) => {
        const sId = String(s._id || s.id);
        return sId !== String(req.params.id);
      });
      
      writeDb(db);
      res.json({ message: "Student deleted successfully" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to delete student" });
  }
});

// Admin delete student
router.delete("/admin/:id", authMiddleware, async (req: any, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({ error: "Student not found (Invalid ID format)" });
      }
      const student = await Student.findByIdAndDelete(req.params.id);
      if (!student) return res.status(404).json({ error: "Student not found" });
      res.json({ message: "Student deleted" });
    } else {
      const db = readDb();
      const initialLen = (db.students || []).length;
      db.students = (db.students || []).filter((s: any) => s._id !== req.params.id);
      if (db.students.length === initialLen) return res.status(404).json({ error: "Student not found" });
      writeDb(db);
      res.json({ message: "Student deleted" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to delete student" });
  }
});

// Subscribe student to a plan
router.put("/:id/subscribe", authMiddleware, async (req: any, res) => {
  try {
    const { planName } = req.body;
    const parentId = req.user.userId;

    if (mongoose.connection.readyState === 1 && !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: "Student not found" });
    }

    const isClearing = !planName || planName.toLowerCase() === "none" || planName.toLowerCase() === "clear" || planName === "";

    if (isClearing) {
      if (mongoose.connection.readyState === 1) {
        const student = await Student.findOneAndUpdate(
          getStudentQuery(req.params.id, parentId),
          { 
            subscribedPlan: "",
            planStartDate: null,
            planExpiryDate: null,
            planDaysRemaining: 0,
            planActive: false
          },
          { new: true }
        );
        if (!student) return res.status(404).json({ error: "Student not found" });
        return res.json(student);
      } else {
        const db = readDb();
        const sIndex = (db.students || []).findIndex((s: any) => s._id === req.params.id && s.parentId === parentId);
        if (sIndex === -1) return res.status(404).json({ error: "Student not found" });
        
        const updated = { 
          ...db.students[sIndex], 
          subscribedPlan: "",
          planStartDate: null,
          planExpiryDate: null,
          planDaysRemaining: 0,
          planActive: false
        };
        db.students[sIndex] = updated;
        writeDb(db);
        return res.json(updated);
      }
    }

    const startDate = new Date();
    const expiryDate = new Date();
    if (planName.toLowerCase().includes("daily")) {
      expiryDate.setDate(startDate.getDate() + 1);
    } else if (planName.toLowerCase().includes("weekly")) {
      expiryDate.setDate(startDate.getDate() + 7);
    } else if (planName.toLowerCase().includes("monthly")) {
      expiryDate.setMonth(startDate.getMonth() + 1);
    } else if (planName.toLowerCase().includes("quarterly")) {
      expiryDate.setMonth(startDate.getMonth() + 3);
    } else if (planName.toLowerCase().includes("half-yearly")) {
      expiryDate.setMonth(startDate.getMonth() + 6);
    } else if (planName.toLowerCase().includes("yearly")) {
      expiryDate.setFullYear(startDate.getFullYear() + 1);
    } else {
      expiryDate.setMonth(startDate.getMonth() + 1); // fallback monthly
    }

    const diffTime = Math.max(0, expiryDate.getTime() - startDate.getTime());
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (mongoose.connection.readyState === 1) {
      const student = await Student.findOneAndUpdate(
        getStudentQuery(req.params.id, parentId),
        { 
          subscribedPlan: planName,
          planStartDate: startDate,
          planExpiryDate: expiryDate,
          planDaysRemaining: daysRemaining,
          planActive: true
        },
        { new: true }
      );
      if (!student) return res.status(404).json({ error: "Student not found" });

      try {
        await User.findByIdAndUpdate(parentId, {
          subscribedPlan: planName,
          planStartDate: startDate,
          planExpiryDate: expiryDate,
          planDaysRemaining: daysRemaining,
          planActive: true
        });
        await Teacher.findByIdAndUpdate(parentId, {
          subscribedPlan: planName,
          planStartDate: startDate,
          planExpiryDate: expiryDate,
          planDaysRemaining: daysRemaining,
          planActive: true
        });
      } catch (err) {}

      res.json(student);
    } else {
      const db = readDb();
      const sIndex = (db.students || []).findIndex((s: any) => s._id === req.params.id && s.parentId === parentId);
      if (sIndex === -1) return res.status(404).json({ error: "Student not found" });
      
      const updated = { 
        ...db.students[sIndex], 
        subscribedPlan: planName,
        planStartDate: startDate.toISOString(),
        planExpiryDate: expiryDate.toISOString(),
        planDaysRemaining: daysRemaining,
        planActive: true 
      };
      db.students[sIndex] = updated;

      let uIdx = db.users.findIndex((u: any) => u._id === parentId);
      if (uIdx !== -1) {
        db.users[uIdx].subscribedPlan = planName;
        db.users[uIdx].planStartDate = startDate.toISOString();
        db.users[uIdx].planExpiryDate = expiryDate.toISOString();
        db.users[uIdx].planDaysRemaining = daysRemaining;
        db.users[uIdx].planActive = true;
      }
      let tIdx = (db.teachers || []).findIndex((t: any) => (t._id || t.id) === parentId);
      if (tIdx !== -1) {
        db.teachers[tIdx].subscribedPlan = planName;
        db.teachers[tIdx].planStartDate = startDate.toISOString();
        db.teachers[tIdx].planExpiryDate = expiryDate.toISOString();
        db.teachers[tIdx].planDaysRemaining = daysRemaining;
        db.teachers[tIdx].planActive = true;
      }

      writeDb(db);
      res.json(updated);
    }
  } catch (error) {
    console.error("Subscribe student error:", error);
    res.status(500).json({ error: "Failed to subscribe student" });
  }
});

export default router;
