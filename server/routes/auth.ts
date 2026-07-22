import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import { User } from "../models/User.js";
import { Teacher } from "../models/Teacher.js";
import { Parent } from "../models/Parent.js";
import { Student } from "../models/Student.js";
import { authMiddleware } from "../middleware/auth.js";
import { readDb, writeDb, generateId } from "../utils/fallbackDb.js";

const router = express.Router();
const getJwtSecret = () => process.env.JWT_SECRET || "fallback-secret-do-not-use-in-production";

// Configure Resend Client
const getResendClient = () => {
  if (process.env.RESEND_API_KEY) {
    return new Resend(process.env.RESEND_API_KEY);
  }
  return null;
};

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    let user: any;
    if (mongoose.connection.readyState === 1) {
      user = await User.findOne({ email });
    } else {
      const db = readDb();
      user = db.users.find((u: any) => u.email === email);
    }

    if (!user) {
      return res.status(404).json({ error: "No account with that email address exists." });
    }

    // Generate dynamic 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 600000); // Expires in 10 minutes

    if (mongoose.connection.readyState === 1) {
      user.resetPasswordToken = otp;
      user.resetPasswordExpires = expiry;
      await user.save();
    } else {
      const db = readDb();
      const idx = db.users.findIndex((u: any) => u.email === email);
      if (idx !== -1) {
        db.users[idx].resetPasswordToken = otp;
        db.users[idx].resetPasswordExpires = expiry.toISOString();
        writeDb(db);
      }
    }

    const emailSubject = "Your Password Reset OTP Code";
    const emailBodyTxt = `You requested a password reset. Your 6-digit verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.`;
    const emailBodyHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0d0d0e; color: #ffffff; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid #10b981;">
        <h2 style="color: #10b981; text-align: center;">Gitanjali Canteen</h2>
        <hr style="border-top: 1px solid #1f1f23;" />
        <p style="font-size: 16px; line-height: 1.5; color: #cbd5e1;">You requested a password reset. Please use the following 6-digit verification code to complete the process:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; padding: 12px 24px; background-color: #1a1a1d; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; color: #10b981; display: inline-block;">${otp}</span>
        </div>
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">This code is valid for 10 minutes. If you did not request this, you can safely ignore this email.</p>
      </div>
    `;

    const resend = getResendClient();
    if (resend) {
      const resendFrom = process.env.RESEND_FROM || "onboarding@resend.dev";
      console.log(`Attempting to send OTP via Resend API from ${resendFrom}...`);
      try {
        await resend.emails.send({
          from: resendFrom,
          to: user.email,
          subject: emailSubject,
          html: emailBodyHtml,
        });
        console.log(`[RESEND SENT CODE SUCCESS] OTP code sent via Resend to ${user.email}`);
        return res.json({ message: "A 6-digit OTP verification code has been successfully sent to your email address." });
      } catch (resendError) {
        console.error("Resend API error:", resendError);
        // continue to fallback to Nodemailer transpiler if Resend fails
      }
    }

    // Default Nodemailer Send Option
    const mailOptions = {
      from: `"Gitanjali Canteen" <${process.env.EMAIL_USER || "saharshreddym59@gmail.com"}>`,
      to: user.email,
      subject: emailSubject,
      text: emailBodyTxt,
      html: emailBodyHtml
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Nodemailer error sending email:", error);
        console.log(`[SANDBOX LOG RESET CODE] A mock reset code was generated: ${otp}`);
        // Fallback response with descriptive, supportive message. Never returns otp to browser
        return res.json({ 
          message: "A 6-digit OTP verification code has been successfully registered on the server. Please check your inbox or server logs."
        });
      } else {
        console.log("Nodemailer email successfully sent: " + info.response);
        return res.json({ message: "A 6-digit OTP verification code has been successfully sent to your email address." });
      }
    });

  } catch (error: any) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Failed to process forgot password request" });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: "Email and OTP are required" });

    let user: any;
    if (mongoose.connection.readyState === 1) {
      user = await User.findOne({
        email,
        resetPasswordToken: otp,
        resetPasswordExpires: { $gt: Date.now() }
      });
    } else {
      const db = readDb();
      user = db.users.find((u: any) => 
        u.email === email && 
        u.resetPasswordToken === otp && 
        new Date(u.resetPasswordExpires).getTime() > Date.now()
      );
    }

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired 6-digit verification code." });
    }

    res.json({ success: true, message: "Code verified successfully!" });
  } catch (error: any) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ error: "Failed to verify OTP code" });
  }
});

router.post("/auto-reset", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    let userId: string;
    let oldUser: any;
    
    // Generate 10-char random password
    const newPassword = Math.random().toString(36).slice(-10);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if (mongoose.connection.readyState === 1) {
      const user = await User.findOneAndUpdate(
        { email },
        { password: hashedPassword },
        { new: true }
      );
      if (!user) return res.status(404).json({ error: "User not found" });
      userId = user._id;
      oldUser = { id: user._id, email: user.email, name: user.name, mobile: user.mobile, isAdmin: user.isAdmin };
    } else {
      const db = readDb();
      const userIndex = db.users.findIndex((u: any) => u.email === email);
      if (userIndex === -1) return res.status(404).json({ error: "User not found" });
      
      db.users[userIndex].password = hashedPassword;
      writeDb(db);
      
      const u = db.users[userIndex];
      userId = u.id;
      oldUser = { id: u.id, email: u.email, name: u.name, mobile: u.mobile, isAdmin: u.isAdmin };
    }

    const token = jwt.sign({ userId, email: oldUser.email }, getJwtSecret(), { expiresIn: "365d" });

    res.json({
      message: "Password auto-generated successfully",
      token,
      user: oldUser,
      newPassword
    });

  } catch (error) {
    res.status(500).json({ error: "Server error during auto-reset" });
  }
});

router.post("/change-password", authMiddleware, async (req: any, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: "Missing required fields" });

    let userId = req.user.userId;
    let user;

    if (mongoose.connection.readyState === 1) {
      user = await User.findById(userId);
    } else {
      const db = readDb();
      user = db.users.find((u: any) => u._id === userId);
    }

    if (!user) return res.status(404).json({ error: "User not found" });

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if (mongoose.connection.readyState === 1) {
      await User.findByIdAndUpdate(userId, { password: hashedPassword });
    } else {
      const db = readDb();
      const userIndex = db.users.findIndex((u: any) => u._id === userId);
      db.users[userIndex].password = hashedPassword;
      writeDb(db);
    }

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to change password" });
  }
});

router.post("/signup", async (req, res) => {
  try {
    const { name, email, mobile, password, isTeacher } = req.body;
    
    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let existingUser: any;
    if (process.env.MONGODB_URI && process.env.MONGODB_URI !== "*****") {
      if (mongoose.connection.readyState !== 1) {
        return res.status(500).json({ error: "Database connection unavailable. Please check MongoDB Atlas IP Whitelist (0.0.0.0/0)." });
      }
      existingUser = await User.findOne({ email: new RegExp(`^${email.toLowerCase().trim()}$`, "i") });
    } else {
      const db = readDb();
      existingUser = db.users.find((u: any) => u.email.toLowerCase().trim() === email.toLowerCase().trim());
    }

    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let newUser: any;
    if (process.env.MONGODB_URI && process.env.MONGODB_URI !== "*****") {
      const userInstance = new User({ name, email, mobile, password: hashedPassword, isTeacher: !!isTeacher });
      await userInstance.save();
      newUser = userInstance;

      // Add to separate parents collection if isParent
      if (!isTeacher) {
        const parentInstance = new Parent({
          userId: userInstance._id,
          name,
          email,
          mobile
        });
        await parentInstance.save();
      }
    } else {
      const db = readDb();
      newUser = {
        _id: generateId(),
        name,
        email,
        mobile,
        password: hashedPassword,
        isAdmin: false,
        isTeacher: !!isTeacher,
        isParent: !isTeacher
      };
      db.users.push(newUser);

      // Add to fallback parents array if isParent
      if (!isTeacher) {
        db.parents = db.parents || [];
        db.parents.push({
          _id: generateId(),
          userId: newUser._id,
          name,
          email,
          mobile
        });
      }
      
      writeDb(db);
    }

    const token = jwt.sign({ userId: newUser._id, email: newUser.email }, getJwtSecret(), { expiresIn: "365d" });

    res.status(201).json({ token, user: { id: newUser._id, name: newUser.name, email: newUser.email, mobile: newUser.mobile, isAdmin: newUser.isAdmin, isParent: newUser.isParent !== false, isTeacher: !!newUser.isTeacher } });
  } catch (error: any) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Failed to sign up" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Auto-seed teacher credential if they log in as default teacher
    if (normalizedEmail === "teacher@gitanjali.com") {
      let teacherUser: any;
      if (process.env.MONGODB_URI && process.env.MONGODB_URI !== "*****" && mongoose.connection.readyState === 1) {
        teacherUser = await User.findOne({ email: new RegExp(`^${normalizedEmail}$`, "i") });
        if (!teacherUser) {
          const hashedPassword = await bcrypt.hash("teacher123", 10);
          teacherUser = new User({
            name: "Teacher Account",
            email: "teacher@gitanjali.com",
            mobile: "9999999999",
            password: hashedPassword,
            isAdmin: false,
            isTeacher: true,
            isParent: false
          });
          await teacherUser.save();
        }
      } else {
        const db = readDb();
        teacherUser = db.users.find((u: any) => u.email.toLowerCase().trim() === normalizedEmail);
        if (!teacherUser) {
          const hashedPassword = await bcrypt.hash("teacher123", 10);
          teacherUser = {
            _id: generateId(),
            name: "Teacher Account",
            email: "teacher@gitanjali.com",
            mobile: "9999999999",
            password: hashedPassword,
            isAdmin: false,
            isTeacher: true,
            isParent: false
          };
          db.users.push(teacherUser);
          writeDb(db);
        }
      }
    }

    let user: any;
    if (process.env.MONGODB_URI && process.env.MONGODB_URI !== "*****") {
      if (mongoose.connection.readyState !== 1) {
        return res.status(500).json({ error: "Database connection unavailable. Please check MongoDB Atlas IP Whitelist (0.0.0.0/0)." });
      }
      user = await User.findOne({ email: new RegExp(`^${normalizedEmail}$`, "i") });
    } else {
      const db = readDb();
      user = db.users.find((u: any) => u.email.toLowerCase().trim() === normalizedEmail);
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id || user.id, email: user.email }, getJwtSecret(), { expiresIn: "365d" });

    let computedDaysRemaining = user.planDaysRemaining || 0;
    if (user.planExpiryDate) {
      const diff = new Date(user.planExpiryDate).getTime() - Date.now();
      computedDaysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    res.json({ token, user: { id: user._id || user.id, name: user.name, email: user.email, mobile: user.mobile, isAdmin: !!user.isAdmin, isParent: user.isParent !== false, isTeacher: !!user.isTeacher, subscribedPlan: user.subscribedPlan || "", planActive: !!user.planActive, planDaysRemaining: computedDaysRemaining } });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to login", details: error.message, stack: error.stack });
  }
});

router.post("/logout", async (req, res) => {
  try {
    // Standard stateless logout only requires client to delete token.
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to logout" });
  }
});

router.get("/user", authMiddleware, async (req: any, res) => {
  try {
    let user: any;
    let isTeacher = false;
    if (mongoose.connection.readyState === 1) {
      user = await User.findById(req.user.userId).select("-password");
      if (!user) {
        user = await Teacher.findById(req.user.userId).select("-password");
        if (user) isTeacher = true;
      }
    } else {
      const db = readDb();
      user = (db.users || []).find((u: any) => u._id === req.user.userId);
      if (!user) {
        if (!db.teachers) db.teachers = [];
        user = db.teachers.find((t: any) => (t._id || t.id) === req.user.userId);
        if (user) isTeacher = true;
      }
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    let planStr = user.subscribedPlan;
    let active = !!user.planActive;
    let expiry = user.planExpiryDate;

    if (!isTeacher && !user.isAdmin && (!planStr || !active)) {
      // Fallback to student plans for parent accounts
      let parentStudents: any[] = [];
      if (mongoose.connection.readyState === 1) {
        parentStudents = await Student.find({
          $or: [
            { parentId: req.user.userId },
            { parentId: new mongoose.Types.ObjectId(req.user.userId) }
          ]
        }).lean();
      } else {
        const db = readDb();
        parentStudents = (db.students || []).filter((s: any) => s.parentId === req.user.userId);
      }
      const studentWithPlan = parentStudents.find(s => s.planActive && s.subscribedPlan);
      if (studentWithPlan) {
        planStr = studentWithPlan.subscribedPlan;
        active = true;
        expiry = studentWithPlan.planExpiryDate;
      }
    }

    let computedDaysRemaining = user.planDaysRemaining || 0;
    if (expiry) {
      const diff = new Date(expiry).getTime() - Date.now();
      computedDaysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    res.json({
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        isAdmin: !!user.isAdmin,
        isParent: !isTeacher && user.isParent !== false,
        isTeacher: isTeacher || !!user.isTeacher,
        subscribedPlan: planStr || "",
        planActive: active,
        planDaysRemaining: computedDaysRemaining
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

function getPlanDates(planName: string, planActive: boolean) {
  if (!planName || !planActive) {
    return {
      planStartDate: null,
      planExpiryDate: null,
      planDaysRemaining: 0
    };
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
  const planDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    planStartDate: startDate,
    planExpiryDate: expiryDate,
    planDaysRemaining
  };
}

router.put("/profile", authMiddleware, async (req: any, res) => {
  try {
    const { name, email, mobile, subscribedPlan, planActive } = req.body;
    let user: any;
    let isTeacher = false;

    if (mongoose.connection.readyState === 1) {
      user = await User.findById(req.user.userId);
      if (!user) {
        user = await Teacher.findById(req.user.userId);
        if (user) isTeacher = true;
      }
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (email && email.toLowerCase().trim() !== user.email.toLowerCase().trim()) {
        const existingUser = await User.findOne({ email: new RegExp(`^${email.toLowerCase().trim()}$`, "i") });
        const existingTeacher = await Teacher.findOne({ email: new RegExp(`^${email.toLowerCase().trim()}$`, "i") });
        if ((existingUser && existingUser._id.toString() !== user._id.toString()) || 
            (existingTeacher && existingTeacher._id.toString() !== user._id.toString())) {
          return res.status(400).json({ error: "Email is already in use by another account" });
        }
        user.email = email.toLowerCase().trim();
      }
      
      if (name) user.name = name;
      if (mobile !== undefined) user.mobile = mobile;
      
      const newPlanActive = planActive !== undefined ? planActive : user.planActive;
      const newSubscribedPlan = subscribedPlan !== undefined ? subscribedPlan : user.subscribedPlan;

      if (subscribedPlan !== undefined || planActive !== undefined) {
        user.subscribedPlan = newSubscribedPlan;
        user.planActive = newPlanActive;

        const dateFields = getPlanDates(newSubscribedPlan, newPlanActive);
        user.planStartDate = dateFields.planStartDate;
        user.planExpiryDate = dateFields.planExpiryDate;
        user.planDaysRemaining = dateFields.planDaysRemaining;
      }
      
      await user.save();

      // Update separate parents collection if isParent
      if (!isTeacher && !user.isTeacher) {
        await Parent.findOneAndUpdate(
          { userId: user._id },
          { name: user.name, email: user.email, mobile: user.mobile },
          { upsert: true }
        );
      }

      return res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          isAdmin: !!user.isAdmin,
          isTeacher: isTeacher || !!user.isTeacher,
          isParent: !isTeacher && user.isParent !== false,
          subscribedPlan: user.subscribedPlan || "",
          planActive: !!user.planActive,
          planStartDate: user.planStartDate || null,
          planExpiryDate: user.planExpiryDate || null,
          planDaysRemaining: user.planDaysRemaining || 0
        }
      });
    } else {
      const db = readDb();
      let idx = (db.users || []).findIndex((u: any) => u._id === req.user.userId);
      if (idx !== -1) {
        user = db.users[idx];
        if (email && email.toLowerCase().trim() !== user.email.toLowerCase().trim()) {
          const emailExists = db.users.some((u: any) => u._id !== req.user.userId && u.email.toLowerCase().trim() === email.toLowerCase().trim()) || 
                              (db.teachers || []).some((t: any) => (t._id || t.id) !== req.user.userId && t.email.toLowerCase().trim() === email.toLowerCase().trim());
          if (emailExists) {
            return res.status(400).json({ error: "Email is already in use by another account" });
          }
          db.users[idx].email = email.toLowerCase().trim();
        }
        if (name) db.users[idx].name = name;
        if (mobile !== undefined) db.users[idx].mobile = mobile;
        
        const newPlanActive = planActive !== undefined ? planActive : (db.users[idx].planActive || false);
        const newSubscribedPlan = subscribedPlan !== undefined ? subscribedPlan : (db.users[idx].subscribedPlan || "");

        if (subscribedPlan !== undefined || planActive !== undefined) {
          db.users[idx].subscribedPlan = newSubscribedPlan;
          db.users[idx].planActive = newPlanActive;

          const dateFields = getPlanDates(newSubscribedPlan, newPlanActive);
          db.users[idx].planStartDate = dateFields.planStartDate ? dateFields.planStartDate.toISOString() : null;
          db.users[idx].planExpiryDate = dateFields.planExpiryDate ? dateFields.planExpiryDate.toISOString() : null;
          db.users[idx].planDaysRemaining = dateFields.planDaysRemaining;
        }

        // Synchronize separate parents fallback if user is a parent
        if (!user.isTeacher) {
          db.parents = db.parents || [];
          let pIdx = db.parents.findIndex((p: any) => p.userId === req.user.userId);
          if (pIdx !== -1) {
            db.parents[pIdx].name = db.users[idx].name;
            db.parents[pIdx].email = db.users[idx].email;
            db.parents[pIdx].mobile = db.users[idx].mobile;
          } else {
            db.parents.push({
              _id: generateId(),
              userId: req.user.userId,
              name: db.users[idx].name,
              email: db.users[idx].email,
              mobile: db.users[idx].mobile
            });
          }
        }

        writeDb(db);
        user = db.users[idx];
      } else {
        if (!db.teachers) db.teachers = [];
        idx = db.teachers.findIndex((t: any) => (t._id || t.id) === req.user.userId);
        if (idx !== -1) {
          isTeacher = true;
          user = db.teachers[idx];
          if (email && email.toLowerCase().trim() !== user.email.toLowerCase().trim()) {
            const emailExists = db.users.some((u: any) => u.email.toLowerCase().trim() === email.toLowerCase().trim()) || 
                                db.teachers.some((t: any) => (t._id || t.id) !== req.user.userId && t.email.toLowerCase().trim() === email.toLowerCase().trim());
            if (emailExists) {
              return res.status(400).json({ error: "Email is already in use by another account" });
            }
            db.teachers[idx].email = email.toLowerCase().trim();
          }
          if (name) db.teachers[idx].name = name;
          if (mobile !== undefined) db.teachers[idx].mobile = mobile;
          
          const newPlanActive = planActive !== undefined ? planActive : (db.teachers[idx].planActive || false);
          const newSubscribedPlan = subscribedPlan !== undefined ? subscribedPlan : (db.teachers[idx].subscribedPlan || "");

          if (subscribedPlan !== undefined || planActive !== undefined) {
            db.teachers[idx].subscribedPlan = newSubscribedPlan;
            db.teachers[idx].planActive = newPlanActive;

            const dateFields = getPlanDates(newSubscribedPlan, newPlanActive);
            db.teachers[idx].planStartDate = dateFields.planStartDate ? dateFields.planStartDate.toISOString() : null;
            db.teachers[idx].planExpiryDate = dateFields.planExpiryDate ? dateFields.planExpiryDate.toISOString() : null;
            db.teachers[idx].planDaysRemaining = dateFields.planDaysRemaining;
          }
          writeDb(db);
          user = db.teachers[idx];
        }
      }

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      return res.json({
        user: {
          id: user._id || user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          isAdmin: !!user.isAdmin,
          isTeacher: isTeacher || !!user.isTeacher,
          isParent: !isTeacher && user.isParent !== false,
          subscribedPlan: user.subscribedPlan || "",
          planActive: !!user.planActive,
          planStartDate: user.planStartDate || null,
          planExpiryDate: user.planExpiryDate || null,
          planDaysRemaining: user.planDaysRemaining || 0
        }
      });
    }
  } catch (error: any) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Teacher Signup
router.post("/teacher/signup", async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;
    
    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let existingTeacher: any;
    if (process.env.MONGODB_URI && process.env.MONGODB_URI !== "*****") {
      if (mongoose.connection.readyState !== 1) {
        return res.status(500).json({ error: "Database connection unavailable." });
      }
      existingTeacher = await Teacher.findOne({ email: new RegExp(`^${email.toLowerCase().trim()}$`, "i") });
    } else {
      const db = readDb();
      if (!db.teachers) db.teachers = [];
      existingTeacher = db.teachers.find((t: any) => t.email.toLowerCase().trim() === email.toLowerCase().trim());
    }

    if (existingTeacher) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let newTeacher: any;
    if (process.env.MONGODB_URI && process.env.MONGODB_URI !== "*****") {
      const teacherInstance = new Teacher({ name, email, mobile, password: hashedPassword, isTeacher: true });
      await teacherInstance.save();
      newTeacher = teacherInstance;
    } else {
      const db = readDb();
      if (!db.teachers) db.teachers = [];
      newTeacher = {
        _id: generateId(),
        name,
        email,
        mobile,
        password: hashedPassword,
        isTeacher: true
      };
      db.teachers.push(newTeacher);
      writeDb(db);
    }

    const token = jwt.sign({ userId: newTeacher._id, email: newTeacher.email, isTeacher: true }, getJwtSecret(), { expiresIn: "365d" });

    res.status(201).json({
      token,
      user: {
        id: newTeacher._id,
        name: newTeacher.name,
        email: newTeacher.email,
        mobile: newTeacher.mobile,
        isAdmin: false,
        isParent: false,
        isTeacher: true
      }
    });
  } catch (error: any) {
    console.error("Teacher Signup error:", error);
    res.status(500).json({ error: "Failed to register as teacher" });
  }
});

// Teacher Login
router.post("/teacher/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Auto-seed teacher credential if needed
    if (normalizedEmail === "teacher@gitanjali.com") {
      let doc: any;
      if (process.env.MONGODB_URI && process.env.MONGODB_URI !== "*****" && mongoose.connection.readyState === 1) {
        doc = await Teacher.findOne({ email: new RegExp(`^${normalizedEmail}$`, "i") });
        if (!doc) {
          const hashedPassword = await bcrypt.hash("teacher123", 10);
          doc = new Teacher({
            name: "Teacher Account",
            email: "teacher@gitanjali.com",
            mobile: "9999999999",
            password: hashedPassword,
            isTeacher: true
          });
          await doc.save();
        }
      } else {
        const db = readDb();
        if (!db.teachers) db.teachers = [];
        doc = db.teachers.find((t: any) => t.email.toLowerCase().trim() === normalizedEmail);
        if (!doc) {
          const hashedPassword = await bcrypt.hash("teacher123", 10);
          doc = {
            _id: generateId(),
            name: "Teacher Account",
            email: "teacher@gitanjali.com",
            mobile: "9999999999",
            password: hashedPassword,
            isTeacher: true
          };
          db.teachers.push(doc);
          writeDb(db);
        }
      }
    }

    let teacher: any;
    if (process.env.MONGODB_URI && process.env.MONGODB_URI !== "*****") {
      teacher = await Teacher.findOne({ email: new RegExp(`^${normalizedEmail}$`, "i") });
    } else {
      const db = readDb();
      if (!db.teachers) db.teachers = [];
      teacher = db.teachers.find((t: any) => t.email.toLowerCase().trim() === normalizedEmail);
    }

    if (!teacher) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, teacher.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: teacher._id || teacher.id, email: teacher.email, isTeacher: true }, getJwtSecret(), { expiresIn: "365d" });

    let computedDaysRemaining = teacher.planDaysRemaining || 0;
    if (teacher.planExpiryDate) {
      const diff = new Date(teacher.planExpiryDate).getTime() - Date.now();
      computedDaysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    res.json({
      token,
      user: {
        id: teacher._id || teacher.id,
        name: teacher.name,
        email: teacher.email,
        mobile: teacher.mobile,
        isAdmin: false,
        isParent: false,
        isTeacher: true,
        subscribedPlan: teacher.subscribedPlan || "",
        planActive: !!teacher.planActive,
        planDaysRemaining: computedDaysRemaining
      }
    });
  } catch (error) {
    console.error("Teacher Login error:", error);
    res.status(500).json({ error: "Failed to login as teacher" });
  }
});

// Teacher Auto reset
router.post("/teacher/auto-reset", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    let userId: string;
    let oldTeacher: any;
    
    const newPassword = Math.random().toString(36).slice(-10);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if (mongoose.connection.readyState === 1) {
      const teacher = await Teacher.findOneAndUpdate(
        { email },
        { password: hashedPassword },
        { new: true }
      );
      if (!teacher) return res.status(404).json({ error: "Teacher account not found" });
      userId = teacher._id;
      oldTeacher = { id: teacher._id, email: teacher.email, name: teacher.name, mobile: teacher.mobile, isTeacher: true };
    } else {
      const db = readDb();
      if (!db.teachers) db.teachers = [];
      const idx = db.teachers.findIndex((t: any) => t.email === email);
      if (idx === -1) return res.status(404).json({ error: "Teacher account not found" });
      
      db.teachers[idx].password = hashedPassword;
      writeDb(db);
      
      const t = db.teachers[idx];
      userId = t._id || t.id;
      oldTeacher = { id: userId, email: t.email, name: t.name, mobile: t.mobile, isTeacher: true };
    }

    const token = jwt.sign({ userId, email: oldTeacher.email, isTeacher: true }, getJwtSecret(), { expiresIn: "365d" });

    res.json({
      message: "Password auto-generated successfully",
      token,
      user: oldTeacher,
      newPassword
    });
  } catch (error) {
    res.status(500).json({ error: "Server error during teacher auto-reset" });
  }
});

export default router;
