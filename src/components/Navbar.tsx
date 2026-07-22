import { Link, useLocation, useNavigate } from "react-router-dom";
import { Coffee, Menu as MenuIcon, X, ShoppingBag, User, LogOut, Bell, Compass, Heart, Award, ArrowRight, Home as HomeIcon, Calendar, Star, Phone, Truck, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../utils/cn";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const navLinksStatic = [
  { name: "Home", path: "/", icon: HomeIcon },
  { name: "Menu", path: "/weekly-menu", icon: Calendar },
  { name: "Plans", path: "/plans", icon: Star },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItems, openCart } = useCart();
  const { user, openAuthModal, logout } = useAuth();

  const dynamicNavLinks = [
    { name: "Home", path: "/", icon: HomeIcon },
    { name: "Menu", path: "/weekly-menu", icon: Calendar },
    { name: "Plans", path: "/plans", icon: Star },
  ];

  const [announcements, setAnnouncements] = useState<any[]>(() => {
    const saved = localStorage.getItem("user_announcements");
    if (saved) return JSON.parse(saved);
    return [
      { id: 1, text: "🥦 Superfood Wednesday! Spinach & Corn sandwiches have a 15% discount.", time: "Just now" },
      { id: 2, text: "🎒 Weekly Canteen plans updated with fresh seasonal fruits.", time: "1 hour ago" },
      { id: 3, text: "🎉 Congratulations! Gitanjali Canteen received high FSSAI rating again.", time: "1 day ago" }
    ];
  });

  const clearAnnouncements = () => {
    setAnnouncements([]);
    localStorage.setItem("user_announcements", JSON.stringify([]));
    setShowNotifications(false);
    toast.success("Announcements cleared");
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 rounded-none border-b",
        isScrolled 
          ? "bg-slate-950/95 border-white/20 py-1.5 sm:py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl" 
          : "bg-slate-950/80 border-white/10 py-2 sm:py-3.5 backdrop-blur-md"
      )}
    >

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between">
        {/* Logo with Apple/Stripe-level elegance */}
        <Link to="/" className="flex items-center gap-2 group cursor-pointer hover:scale-102 transition-all duration-300">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-tr from-white to-white/80 flex items-center justify-center text-blue-600 shadow-lg shadow-white/10 group-hover:scale-105 transition-transform duration-300">
            <Coffee className="w-4.5 h-4.5 sm:w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-black text-white text-sm sm:text-base md:text-lg tracking-tight leading-none group-hover:text-blue-100 transition-colors drop-shadow-sm">
              CHB Gitanjali
            </span>
            <span className="font-sans font-bold text-blue-200 text-[8px] tracking-wide uppercase leading-none mt-0.5 sm:mt-1">
              chb-gitanjali-school-canteen
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center md:gap-1.5 lg:gap-4 xl:gap-6">
          {dynamicNavLinks.map((link) => {
            const isActive = location.pathname === link.path;
            const isPlan = link.name === "Plans";
            return (
              <Link
                key={link.name}
                to={link.path}
                className={cn(
                  "flex items-center gap-1.5 text-xs lg:text-[14px] font-display font-semibold transition-all relative py-1 md:py-1.5 px-2 lg:px-3.5 rounded-full hover:bg-white/10 cursor-pointer group shrink-0",
                  isActive 
                    ? "text-white bg-white/20 shadow-[0_0_15px_rgba(255,255,255,0.3)]" 
                    : "text-blue-100 hover:text-white",
                  isPlan && !isActive ? "bg-gradient-to-r from-orange-500/20 to-rose-500/20 text-orange-100 hover:text-white hover:from-orange-500/40 hover:to-rose-500/40 border border-orange-400/30 font-bold" : ""
                )}
              >
                <span className="relative z-10 flex items-center gap-1 lg:gap-1.5">
                  <link.icon className={cn("w-3.5 h-3.5 lg:w-4 lg:h-4", isPlan ? "text-orange-400 group-hover:text-orange-300" : "")} />
                  {link.name}
                  {isPlan && <span className="absolute -top-1 -right-2 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400"></span></span>}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-white/10 to-purple-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-full" />
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator-light"
                    className="absolute bottom-0 inset-x-0 h-0.5 bg-white/20 text-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls - Right Side */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications Panel Trigger */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 sm:p-2.5 text-white hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:scale-110 rounded-full transition-all duration-300 relative cursor-pointer"
            >
              <Bell className="w-4.5 h-4.5 sm:w-5 sm:h-5 animate-pulse text-white font-bold" />
              {announcements.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span>
              )}
            </button>

            {/* Notification Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="absolute -right-12 sm:right-0 mt-3 w-[285px] sm:w-72 max-w-[calc(100vw-24px)] bg-slate-950 border border-white/10 rounded-xl p-3 shadow-2xl z-50 text-[11px]"
                >
                  <div className="font-display font-medium text-white text-[12px] border-b border-white/10 pb-1.5 mb-1.5 flex justify-between items-center">
                    <span className="flex items-center gap-1.5">📢 Announcements</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {announcements.length > 0 && (
                        <button 
                          onClick={clearAnnouncements}
                          className="text-[9px] text-rose-400 hover:text-rose-350 font-bold uppercase flex items-center gap-0.5 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-2.5 h-2.5" /> Clear
                        </button>
                      )}
                      <button 
                        onClick={() => setShowNotifications(false)}
                        className="text-gray-400 hover:text-white text-xs font-bold px-1 rounded hover:bg-white/5 cursor-pointer transition-all"
                        title="Close notifications"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5">
                    {announcements.length === 0 ? (
                      <p className="text-slate-500 text-center py-3 italic">No announcements today.</p>
                    ) : (
                      announcements.map((notif) => (
                        <div key={notif.id} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                          <p className="text-slate-300 leading-relaxed font-sans">{notif.text}</p>
                          <span className="text-[8px] text-slate-500 mt-0.5 block font-mono">{notif.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Cart Icon with badge */}
          <button 
            onClick={openCart}
            className="p-1.5 sm:p-2.5 text-white hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:scale-110 rounded-full transition-all relative cursor-pointer duration-300"
          >
            <ShoppingBag className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" />
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 sm:-top-1 sm:-right-1 min-w-4.5 h-4.5 bg-gradient-to-r from-orange-400 to-rose-400 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 border border-white shadow-[0_0_10px_rgba(251,146,60,0.8)]">
                {totalItems}
              </span>
            )}
          </button>
 
          {/* User Sign-In Profile buttons (Always Visible & Prominent) */}
          <button 
            onClick={() => {
              if (user) {
                navigate('/profile');
              } else {
                navigate('/login');
              }
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-display font-semibold transition-all duration-300 bg-white hover:bg-slate-100 text-slate-950 shadow-md hover:shadow-lg hover:scale-102 cursor-pointer font-bold shrink-0 border border-white/20"
          >
            <User className="w-3.5 h-3.5 text-blue-700 font-bold" />
            <span className="hidden sm:inline font-black uppercase tracking-wider text-[9px]">{user ? 'My Profile' : 'Login'}</span>
          </button>

          {user && (
            <button 
              onClick={async () => {
                try {
                  await fetch('/api/logout', { method: 'POST' });
                } catch (err) {
                  console.error('Logout error', err);
                }
                logout();
                toast.success('Session closed. Logging out...');
                navigate('/');
              }}
              className="hidden sm:inline-flex p-1.5 flex items-center justify-center text-blue-200 hover:text-rose-300 rounded-full hover:bg-rose-500/20 hover:scale-115 transition-all duration-300 cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Mobile hamburger menu */}
          <button
            className="p-1.5 text-white hover:bg-white/10 rounded-full transition-all md:hidden cursor-pointer flex items-center justify-center"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>
        {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute top-full inset-x-0 bg-slate-950 text-white border border-white/10 p-3.5 flex flex-col gap-1.5 md:hidden shadow-2xl z-[60] overflow-hidden rounded-xl mt-1.5 mx-1"
          >
            {dynamicNavLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "text-xs font-display font-bold transition-all py-2 px-3 rounded-lg flex items-center gap-2",
                  location.pathname === link.path 
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg" 
                    : "text-slate-350 hover:bg-white/5 hover:text-white"
                )}
              >
                <link.icon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="flex-1">{link.name}</span>
                <span className="text-[8px] uppercase font-bold text-slate-500">Navigate</span>
              </Link>
            ))}

            <div className="border-t border-white/5 pt-2.5 mt-1 flex flex-col gap-1.5">
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (user) navigate('/profile');
                  else navigate('/login');
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-display font-bold text-[11px] shadow-md cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>{user ? 'My Profile' : 'Login / Register'}</span>
              </button>
              
              {user && (
                <button 
                  onClick={async () => {
                    setIsMobileMenuOpen(false);
                    try {
                      await fetch('/api/logout', { method: 'POST' });
                    } catch (err) {
                      console.error('Logout error', err);
                    }
                    logout();
                    toast.success('Logged out successfully');
                    navigate('/');
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-red-950/45 border border-red-500/20 hover:bg-red-900/40 text-red-400 hover:text-white rounded-lg font-display font-bold text-[11px] transition-all cursor-pointer shadow-sm"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sign Out Session</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
