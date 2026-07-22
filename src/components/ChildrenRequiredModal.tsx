import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, Check, Sparkles, HelpCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

interface ChildrenRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export function ChildrenRequiredModal({
  isOpen,
  onClose,
  title = "Register Your Child Details First",
  subtitle = "Please register your child's grade, section, and school parameters to select customized diets or active meal rosters."
}: ChildrenRequiredModalProps) {
  const { refreshStudents } = useCart();
  const { logout } = useAuth();
  const [studentForm, setStudentForm] = useState({
    name: "",
    age: "",
    rollNo: "",
    studentClass: "",
    section: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.name.trim() || !studentForm.age || !studentForm.studentClass || !studentForm.section) {
      toast.error("Please fill in all required child details.");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Registering child to your secure portal...");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...studentForm,
          rollNo: studentForm.rollNo || `GS-2026-${Math.floor(1000 + Math.random() * 9000)}`
        })
      });

      if (res.ok) {
        toast.success("Child registered successfully!", { id: toastId, icon: "🎉" });
        setStudentForm({ name: "", age: "", rollNo: "", studentClass: "", section: "" });
        
        // Refresh the global students/children list
        await refreshStudents();
        onClose();
      } else {
        const errData = await res.json().catch(() => null);
        if (res.status === 401 || errData?.error === "Invalid token") {
          toast.error("Your session has expired. Please log in again.", { id: toastId });
          logout();
          onClose();
        } else {
          toast.error(errData?.details || errData?.error || "Failed to register child.", { id: toastId });
        }
      }
    } catch (error) {
      toast.error("A network error occurred. Please try again.", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-5 md:p-6 overflow-hidden z-10"
          >
            {/* Design accents */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

            {/* Header close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon & Titles */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <UserPlus className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white tracking-tight leading-snug">
                  {title}
                </h3>
                <p className="text-[11px] text-slate-450 mt-1 leading-normal font-medium">
                  {subtitle}
                </p>
              </div>
            </div>

            {/* Detailed friendly guide explanation replacing the raw toast */}
            <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5 mb-4 text-[10.5px] leading-relaxed text-slate-400 flex gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                Connecting your child's class and grade to their daily accounts allows Canteen Chefs to customize pediatric meal portions and automate allergy-safe ingredient filters.
              </div>
            </div>

            {/* Interactive Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Student Name <span className="text-emerald-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Advik Sharma"
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-brand-emerald placeholder-slate-600"
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Age <span className="text-emerald-500">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    min="3"
                    max="20"
                    placeholder="7"
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-brand-emerald placeholder-slate-600"
                    value={studentForm.age}
                    onChange={(e) => setStudentForm({ ...studentForm, age: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Roll No (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. R-1049"
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-brand-emerald placeholder-slate-600"
                    value={studentForm.rollNo}
                    onChange={(e) => setStudentForm({ ...studentForm, rollNo: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Class / Grade <span className="text-emerald-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-2 text-white outline-none focus:border-brand-emerald text-xs font-semibold"
                    value={studentForm.studentClass}
                    onChange={(e) => setStudentForm({ ...studentForm, studentClass: e.target.value })}
                  >
                    <option value="">Select Class</option>
                    {["Pre-KG", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Section <span className="text-emerald-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-2 text-white outline-none focus:border-brand-emerald text-xs font-semibold"
                    value={studentForm.section}
                    onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value })}
                  >
                    <option value="">Select Section</option>
                    {["A", "B", "C", "D", "E"].map((sec) => (
                      <option key={sec} value={sec}>
                        Section {sec}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 justify-end pt-4 border-t border-white/5 mt-5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-[10.5px] uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg bg-brand-emerald hover:bg-emerald-400 hover:scale-[1.01] text-slate-950 font-black text-[10.5px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  {isLoading ? "Saving..." : "Save Child Details"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
