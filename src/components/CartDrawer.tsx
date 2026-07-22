import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, UserPlus, GraduationCap, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export function CartDrawer() {
  const { 
    isCartOpen, 
    closeCart, 
    items, 
    updateQuantity, 
    removeFromCart, 
    totalPrice, 
    clearCart,
    students,
    updateStudentName,
    addStudent,
    addToCart
  } = useCart();
  
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentAge, setNewStudentAge] = useState("");
  const [newStudentGrade, setNewStudentGrade] = useState("Class 1");
  const [newStudentSection, setNewStudentSection] = useState("A");
  const [showAddStudentInput, setShowAddStudentInput] = useState(false);

  const handleCheckoutClick = () => {
    closeCart();
    if (user) {
      navigate('/checkout');
    } else {
      toast('Please sign in to proceed with school canteen payment', { icon: '🔒' });
      openAuthModal();
    }
  };

  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newStudentName.trim();
    if (!name) {
      toast.error("Please enter a valid student name");
      return;
    }
    const age = newStudentAge.trim() || "7";
    addStudent({
      id: `sib-${Date.now()}`,
      name,
      age: parseInt(age),
      grade: newStudentGrade,
      section: newStudentSection,
      rollNo: `GS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      allergens: ['None'],
      intakeScore: 100
    });
    toast.success(`Student profile created for "${name}"!`, { icon: '🎓' });
    setNewStudentName("");
    setNewStudentAge("");
    setNewStudentGrade("Class 1");
    setNewStudentSection("A");
    setShowAddStudentInput(false);
  };

  // Strip prefix path "CATEGORY - Name" if it got appended by context, for clean client display
  const cleanItemName = (name: string) => {
    if (name.includes(" - ")) {
      return name.split(" - ").slice(1).join(" - ");
    }
    return name;
  };

  // Group items by menu item
  const groupedItems: { [menuItemId: string]: { item: typeof items[0], quantity: number, students: string[] } } = {};
  items.forEach(item => {
    const key = String(item.menuItemId || item.id);
    if (!groupedItems[key]) {
      groupedItems[key] = { item, quantity: 0, students: [] };
    }
    groupedItems[key].quantity += item.quantity;
    if (!groupedItems[key].students.includes(item.studentName)) {
      groupedItems[key].students.push(item.studentName);
    }
  });

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
          />
          
          {/* Slide out drawer sheet */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-slate-900 border-slate-800 text-white border-l shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0 relative overflow-hidden bg-slate-950">
              <div className="absolute inset-0 bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-9 h-9 rounded-xl bg-brand-emerald flex items-center justify-center text-white">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display font-black text-white text-lg leading-tight">
                    {user?.isTeacher ? "Teacher Lunch Bag" : "Student Lunch Bag"}
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gitanjali School Canteen</p>
                </div>
              </div>
              <button
                onClick={closeCart}
                className="text-slate-450 hover:text-white transition-colors relative z-10 p-2 cursor-pointer rounded-full hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Student Link for Parents */}
            {!user?.isTeacher && (
              <div className="bg-slate-950/80 px-6 py-4 border-b border-white/5 shrink-0 z-10">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-brand-sky" />
                    <span>Manage multiple student preferences</span>
                  </span>
                  <button
                    onClick={() => {
                      closeCart();
                      navigate('/add-child');
                    }}
                    className="text-brand-sky hover:text-brand-sky-dark flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Student Profile</span>
                  </button>
                </div>
              </div>
            )}

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin bg-slate-900">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center text-slate-400 border border-white/5">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h3 className="font-display font-black text-slate-200 text-sm">Your lunch bag is empty</h3>
                  <p className="text-slate-400 text-xs max-w-xs">Select nutrient-rich dishes from today's menu timeline to load them here.</p>
                  <button 
                    onClick={closeCart}
                    className="px-5 py-2 hover:bg-brand-emerald-dark bg-brand-emerald text-white font-display font-bold text-xs rounded-xl shadow-sm cursor-pointer mt-2 animate-pulse"
                  >
                    View Fresh Menu
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.keys(groupedItems).map((menuItemId) => {
                    const group = groupedItems[menuItemId];
                    const itemInfo = group.item;
                    return (
                      <div key={menuItemId} className="flex gap-4 group p-3.5 rounded-2xl bg-slate-950 border border-white/5 hover:border-white/10 transition-all duration-300">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/5 shrink-0 border border-white/10 relative">
                          {itemInfo.images && itemInfo.images.length > 1 ? (
                            <div className={`w-full h-full grid gap-0.5 bg-slate-900 ${itemInfo.images.length === 2 ? 'grid-cols-2' : itemInfo.images.length === 3 ? 'grid-cols-2 grid-rows-2' : 'grid-cols-2 grid-rows-2'}`}>
                              {itemInfo.images.slice(0, 4).map((imgUrl, i) => (
                                <img
                                  key={i}
                                  src={imgUrl}
                                  alt={`${itemInfo.name} ${i + 1}`}
                                  className={`w-full h-full object-cover ${itemInfo.images!.length === 3 && i === 2 ? 'col-span-2' : ''}`}
                                  referrerPolicy="no-referrer"
                                />
                              ))}
                            </div>
                          ) : itemInfo.image ? (
                            <img
                              src={itemInfo.image}
                              alt={itemInfo.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-transparent">
                              <span className="text-slate-300 text-[10px] uppercase font-bold">Menu</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-between py-0.5">
                          <div>
                            <div className="flex justify-between items-start gap-1">
                              <h4 className="text-white text-[13px] font-display font-bold leading-tight group-hover:text-brand-emerald transition-colors whitespace-normal break-words">
                                {cleanItemName(itemInfo.name)}
                              </h4>
                              <button
                                onClick={() => removeFromCart(itemInfo.id)}
                                className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer p-0.5 shrink-0"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-[#FF4D9D] font-display font-medium text-[10px] uppercase tracking-wider bg-[#FF4D9D]/10 px-2 py-0.5 rounded-full border border-[#FF4D9D]/25">Covered by Subscription</span>
                              {user?.isTeacher && (
                                <span className="text-xs font-bold text-white">x{group.quantity}</span>
                              )}
                            </div>
                          </div>

                          {/* Student assignment switcher for non-teachers */}
                          {!user?.isTeacher && (
                            <div className="mt-3 flex flex-col gap-1.5 pt-3 border-t border-white/5">
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Assign To Children:</span>
                              <div className="flex flex-wrap gap-1.5 mt-0.5">
                                {students.map((student) => {
                                  const isAssigned = items.some(i => String(i.menuItemId || i.id) === menuItemId && i.studentName === student.name);
                                  
                                  const handleCheckboxToggle = () => {
                                    if (isAssigned) {
                                      const target = items.find(i => String(i.menuItemId || i.id) === menuItemId && i.studentName === student.name);
                                      if (target) {
                                        removeFromCart(target.id);
                                        toast.success(`Removed from ${student.name}'s tray`);
                                      }
                                    } else {
                                      addToCart({
                                        id: itemInfo.menuItemId || itemInfo.id,
                                        name: itemInfo.name,
                                        price: itemInfo.price,
                                        image: itemInfo.image,
                                        quantity: 1
                                      }, student.name);
                                      toast.success(`Assigned to ${student.name}`);
                                    }
                                  };

                                  return (
                                    <label
                                      key={student.name}
                                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold cursor-pointer select-none transition-all duration-200 ${
                                        isAssigned
                                          ? "bg-brand-emerald/10 border-brand-emerald/30 text-brand-emerald shadow-[0_0_10px_rgba(16,185,129,0.05)]"
                                          : "bg-slate-950 border-white/5 text-slate-405 hover:bg-slate-900 hover:border-white/10"
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isAssigned}
                                        onChange={handleCheckboxToggle}
                                        className="w-3 h-3 rounded bg-slate-950 border-white/20 text-brand-emerald focus:ring-transparent focus:ring-offset-0 cursor-pointer accent-emerald-500"
                                      />
                                      <span>{student.name}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Clear Cart control */}
                  <div className="pt-2">
                    <button
                      onClick={clearCart}
                      className="text-slate-400 text-[11px] uppercase tracking-wider font-bold hover:text-rose-500 transition-colors flex items-center gap-1 cursor-pointer py-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Clear Lunch Tray
                    </button>
                  </div>
                </div>
              )}
            </div>

      {/* Footer Summary */}
      {items.length > 0 && (
        <div className="p-6 border-t border-white/10 bg-slate-950 relative overflow-hidden shrink-0">
          <button
            onClick={handleCheckoutClick}
            className="w-full py-3.5 bg-brand-emerald hover:bg-brand-emerald-dark text-white font-display font-bold uppercase tracking-wider text-xs transition-all rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-500/10"
          >
            Proceed to Daily Checkout <ArrowRight className="w-3.75 h-3.75" />
          </button>
          <p className="text-[10px] text-slate-500 font-display text-center mt-3">Pediatric tax & Gitanjali school hygienic kitchen serving included.</p>
        </div>
      )}
    </motion.div>
  </>
)}
</AnimatePresence>
  );
}
