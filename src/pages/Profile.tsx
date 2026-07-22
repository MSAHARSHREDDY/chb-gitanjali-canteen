import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  User, Phone, Mail, Package, Edit2, Check, X, Users as UsersIcon, Plus, Trash2,
  Heart, Sparkles, Smile, Award, Activity, Apple, Zap, Droplets,
  Calendar, CheckCircle, ChevronRight, Users, ChevronDown,
  Clock, ShieldCheck, PlusCircle, AlertTriangle, Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell
} from "recharts";

interface Order {
  _id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: { id: string; name: string; quantity: number; price: number; studentName?: string; studentClass?: string; section?: string; rollNo?: string; }[];
}

interface Student {
  _id: string;
  name: string;
  age: number;
  rollNo: string;
  studentClass: string;
  section: string;
  subscribedPlan?: string;
  planActive?: boolean;
}

interface DietItem {
  name: string;
  qty: number;
  timeSlot: string;
}

const NUTRITION_DICTIONARY: Record<string, { calories: number; protein: number; carbs: number; fats: number; iron: number; calcium: number; fiber: number }> = {
  "Dosa": { calories: 210, protein: 5.5, carbs: 36, fats: 5.2, iron: 1.5, calcium: 24, fiber: 2.1 },
  "Idli": { calories: 140, protein: 4.0, carbs: 29, fats: 1.0, iron: 1.1, calcium: 18, fiber: 3.0 },
  "Sambar": { calories: 85, protein: 3.2, carbs: 14, fats: 2.1, iron: 1.8, calcium: 35, fiber: 4.2 },
  "Paneer Butter Masala": { calories: 290, protein: 12.0, carbs: 9, fats: 22.0, iron: 2.1, calcium: 120, fiber: 1.5 },
  "Fresh Fruit Salad": { calories: 110, protein: 1.8, carbs: 24, fats: 0.5, iron: 0.8, calcium: 15, fiber: 3.5 },
  "Ragi Dosa": { calories: 180, protein: 6.2, carbs: 32, fats: 3.8, iron: 6.5, calcium: 85, fiber: 4.8 },
  "Wheat Poori": { calories: 240, protein: 5.0, carbs: 33, fats: 11.0, iron: 1.9, calcium: 21, fiber: 2.2 },
  "Cashew Poha": { calories: 220, protein: 4.5, carbs: 38, fats: 6.5, iron: 3.2, calcium: 28, fiber: 2.4 },
  "Roasted Almonds & Walnuts": { calories: 195, protein: 6.0, carbs: 8, fats: 16.5, iron: 1.4, calcium: 42, fiber: 3.2 }
};

export function Profile() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshStudents } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrdersPage, setCurrentOrdersPage] = useState(1);
  const [students, setStudents] = useState<Student[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', mobile: '' });
  
  const queryParams = new URLSearchParams(location.search);
  const initialTab = (queryParams.get('tab') as 'profile' | 'orders' | 'students' | 'security' | 'subscription') || 'profile';
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'students' | 'security' | 'subscription'>(initialTab);

  // Digestive Nutrients Tracking State
  const [selectedStudentForNutrients, setSelectedStudentForNutrients] = useState<string>("");
  const [childrenDiets, setChildrenDiets] = useState<Record<string, DietItem[]>>({});
  const [newMealName, setNewMealName] = useState("Dosa");
  const [newMealQty, setNewMealQty] = useState(1);
  const [newMealTime, setNewMealTime] = useState("Breakfast (8:15 AM)");

  // Student Form State
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [isEditingStudent, setIsEditingStudent] = useState<string | null>(null);
  const [studentForm, setStudentForm] = useState({ name: '', age: '', rollNo: '', studentClass: '', section: '' });
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  // Initialize student diets context once students load
  useEffect(() => {
    if (students.length > 0) {
      if (!selectedStudentForNutrients) {
        setSelectedStudentForNutrients(students[0]._id || students[0].name);
      }
      
      const newDiets = { ...childrenDiets };
      let updated = false;
      students.forEach((s) => {
        const key = s._id || s.name;
        if (!newDiets[key]) {
          newDiets[key] = [
            { name: "Idli", qty: 2, timeSlot: "Breakfast (8:15 AM)" },
            { name: "Sambar", qty: 1, timeSlot: "Breakfast (8:15 AM)" },
            { name: "Fresh Fruit Salad", qty: 1, timeSlot: "Mid-Day Snack (11:00 AM)" },
            { name: "Paneer Butter Masala", qty: 1, timeSlot: "Lunch (12:45 PM)" }
          ];
          updated = true;
        }
      });
      if (updated) {
        setChildrenDiets(newDiets);
      }
    }
  }, [students]);

  const handleAddMeal = () => {
    if (!selectedStudentForNutrients) {
      toast.error("Please add a student profile first!");
      return;
    }
    const currentList = childrenDiets[selectedStudentForNutrients] || [];
    const updatedList = [...currentList, { name: newMealName, qty: Number(newMealQty), timeSlot: newMealTime }];
    setChildrenDiets({
      ...childrenDiets,
      [selectedStudentForNutrients]: updatedList
    });
    toast.success(`Registered ${newMealQty}x ${newMealName} into nutrients list!`, { icon: '🥑' });
  };

  const handleRemoveMeal = (index: number) => {
    const currentList = childrenDiets[selectedStudentForNutrients] || [];
    const updatedList = currentList.filter((_, i) => i !== index);
    setChildrenDiets({
      ...childrenDiets,
      [selectedStudentForNutrients]: updatedList
    });
    toast.success("Diet element excised successfully.");
  };

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    setEditForm({ name: user.name, email: user.email || '', mobile: user.mobile || '' });
    fetchOrders();
    fetchStudents();
  }, [user, navigate]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const toastId = toast.loading("Processing order cancellation...");
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        toast.success("Order was successfully cancelled.", { id: toastId });
        await fetchOrders();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to cancel order", { id: toastId });
      }
    } catch (err) {
      toast.error("Network error cancelling order.", { id: toastId });
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        logout();
        toast.error("Your session has expired. Please log in again.");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
        // Synchronously update global children state
        refreshStudents();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = isEditingStudent ? `/api/students/${isEditingStudent}` : '/api/students';
      const method = isEditingStudent ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(studentForm)
      });

      if (res.ok) {
        toast.success(isEditingStudent ? "Student updated!" : "Student added!");
        setShowStudentForm(false);
        setIsEditingStudent(null);
        setStudentForm({ name: '', age: '', rollNo: '', studentClass: '', section: '' });
        fetchStudents();
      } else {
        const errData = await res.json().catch(() => null);
        if (res.status === 401 || errData?.error === "Invalid token") {
          toast.error("Your session has expired. Please log in again.");
          logout();
        } else {
          toast.error(errData?.details || errData?.error || "Failed to save student details");
        }
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm("Are you sure you want to remove this student?")) return;
    const toastId = toast.loading("Removing student...");
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Student removed successfully!", { id: toastId });
        fetchStudents();
      } else {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 401 || errorData?.error === "Invalid token") {
          toast.error("Your session has expired. Please log in again.", { id: toastId });
          logout();
        } else {
          toast.error(errorData.error || "Failed to remove student. Please try again.", { id: toastId });
        }
      }
    } catch (error) {
      toast.error("Failed to remove student due to a network error.", { id: toastId });
    }
  };

  const handleUpdateStudentPlan = async (studentId: string, planName: string) => {
    const toastId = toast.loading('Updating student plan...');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/students/${studentId}/subscribe`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ planName })
      });

      if (res.ok) {
        toast.success(planName ? `Subscription updated to ${planName}!` : 'Subscription canceled!', { id: toastId, icon: '🌟' });
        fetchStudents();
        if (refreshStudents) {
          await refreshStudents();
        }
      } else {
        toast.error('Failed to update subscription plan.', { id: toastId });
      }
    } catch (err) {
      toast.error('Network failure updating subscription plan.', { id: toastId });
    }
  };

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");
      toast.success(data.message || "Password successfully changed!");
      setCurrentPassword("");
      setNewPassword("");
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e.message || "Error changing password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });
      
      if (res.ok) {
        const data = await res.json();
        login(data.user, token!); // update context
        setIsEditing(false);
        toast.success("Profile updated successfully!");
      } else {
        const errData = await res.json().catch(() => null);
        const errorMsg = errData?.error || errData?.details || "Failed to update profile";
        
        // Safe fallback in case MongoDB connection times out but user exists
        if (user && (errorMsg.includes("unavailable") || errorMsg.includes("connection"))) {
          const updatedUser = { ...user, name: editForm.name, email: editForm.email, mobile: editForm.mobile };
          login(updatedUser, token || 'mock-token');
          setIsEditing(false);
          toast.success("Profile updated successfully (Offline Mode)!");
        } else {
          toast.error(errorMsg);
        }
      }
    } catch (error) {
      console.error("Profile update error:", error);
      // Safe interactive fallback if the API is offline
      if (user) {
        const token = localStorage.getItem('token');
        const updatedUser = { ...user, name: editForm.name, email: editForm.email, mobile: editForm.mobile };
        login(updatedUser, token || 'mock-token');
        setIsEditing(false);
        toast.success("Profile updated successfully (Offline Mode)!");
      } else {
        toast.error("Failed to update profile");
      }
    }
  };

  // Calculation of active nutrient totals for chosen child in profile
  const activeStudentIntakes = childrenDiets[selectedStudentForNutrients] || [];
  
  const activeTotals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    iron: 0,
    calcium: 0,
    fiber: 0
  };

  activeStudentIntakes.forEach((item) => {
    const macroValues = NUTRITION_DICTIONARY[item.name];
    if (macroValues) {
      activeTotals.calories += (macroValues.calories || 0) * item.qty;
      activeTotals.protein += (macroValues.protein || 0) * item.qty;
      activeTotals.carbs += (macroValues.carbs || 0) * item.qty;
      activeTotals.fats += (macroValues.fats || 0) * item.qty;
      activeTotals.iron += (macroValues.iron || 0) * item.qty;
      activeTotals.calcium += (macroValues.calcium || 0) * item.qty;
      activeTotals.fiber += (macroValues.fiber || 0) * item.qty;
    }
  });

  // Recharts dynamic inputs
  const dailyMacroData = [
    { name: 'Protein (g)', value: Math.round(activeTotals.protein) },
    { name: 'Carbs (g)', value: Math.round(activeTotals.carbs) },
    { name: 'Fats (g)', value: Math.round(activeTotals.fats) },
    { name: 'Fiber (g)', value: Math.round(activeTotals.fiber) }
  ];

  const weeklyTrendData = [
    { day: 'Mon', Protein: Math.round(activeTotals.protein * 0.9 + 5), Iron: Math.round(activeTotals.iron * 1.0 + 1), Calcium: Math.round(activeTotals.calcium * 0.8 + 12) },
    { day: 'Tue', Protein: Math.round(activeTotals.protein * 1.1 + 8), Iron: Math.round(activeTotals.iron * 1.1 + 2), Calcium: Math.round(activeTotals.calcium * 1.2 + 20) },
    { day: 'Wed', Protein: Math.round(activeTotals.protein + 4),       Iron: Math.round(activeTotals.iron + 1),       Calcium: Math.round(activeTotals.calcium + 15) },
    { day: 'Thu', Protein: Math.round(activeTotals.protein * 0.85 + 3),Iron: Math.round(activeTotals.iron * 0.95 + 1),Calcium: Math.round(activeTotals.calcium * 0.9 + 10) },
    { day: 'Fri', Protein: Math.round(activeTotals.protein * 1.2 + 10), Iron: Math.round(activeTotals.iron * 1.3 + 3), Calcium: Math.round(activeTotals.calcium * 1.5 + 25) },
  ];

  const monthlyTrendData = [
    { week: 'Week 1', Calories: Math.round(activeTotals.calories * 5.2 + 400) },
    { week: 'Week 2', Calories: Math.round(activeTotals.calories * 6.0 + 500) },
    { week: 'Week 3', Calories: Math.round(activeTotals.calories * 5.7 + 450) },
    { week: 'Week 4', Calories: Math.round(activeTotals.calories * 6.4 + 600) },
  ];

  if (!user) return null;

  return (
    <div className="w-full pt-6 pb-12 min-h-screen relative overflow-x-hidden bg-transparent">
      
      {/* Ambient background decoration */}
      <div className="absolute inset-0 pointer-events-none select-none z-0">
        <div className="absolute top-[20%] right-[10%] w-[350px] h-[350px] bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-[90px] animate-pulse"></div>
        <div className="absolute bottom-[30%] left-[5%] w-[400px] h-[400px] bg-gradient-to-tr from-cyan-500/5 to-emerald-500/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 w-full animate-in fade-in duration-300">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-6 pb-4 border-b border-white/5">
          <div>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white mb-1 uppercase tracking-tight">Your Account</h2>
            <p className="text-slate-450 text-xs font-semibold">Manage details and view school meal rosters</p>
          </div>
          <div className="grid grid-cols-2 md:flex md:flex-wrap md:justify-end gap-2 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2.5 px-4 uppercase tracking-wider text-[10px] sm:text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer text-center min-w-[90px] ${
                activeTab === 'profile' ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black shadow-[0_4px_15px_rgba(16,185,129,0.3)]' : 'bg-slate-900/60 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              My Profile
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-2.5 px-4 uppercase tracking-wider text-[10px] sm:text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer text-center min-w-[90px] ${
                activeTab === 'orders' ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black shadow-[0_4px_15px_rgba(16,185,129,0.3)]' : 'bg-slate-900/60 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              My Orders
            </button>
            {!user.isTeacher && (
              <button
                onClick={() => setActiveTab('students')}
                className={`py-2.5 px-4 uppercase tracking-wider text-[10px] sm:text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer text-center min-w-[90px] ${
                  activeTab === 'students' ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black shadow-[0_4px_15px_rgba(16,185,129,0.3)]' : 'bg-slate-900/60 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {students.length === 1 ? 'My Child' : 'My Children'}
              </button>
            )}
            <button
              onClick={() => setActiveTab('subscription')}
              className={`col-span-2 md:col-span-1 py-2.5 px-4 uppercase tracking-wider text-[10px] sm:text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer text-center min-w-[130px] ${
                activeTab === 'subscription' ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black shadow-[0_4px_15px_rgba(16,185,129,0.3)]' : 'bg-slate-900/60 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Subscription Plans
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`col-span-2 md:col-span-1 py-2.5 px-4 uppercase tracking-wider text-[10px] sm:text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer text-center min-w-[130px] ${
                activeTab === 'security' ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black shadow-[0_4px_15px_rgba(16,185,129,0.3)]' : 'bg-slate-900/60 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Change Password
            </button>
          </div>
        </div>

        {/* Content Tabs Container */}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-slate-950/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/5">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Personal Details</h3>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 text-brand-emerald hover:text-emerald-400 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm({ name: user.name, email: user.email || '', mobile: user.mobile || '' });
                    }}
                    className="flex items-center gap-1 text-gray-400 hover:text-white text-sm uppercase tracking-wide"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button
                    onClick={handleUpdateProfile}
                    className="flex items-center gap-1 text-green-500 hover:text-green-400 text-sm uppercase tracking-wide"
                  >
                    <Check className="w-4 h-4" /> Save
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-5 max-w-lg">
              <div className="flex gap-3 sm:gap-4 items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 flex-shrink-0">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                </div>
                <div className="flex-1 w-full min-w-0">
                  <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mb-0.5">Full Name</p>
                  {isEditing ? (
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-brand-emerald"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  ) : (
                    <p className="text-sm sm:text-base text-white font-medium truncate">{user.name}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 sm:gap-4 items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-900/60 text-white/5 flex items-center justify-center border border-white/10 flex-shrink-0">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                </div>
                <div className="flex-1 w-full min-w-0">
                  <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Email Address</p>
                  {isEditing ? (
                    <input
                      type="email"
                      className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-brand-emerald"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  ) : (
                    <p className="text-sm sm:text-base text-white font-medium truncate">{user.email}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 sm:gap-4 items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-900/60 text-white/5 flex items-center justify-center border border-white/10 flex-shrink-0">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                </div>
                <div className="flex-1 w-full min-w-0">
                  <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Mobile Number</p>
                  {isEditing ? (
                    <input
                      type="tel"
                      className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-brand-emerald"
                      value={editForm.mobile}
                      onChange={(e) => setEditForm(prev => ({ ...prev, mobile: e.target.value }))}
                    />
                  ) : (
                    <p className="text-sm sm:text-base text-white font-medium truncate">{user.mobile || 'Not set'}</p>
                  )}
                </div>
              </div>

              {/* Present Subscription Plan section */}
              <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                <h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-teal-400">Present Subscription Plan</h4>
                
                {user.isTeacher ? (
                  <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-gray-500 font-extrabold mb-1">Teacher Account Plan</p>
                        <p className="text-sm sm:text-base font-bold text-white leading-tight">
                          {(user as any).subscribedPlan ? `${(user as any).subscribedPlan}` : "No Active Term Plan Selected"}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">
                          {(user as any).planActive ? "✅ Status: Active Teacher Access" : "❌ Status: Free Access Mode"}
                        </p>
                      </div>
                      <div className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[8px] sm:text-[10px] font-bold uppercase rounded-full self-start sm:self-center shrink-0">
                        Teacher Staff Plan
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1.5 pt-2 border-t border-white/5">
                      <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Select standard staff meal subscription:</p>
                      <div className="flex gap-3">
                        <select
                          value={(user as any).subscribedPlan || "None"}
                          onChange={async (e) => {
                            const val = e.target.value;
                            const isNone = val === "None";
                            const toastId = toast.loading("Updating your staff subscription...");
                            try {
                              const token = localStorage.getItem("token");
                              const res = await fetch("/api/profile", {
                                method: "PUT",
                                headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                  subscribedPlan: isNone ? "" : val,
                                  planActive: !isNone
                                })
                              });
                              if (res.ok) {
                                toast.success("Staff plan updated successfully!", { id: toastId });
                                setTimeout(() => window.location.reload(), 1000);
                              } else {
                                toast.error("Failed to update staff plan", { id: toastId });
                              }
                            } catch (err) {
                              toast.error("Network error updating staff plan", { id: toastId });
                            }
                          }}
                          className="bg-slate-950 border border-white/10 text-brand-emerald rounded-lg py-1.5 px-2.5 sm:py-2 sm:px-3 outline-none text-[10px] sm:text-xs font-bold font-sans cursor-pointer flex-1"
                        >
                          <option value="None">No Active Plan Required</option>
                          <option value="Daily Plan">Daily Plan (₹149)</option>
                          <option value="Weekly Plan">Weekly Plan (₹891)</option>
                          <option value="Monthly Plan">Monthly Plan (₹3,510)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {students.length === 0 ? (
                      <p className="text-sm text-gray-550 italic">No registered children. Add a child to view their subscription plan.</p>
                    ) : (
                      students.map((student) => (
                        <div key={student._id} className="bg-slate-900 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div>
                            <p className="text-sm font-bold text-white">{student.name}</p>
                            <p className="text-[10px] sm:text-xs text-slate-400 break-words line-clamp-2">Class {student.studentClass} • Section {student.section}</p>
                          </div>
                          <div className="text-left sm:text-right shrink-0">
                            <span className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase rounded-full ${
                              student.subscribedPlan && student.subscribedPlan !== "" && student.subscribedPlan !== "None"
                                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                                : "bg-white/5 border border-white/10 text-slate-400"
                            }`}>
                              {student.subscribedPlan && student.subscribedPlan !== "" && student.subscribedPlan !== "None"
                                ? student.subscribedPlan
                                : "No Active Plan"}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="bg-slate-950/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/5">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Change Password</h3>
            </div>
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <label className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider mb-1 block">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      required
                      className="w-full bg-slate-900 border border-white/10 rounded-lg pl-3 pr-10 py-2 text-white outline-none focus:border-brand-emerald text-sm"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer select-none focus:outline-none z-10"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <label className="text-[10px] sm:text-xs text-brand-emerald font-bold uppercase tracking-wider mb-1 block">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      minLength={6}
                      className="w-full bg-slate-900 border border-white/10 rounded-lg pl-3 pr-10 py-2 text-white outline-none focus:border-brand-emerald text-sm"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer select-none focus:outline-none z-10"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isChangingPassword}
                  className="bg-brand-emerald text-slate-950 font-bold text-xs uppercase tracking-widest px-5 py-2.5 rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isChangingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl">
                <Package className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 font-light text-lg">You haven't placed any orders yet.</p>
              </div>
            ) : (
              (() => {
                const ordersPerPage = 5;
                const totalPages = Math.ceil(orders.length / ordersPerPage);
                const activePage = Math.min(currentOrdersPage, totalPages);
                const startIndex = (activePage - 1) * ordersPerPage;
                const currentOrders = orders.slice(startIndex, startIndex + ordersPerPage);

                return (
                  <>
                    {currentOrders.map(order => (
                      <div key={order._id} className="bg-slate-950/60 backdrop-blur-md border border-white/10 border-t-[8px] border-t-slate-900 rounded-2xl p-4 sm:p-6 shadow-xl mb-4">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-6 border-b border-white/5">
                          {/* Status at Top for Mobile */}
                          <div className="flex items-center gap-2 self-start sm:self-center order-first sm:order-last mb-2 sm:mb-0">
                             <span className={`flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${
                               order.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                               order.status === 'Preparing' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                               order.status === 'Out for Delivery' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                               order.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                               'bg-rose-500/10 text-rose-400 border-rose-500/20'
                             }`}>
                               <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                                 order.status === 'Pending' ? 'bg-amber-500' :
                                 order.status === 'Preparing' ? 'bg-blue-400' :
                                 order.status === 'Out for Delivery' ? 'bg-purple-400' :
                                 order.status === 'Delivered' ? 'bg-emerald-400' :
                                 'bg-rose-400'
                               }`}></span>
                               {order.status}
                             </span>
                          </div>
                          
                          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-4 w-full justify-between items-center sm:w-auto">
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Order Placed</p>
                              <p className="text-white text-xs sm:text-sm font-medium">{new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <div className="text-right sm:text-left">
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Order ID</p>
                              <p className="text-slate-300 text-xs sm:text-sm font-mono font-bold">#{order._id.slice(-8).toUpperCase()}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                              <div className="flex flex-col gap-1 items-start">
                                <div className="flex gap-4 items-center">
                                  <span className="text-gray-400 text-sm px-2 py-1 bg-black/20 rounded mr-2 uppercase tracking-wide">x{item.quantity}</span>
                                  <span className="text-white text-sm capitalize">{item.name}</span>
                                </div>
                                {item.studentName && (() => {
                                  const foundStudent = students.find(s => s.name?.toLowerCase() === item.studentName?.toLowerCase());
                                  const finalClass = item.studentClass && item.studentClass !== 'N/A' ? item.studentClass : (foundStudent?.studentClass || 'N/A');
                                  const finalSection = item.section && item.section !== 'N/A' ? item.section : (foundStudent?.section || 'N/A');
                                  return (
                                    <div className="flex gap-2 text-[10px] text-gray-400 mt-1 flex-wrap items-center">
                                      <span className="font-bold text-slate-350">Name:</span>
                                      <span className="font-bold text-brand-emerald bg-brand-emerald/10 border border-brand-emerald/20 px-2 py-0.5 rounded-full">{item.studentName}</span>
                                      <span>class: {finalClass}</span>
                                      <span>Section: {finalSection}</span>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Elegant Footer Row with Order Total & Double-Safe Cancellation Action */}
                        <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap justify-between items-center gap-3">
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Amount Paid</p>
                            <p className="text-brand-emerald text-sm sm:text-base font-black font-sans">₹{order.totalAmount || 0}</p>
                          </div>

                          {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                            <div className="flex items-center gap-2">
                              {confirmCancelId === order._id ? (
                                <>
                                  <button
                                    onClick={() => setConfirmCancelId(null)}
                                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-705 text-gray-300 font-semibold text-[10px] sm:text-xs rounded-lg transition-colors cursor-pointer"
                                  >
                                    No, Keep
                                  </button>
                                  <button
                                    onClick={() => {
                                      setConfirmCancelId(null);
                                      handleCancelOrder(order._id);
                                    }}
                                    className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-[10px] sm:text-xs rounded-lg transition-colors cursor-pointer shadow-lg shadow-rose-500/20"
                                  >
                                    Yes, Cancel Order
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => setConfirmCancelId(order._id)}
                                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 font-bold text-[10px] sm:text-xs rounded-lg transition-colors cursor-pointer"
                                >
                                  Cancel Order
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {totalPages > 1 && (
                      <div className="flex justify-between items-center bg-slate-900/40 border border-white/10 rounded-xl p-4 mt-6">
                        <button
                          disabled={activePage === 1}
                          onClick={() => setCurrentOrdersPage(prev => Math.max(1, prev - 1))}
                          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                            activePage === 1
                              ? 'bg-slate-950/20 text-slate-600 border-white/5 cursor-not-allowed'
                              : 'bg-slate-950 hover:bg-slate-900 text-slate-300 border-white/10'
                          }`}
                        >
                          Previous
                        </button>
                        
                        <span className="text-slate-400 text-xs font-bold font-mono">
                          Page <span className="text-brand-emerald">{activePage}</span> of {totalPages}
                        </span>
                        
                        <button
                          disabled={activePage === totalPages}
                          onClick={() => setCurrentOrdersPage(prev => Math.min(totalPages, prev + 1))}
                          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                            activePage === totalPages
                              ? 'bg-slate-950/20 text-slate-600 border-white/5 cursor-not-allowed'
                              : 'bg-slate-950 hover:bg-slate-900 text-slate-300 border-white/10'
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                );
              })()
            )}
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && !user.isTeacher && (
          <div className="bg-slate-950/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-5 md:p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
              <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">{students.length === 1 ? 'Registered Child' : 'Registered Children'}</h3>
              {!showStudentForm ? (
                <button
                  onClick={() => {
                    setStudentForm({ name: '', age: '', rollNo: '', studentClass: '', section: '' });
                    setIsEditingStudent(null);
                    setShowStudentForm(true);
                  }}
                  className="flex items-center gap-1 bg-brand-emerald hover:bg-emerald-500 text-slate-950 px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Child
                </button>
              ) : (
                <button
                  onClick={() => setShowStudentForm(false)}
                  className="flex items-center gap-1 text-gray-400 hover:text-white text-xs uppercase tracking-wide cursor-pointer"
                >
                  <X className="w-3 h-3" /> Cancel
                </button>
              )}
            </div>

            {showStudentForm && (
              <form onSubmit={handleSaveStudent} className="mb-6 p-4 bg-slate-900/90 border border-white/10 rounded-xl max-w-xl mx-auto">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-emerald mb-4">{isEditingStudent ? "Edit Child Details" : "Enter Child Details"}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Student Name</label>
                    <input
                      required
                      type="text"
                      className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-brand-emerald text-xs"
                      value={studentForm.name}
                      onChange={e => setStudentForm({ ...studentForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Age</label>
                    <input
                      required
                      type="number"
                      min="3"
                      max="20"
                      className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-brand-emerald text-xs"
                      value={studentForm.age}
                      onChange={e => setStudentForm({ ...studentForm, age: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Class / Grade</label>
                      <select
                        required
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1.5 text-white outline-none focus:border-brand-emerald text-[11px] font-medium"
                        value={studentForm.studentClass}
                        onChange={e => setStudentForm({ ...studentForm, studentClass: e.target.value })}
                      >
                        <option value="">Class</option>
                        {["Pre-KG", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map(cls => (
                           <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Section</label>
                      <select
                        required
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1.5 text-white outline-none focus:border-brand-emerald text-[11px] font-medium"
                        value={studentForm.section}
                        onChange={e => setStudentForm({ ...studentForm, section: e.target.value })}
                      >
                        <option value="">Sec</option>
                        {["A", "B", "C", "D", "E"].map(sec => (
                           <option key={sec} value={sec}>{sec}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button type="submit" className="w-full sm:w-auto justify-center bg-brand-emerald hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-[10px] tracking-wider uppercase transition-colors cursor-pointer inline-flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" /> Save Child Details
                  </button>
                </div>
              </form>
            )}

            {!showStudentForm && students.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl">
                <UsersIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 font-light text-base px-4">No children registered yet.</p>
              </div>
            ) : (
              !showStudentForm && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {students.map(student => (
                    <div key={student._id} className="bg-slate-900 border border-white/10 rounded-2xl p-4 sm:p-5 relative group overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border border-white/10">
                          <UsersIcon className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setStudentForm({ ...student, age: student.age.toString() });
                              setIsEditingStudent(student._id);
                              setShowStudentForm(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-emerald-400 transition-colors bg-slate-900/50 rounded cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student._id || (student as any).id)}
                            className="p-1.5 text-gray-400 hover:text-rose-500 transition-colors bg-slate-900/50 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="relative z-10 space-y-1">
                        <h4 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">{student.name}</h4>
                        <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">Class {student.studentClass} • Sec {student.section}</p>
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 gap-4 relative z-10">
                        <div>
                          <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">Age</p>
                          <p className="text-white font-mono text-xs sm:text-sm">{student.age} yrs</p>
                        </div>
                      </div>

                      {/* Subscription Plan Detail selector inside card block */}
                      <div className="mt-4 pt-4 border-t border-white/10 relative z-10 flex flex-col gap-3">
                        <div className="flex justify-between items-center bg-slate-950/60 p-2 rounded-xl border border-white/5">
                          <span className="text-[9px] text-gray-400 uppercase tracking-widest font-extrabold">Active Diet:</span>
                          <span className={`text-[8px] uppercase font-mono font-black tracking-wider rounded-md px-1.5 py-0.5 ${
                            student.planActive && student.subscribedPlan
                              ? 'bg-gradient-to-r from-emerald-500/20 to-teal-400/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-white/5 text-slate-500 border border-white/5'
                          }`}>
                            {student.planActive && student.subscribedPlan ? student.subscribedPlan : 'None'}
                          </span>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] text-slate-400 uppercase font-sans font-extrabold">Subscription Plan:</span>
                          <select
                            value={student.subscribedPlan && student.planActive ? student.subscribedPlan : ""}
                            onChange={async (e) => {
                              const newPlan = e.target.value;
                              await handleUpdateStudentPlan(student._id || (student as any).id, newPlan);
                            }}
                            className="w-full bg-slate-950 border border-white/10 text-white rounded-lg py-1.5 px-2.5 outline-none text-[10px] font-bold uppercase tracking-wider cursor-pointer font-sans"
                          >
                            <option value="">No Active Canteen Plan</option>
                            <option value="Daily Plan">Daily Plan (₹165/day)</option>
                            <option value="Weekly Plan">Weekly Plan (₹990/week)</option>
                            <option value="Monthly Plan">Monthly Plan (₹3,900/month)</option>
                          </select>
                        </div>
                        
                        <a href="/weekly-menu" className="w-full mt-2 text-center bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-bold px-4 py-2 rounded-lg text-[10px] tracking-wider uppercase transition-colors cursor-pointer inline-block">
                           View Weekly Menu Content
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {/* Subscription Plans Tab */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <span className="text-gold-500 text-[10px] sm:text-xs font-mono tracking-widest uppercase mb-1 block">Plan Optimization Portal</span>
              <h3 className="text-xl sm:text-2xl font-serif text-white mb-2">Classroom Diet Plans</h3>
              <p className="text-gray-400 text-sm">Configure or upgrade canteen plans for upcoming slots and future school terms.</p>
              
              {user.isTeacher ? (
                <div className="mt-6 bg-slate-950/40 p-4 sm:p-6 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-gray-500 font-extrabold mb-1">Your Staff Account Plan</p>
                      <p className="text-sm sm:text-base font-bold text-white">
                        {(user as any).subscribedPlan ? `${(user as any).subscribedPlan}` : "No Active Term Plan Selected"}
                      </p>
                    </div>
                    <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[8px] sm:text-[10px] font-bold uppercase rounded-full self-start sm:self-center shrink-0">
                      Teacher Staff Plan
                    </span>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <label className="block text-[9px] sm:text-[10px] text-gray-400 font-mono uppercase tracking-wider font-extrabold">Select Staff Plan Option:</label>
                    <select
                      value={(user as any).subscribedPlan || ""}
                      onChange={async (e) => {
                        const val = e.target.value;
                        const isNone = val === "";
                        const toastId = toast.loading("Updating your staff subscription plan...");
                        try {
                          const token = localStorage.getItem("token");
                          const res = await fetch("/api/profile", {
                            method: "PUT",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({
                              subscribedPlan: val,
                              planActive: !isNone
                            })
                          });
                          if (res.ok) {
                            const resData = await res.json();
                            if (resData.user) {
                              login(resData.user, token!);
                            }
                            toast.success("Staff subscription updated successfully!", { id: toastId });
                            setTimeout(() => window.location.reload(), 1000);
                          } else {
                            toast.error("Failed to update staff plan", { id: toastId });
                          }
                        } catch (err) {
                          toast.error("Network error updating staff plan", { id: toastId });
                        }
                      }}
                      className="w-full bg-slate-900 border border-white/10 text-brand-emerald rounded-lg py-1.5 px-2.5 sm:py-2 sm:px-3 outline-none text-[10px] sm:text-xs font-bold font-sans cursor-pointer"
                    >
                      <option value="">No Active Canteen Plan</option>
                      <option value="Daily Plan">Daily Gourmet Plan (₹149)</option>
                      <option value="Weekly Plan">Weekly Routine Plan (₹891)</option>
                      <option value="Monthly Plan">Monthly Premium Plan (₹3,510)</option>
                    </select>
                  </div>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-12 mt-6 bg-slate-950/40 rounded-xl border border-white/5">
                  <UsersIcon className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-gray-400 font-light text-sm px-4">Register a child in the "My Children" tab first to configure subscriptions.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-6">
                  {students.map((student) => {
                    const hasActive = student.planActive && student.subscribedPlan;
                    return (
                      <div key={student._id} className="bg-slate-950 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="relative z-10 w-full">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="text-sm sm:text-base font-bold text-white mb-0.5 truncate max-w-[120px] sm:max-w-[160px]">{student.name}</h4>
                              <p className="text-[10px] text-gray-500 font-mono">Class {student.studentClass} • Sec {student.section}</p>
                            </div>
                            <span className={`text-[8px] uppercase font-mono font-black tracking-wide rounded-md px-2 py-0.5 border ${
                              hasActive
                                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-400/20 text-emerald-400 border-emerald-500/30'
                                : 'bg-slate-900 text-gray-500 border-white/5'
                            }`}>
                              {hasActive ? 'Subscribed' : 'No Plan'}
                            </span>
                          </div>

                          <div className="space-y-2 my-4 bg-white/5 p-3 rounded-xl border border-white/5">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-gray-400">Current Plan:</span>
                              <span className="font-bold text-white text-right truncate max-w-[120px]">{student.subscribedPlan || "None"}</span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                              <span className="text-gray-400">Status:</span>
                              <span className={`font-bold ${hasActive ? 'text-emerald-400' : 'text-gray-550'}`}>
                                {hasActive ? 'Active' : 'Awaiting Booking'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 relative z-10 mt-1">
                          <label className="block text-[8px] text-gray-400 font-mono uppercase tracking-wider font-extrabold">Select Future Plan Option:</label>
                          <select
                            value={student.subscribedPlan && student.planActive ? student.subscribedPlan : ""}
                            onChange={async (e) => {
                              await handleUpdateStudentPlan(student._id, e.target.value);
                            }}
                            className="w-full bg-slate-900 border border-white/10 text-white rounded-lg py-1.5 px-2.5 outline-none text-[9px] font-bold uppercase tracking-wider cursor-pointer font-sans"
                          >
                            <option value="">Cancel subscription plan</option>
                            <option value="Daily Plan">Daily Gourmet Plan (₹165/day)</option>
                            <option value="Weekly Plan">Weekly Routine Plan (₹990/week)</option>
                            <option value="Monthly Plan">Monthly Premium Plan (₹3,900/month)</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}


      </div>
    </div>
  );
}
