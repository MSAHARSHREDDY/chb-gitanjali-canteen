import { motion } from "framer-motion";
import { Check, Flame, Sparkles, Smile, ArrowRight, Star } from "lucide-react";
import toast from "react-hot-toast";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { ChildrenRequiredModal } from "../components/ChildrenRequiredModal";

const planBundles = [
  {
    name: "Daily Plan",
    price: "₹165",
    term: "per day",
    tagline: "Perfect for casual trial order days",
    benefits: [
      "Choice of 1 Breakfast or Lunch menu",
      "Fresh seasonal fruit cup included",
      "Same-day order cancellation till 7:00 AM",
      "Standard notification alerts"
    ],
    savings: "",
    badge: "Basic Trial",
    badgeBg: "bg-white/5 text-slate-200",
    borderGlow: "border-white/10/60",
    popular: false
  },
  {
    name: "Weekly Plan",
    price: "₹990",
    term: "per week",
    tagline: "Excellent choice for standard weekly routine school days",
    benefits: [
      "Choice of any chosen meal packages daily",
      "Choice of custom diet menu selection",
      "Same-day order modifications",
      "Weekly performance summary reports"
    ],
    savings: "",
    badge: "Popular Routine",
    badgeBg: "bg-white/5 text-slate-200",
    borderGlow: "border-white/10/60",
    popular: false
  },
  {
    name: "Monthly Plan",
    price: "₹3,900",
    term: "per month",
    tagline: "Most convenient for busy parents",
    benefits: [
      "Complete Breakfast + Lunch + Snacks daily",
      "100% personalized allergy-free menu",
      "Guaranteed priority serving",
      "Daily high-fidelity updates",
      "Free festive snack boxes"
    ],
    savings: "",
    badge: "Super Parent Choice",
    badgeBg: "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-yellow-300",
    popular: true,
    borderGlow: "border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.3)] shadow-xl",
    glowColor: "from-yellow-400/20 to-orange-500/20"
  }
];

export function Plans() {
  const { user } = useAuth();
  const isTeacher = !!user?.isTeacher;
  const navigate = useNavigate();
  const { students, refreshStudents } = useCart();
  const [selectedPlanForSelector, setSelectedPlanForSelector] = useState<{name: string, price: string} | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const handleSubscribeClick = async (plan: { name: string, price: string }) => {
    if (isTeacher) {
      const toastId = toast.loading(`Activating teacher subscription to ${plan.name}...`);
      try {
        const res = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ 
            subscribedPlan: plan.name,
            planActive: true
          })
        });

        if (res.ok) {
          const resData = await res.json();
          if (resData.user) {
            localStorage.setItem('user', JSON.stringify(resData.user));
            toast.success(`Success! Your teacher faculty subscription to ${plan.name} is now active.`, { id: toastId, icon: '🌟' });
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } else {
            toast.success(`Success! Your teacher faculty subscription to ${plan.name} is now active.`, { id: toastId, icon: '🌟' });
          }
        } else {
          const err = await res.json();
          toast.error(err.error || 'Failed to activate subscription.', { id: toastId });
        }
      } catch (err) {
        toast.error('Network failure completing subscription.', { id: toastId });
      }
      return;
    }

    if (students.length === 0) {
      toast.error("Please add a child profile first.");
      navigate('/add-child');
      return;
    }
    
    setSelectedPlanForSelector(plan);
    setSelectedStudentId(students[0].id || students[0]._id);
  };

  const handleDirectSubscribe = async (planName: string, studentId: string) => {
    const toastId = toast.loading(`Subscribing student to ${planName}...`);
    try {
      const res = await fetch(`/api/students/${studentId}/subscribe`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ planName })
      });

      if (res.ok) {
        toast.success(`Success! Student is now subscribed to ${planName}.`, { id: toastId, icon: '🌟' });
        if (refreshStudents) {
          await refreshStudents();
        }
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to activate subscription.', { id: toastId });
      }
    } catch (err) {
      toast.error('Network failure completing subscription.', { id: toastId });
    }
  };

  return (
    <div className="w-full relative min-h-screen bg-transparent pt-6 pb-12 overflow-x-hidden">
      
      {/* Exquisite Animated Background */}
      <div className="absolute inset-0 pointer-events-none select-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-gradient-to-br from-indigo-500/5 to-[#FF4D9D]/5 rounded-full blur-[100px] animate-float-slow"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[350px] h-[350px] bg-gradient-to-br from-[#FF6B6B]/5 to-emerald-500/5 rounded-full blur-[80px] animate-float-reverse"></div>
      </div>
  
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-10"
        >
          <span className="bg-[#15193B]/60 border-white/10 text-white backdrop-blur-md border border-white/40 shadow-lg text-[#FF8E53] text-[9px] font-sans font-black uppercase tracking-widest px-4 py-1.5 rounded-full inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#FF4D9D]" /> Parent Subscriptions
          </span>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight leading-tight mb-2">
            Nutritious Canteen Plans
          </h1>
          <p className="text-slate-400 text-[11px] sm:text-xs font-semibold uppercase tracking-wider leading-relaxed max-w-xl mx-auto">
            Choose the perfect subscription package to secure fresh, chef-cooked organic meals for your child daily.
          </p>
        </motion.div>
  
        {/* Premium Dark Glassmorphism Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {planBundles.map((plan, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="rounded-3xl pt-10 pb-6 px-6 relative flex flex-col justify-between transition-all duration-505 h-full bg-gradient-to-b from-slate-900/90 to-[#020211]/95 border-t border-t-white/20 border-l border-l-white/10 border-r border-r-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.4)]"
            >
              {/* Floating Plan Ribbon matching WeeklyMenu day ribbons */}
              <div className="absolute top-0 left-6 -translate-y-1/2">
                <span className="text-[8px] uppercase tracking-[0.2em] font-black bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-500 text-slate-1050 px-4 py-1.5 rounded-full shadow-[0_8px_16px_rgba(16,185,129,0.2)] border border-teal-300/30">
                  {plan.badge}
                </span>
              </div>
  
              {/* Floating particles for popular plans */}
              {plan.popular && (
                <div className="absolute -top-6 -right-3 text-yellow-400 animate-pulse opacity-100 pointer-events-none z-20">
                  <Star className="w-8 h-8 fill-current" />
                </div>
              )}
  
              <div>
                <div className="flex justify-between items-start gap-2 mb-4 mt-3">
                  <h3 className="font-display font-black text-xl mb-1 tracking-tight text-white drop-shadow-sm uppercase">
                    {plan.name}
                  </h3>
                  {plan.savings && (
                    <span className="text-[9px] font-black bg-slate-950 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-lg shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center gap-1 uppercase tracking-wide">
                      <Flame className="w-3 h-3 text-orange-400" /> {plan.savings}
                    </span>
                  )}
                </div>
                
                <p className="text-slate-400 text-[11px] mb-5 font-semibold leading-relaxed h-10">
                  {plan.tagline}
                </p>
  
                {/* Price Row */}
                <div className="mb-5">
                  <div className="flex items-baseline gap-1.5 text-white drop-shadow-md">
                    <span className="font-display font-black text-4xl tracking-tighter text-white">
                      {isTeacher 
                        ? `₹${Math.round(parseFloat(plan.price.replace(/[^\d.]/g, '').replace(',', '')) * 0.9).toLocaleString('en-IN')}` 
                        : plan.price}
                    </span>
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-none bg-slate-900 border border-white/10 px-2 py-0.5 rounded-md">
                      / {plan.term}
                    </span>
                  </div>
                  {isTeacher && (
                    <div className="mt-2 flex flex-col gap-0.5">
                      <span className="inline-flex self-start bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider">
                        🧑‍🏫 10% Teacher Privilege Discount
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold">
                        Reduced from {plan.price}/{plan.term}.
                      </span>
                    </div>
                  )}
                </div>
  
                {/* Divider resembling WeeklyMenu style */}
                <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent w-full mb-5"></div>
  
                {/* Benefits list */}
                <ul className="space-y-2 mb-6">
                  {plan.benefits.map((benefit, bIdx) => (
                    <li key={bIdx} className="flex items-start gap-2.5 text-xs text-slate-300 font-medium leading-relaxed drop-shadow-sm">
                      <div className="w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-white/5 bg-white/5">
                        <Check className="w-3 h-3 text-emerald-400" />
                      </div>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
  
              {/* Subscribe Student Button styled matching the WeeklyMenu CTA */}
              <button
                onClick={() => handleSubscribeClick({ name: plan.name, price: plan.price })}
                className="w-full py-3 rounded-xl font-display font-black text-xs uppercase tracking-widest transition-all duration-300 cursor-pointer hover:scale-[1.01] active:scale-95 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 text-slate-950 shadow-[0_10px_20px_rgba(16,185,129,0.1)] border-b border-teal-300/30"
              >
                <span className="flex items-center justify-center gap-1.5">
                  {isTeacher ? "Subscribe" : "Subscribe"}
                  <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
                </span>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Dynamic Student Pick Selector Overlay */}
      {selectedPlanForSelector && (
        <div className="fixed inset-0 bg-[#050519]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md w-full bg-slate-950 border border-white/15 rounded-3xl p-6 shadow-2xl relative text-left"
          >
            <h3 className="font-display font-black text-lg text-white mb-2 uppercase tracking-wide">Select Student</h3>
            <p className="text-slate-400 text-xs mb-5 font-medium leading-relaxed">
              Which student would you like to subscribe to the <span className="text-[#FF4D9D] font-bold">{selectedPlanForSelector.name}</span> plan?
            </p>

            <div className="space-y-3 mb-6 max-h-[240px] overflow-y-auto pr-1">
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Registered Children</label>
              {students.map((student) => {
                const sId = student.id || student._id;
                const isSelected = selectedStudentId === sId;
                return (
                  <div
                    key={sId}
                    onClick={() => setSelectedStudentId(sId)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                      isSelected 
                        ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                        : 'bg-slate-900 border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div>
                      <h4 className="text-white text-xs font-bold font-sans">{student.name}</h4>
                      <p className="text-slate-400 text-[10px] font-medium mt-0.5">{student.grade || student.studentClass || "N/A"}</p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelectedPlanForSelector(null)}
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-slate-405 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const plan = selectedPlanForSelector;
                  setSelectedPlanForSelector(null);
                  handleDirectSubscribe(plan.name, selectedStudentId);
                }}
                className="flex-1 py-3 bg-brand-emerald hover:bg-brand-emerald-dark text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg transition-all cursor-pointer text-center"
              >
                Confirm Subscription
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
