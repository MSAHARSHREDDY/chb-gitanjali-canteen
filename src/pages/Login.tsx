import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, Lock, User, ShieldCheck, ArrowRight, ShieldAlert, KeyRound, Mail, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export function Login() {
  const [role, setRole] = useState<'parent' | 'teacher' | 'admin'>('parent');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Parent Sign Up States
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [isTeacher, setIsTeacher] = useState(false);

  // Forgot Password States
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (isSignUp && (role === 'parent' || role === 'teacher')) {
      if (!name.trim()) {
        toast.error("Please enter your full name.");
        return;
      }
      const cleanMobile = mobile.replace(/[^0-9]/g, "");
      if (cleanMobile.length < 10 || cleanMobile.length > 15) {
        toast.error("Please enter a valid mobile number (10 to 15 digits).");
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isSignUp && (role === 'parent' || role === 'teacher')) {
        const url = role === 'teacher' ? '/api/teacher/signup' : '/api/signup';
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, mobile, password, isTeacher: role === 'teacher' })
        });
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Backend system response is unreadable. Please check database connection or restart backend services.");
        }

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Signup failed');
        
        toast.success("Account created successfully! Please sign in.");
        setIsSignUp(false);
        setPassword('');
      } else {
        const url = role === 'teacher' ? '/api/teacher/login' : '/api/login';
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Unable to contact backend authentication services. Please check server log or restart the dev server.");
        }

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Login failed');
        
        if (role === 'admin' && !data.user.isAdmin) {
          throw new Error("Access Denied: You do not have Administrator privileges. Please use the 'Parent Portal' tab to log in!");
        }
        
        login(data.user, data.token);
        toast.success(`Successfully logged in as ${data.user.isAdmin ? 'Administrator' : data.user.isTeacher ? 'Teacher' : 'Parent'}!`);
        
        if (data.user.isAdmin) {
          navigate('/admin');
        } else {
          const redirectPath = searchParams.get('redirect') || '/';
          navigate(redirectPath);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const url = role === 'teacher' ? '/api/teacher/auto-reset' : '/api/auto-reset';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to auto-reset password');
      
      // Auto login
      login(data.user, data.token);
      toast.success(`Password Reset! Your temporary password is: ${data.newPassword}`, { duration: 15000 });
      toast("Please change your new password in your profile immediately.", { icon: "⚠️", duration: 15000 });
      
      // Navigate to profile or home
      navigate(data.user.isAdmin ? '/admin' : '/profile');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-grow w-full flex flex-col justify-center items-center py-10 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-x-hidden font-sans min-h-screen bg-[#020211]/40">
      
      {/* Immersive Animated Space Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-[80px] sm:blur-[100px] animate-float-slow"></div>
        <div className="absolute bottom-[-15%] right-[-10%] w-[350px] h-[350px] sm:w-[600px] sm:h-[600px] bg-gradient-to-tr from-rose-500/10 via-blue-500/5 to-transparent rounded-full blur-[90px] sm:blur-[120px] animate-float-reverse"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-3 sm:mb-8 mt-1 sm:mt-0">
        <div 
          onClick={() => { setIsForgotPassword(false); setForgotStep('email'); }} 
          className="inline-flex cursor-pointer items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-[0_0_25px_rgba(79,70,229,0.5)] mb-2 sm:mb-5 hover:scale-110 active:scale-95 transition-all duration-300 border border-white/20 select-none"
        >
          <Coffee className="w-6 h-6 sm:w-8 sm:h-8 animate-pulse text-indigo-100" />
        </div>
        <h2 className="text-center text-2xl sm:text-4xl font-display font-black text-white tracking-tight drop-shadow-md">
          {isForgotPassword ? "Reset Access" : (isSignUp ? "Create Account" : "Welcome Back")}
        </h2>
        <p className="mt-1 text-center text-[9px] sm:text-xs font-semibold uppercase tracking-widest text-[#FF8E53] drop-shadow-sm px-4">
          {isForgotPassword ? "Credential Salvage Hub" : (isSignUp ? "CHB Gitanjali Parent Cohort" : "Sign in to manage reservations")}
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0"
      >
        <div className="bg-[#15193B]/70 border border-white/15 backdrop-blur-2xl py-5 px-5 sm:py-10 sm:px-10 shadow-[0_25px_60px_rgba(0,0,0,0.6)] rounded-[2rem] sm:rounded-[2.5rem] hover:border-indigo-500/35 transition-all duration-500">
           
          {!isForgotPassword && (
            <div className="flex flex-col sm:flex-row bg-slate-900/60 p-1 rounded-2xl border border-white/10 mb-4 sm:mb-8 select-none gap-1">
              <button
                type="button"
                onClick={() => { setRole('parent'); setIsSignUp(false); }}
                className={`flex-1 py-1.5 sm:py-2.5 rounded-xl text-[9px] font-display font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer ${
                  role === 'parent' 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-3 h-3" /> Parent Gate
              </button>
              <button
                type="button"
                onClick={() => { setRole('teacher'); setIsSignUp(false); }}
                className={`flex-1 py-1.5 sm:py-2.5 rounded-xl text-[9px] font-display font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer ${
                  role === 'teacher' 
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-650 to-teal-600 border border-teal-500/10 text-white shadow-lg shadow-emerald-500/30' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Coffee className="w-3 h-3" /> Teacher Gate
              </button>
              <button
                type="button"
                onClick={() => { setRole('admin'); setIsSignUp(false); }}
                className={`flex-1 py-1.5 sm:py-2.5 rounded-xl text-[9px] font-display font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer ${
                  role === 'admin' 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-lg border border-amber-400' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3 h-3" /> Admin Panel
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {isForgotPassword ? (
              <motion.form 
                key="forgot"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 text-left" 
                onSubmit={handleForgotPassword}
              >
                  <div className="space-y-4">
                    <div className="hidden sm:flex gap-4 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-xs leading-relaxed">
                      <Mail className="w-5 h-5 shrink-0 text-[#FF8E53]" />
                      <p>Specify the registered parent email address. An automatic temporary password will be given for immediate login.</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">Registered Email</label>
                      <input 
                        type="email" 
                        required 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 sm:py-3.5 text-sm font-semibold text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none" 
                      />
                    </div>
                  </div>

                <div className="flex flex-col gap-3">
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full py-3 sm:py-4 flex justify-center text-white font-display font-black text-xs uppercase tracking-widest rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-lg bg-gradient-to-r from-blue-600 translate-y-2 to-purple-600 shadow-blue-500/15"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    ) : (<span>Request Clearance Key</span>)}
                  </button>
                  
                  <button 
                    type="button" 
                    onClick={() => { setIsForgotPassword(false); setForgotStep('email'); }}
                    className="text-[10px] uppercase tracking-widest text-slate-400 hover:text-white font-black mt-2 cursor-pointer text-center"
                  >
                    Back to login gate
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.form 
                key={isSignUp ? "signup" : "login"}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-3 sm:space-y-5 text-left" 
                onSubmit={handleLogin}
              >
                {role === 'admin' && (
                  <div className="p-3 bg-[#FF4D9D]/5 border border-[#FF4D9D]/15 rounded-xl hidden sm:flex items-start gap-3">
                    <ShieldAlert className="w-4 h-4 text-[#FF4D9D] shrink-0 mt-0.5" />
                    <p className="text-[10px] text-[#FF4D9D] font-bold leading-normal">
                      Secured Administrative terminal access. Enter security clearance credentials.
                    </p>
                  </div>
                )}

                {isSignUp && (role === 'parent' || role === 'teacher') && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">Full Name</label>
                      <input 
                        type="text" 
                        required 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 sm:py-3.5 text-sm font-semibold text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none" 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">Mobile Contact</label>
                      <input 
                        type="tel" 
                        required 
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 sm:py-3.5 text-sm font-semibold text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none" 
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <label className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 sm:py-3.5 text-sm font-semibold text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-4 pr-12 py-2.5 sm:py-3.5 text-sm font-semibold text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/5"
                    >
                      {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {!isSignUp && (
                  <div className="flex items-center justify-between mt-2.5 sm:mt-4">
                    <div className="flex items-center">
                      <input id="remember-me" name="remember-me" type="checkbox" className="h-3.5 w-3.5 bg-slate-950 text-indigo-600 border-white/10 focus:ring-0 rounded cursor-pointer" />
                      <label htmlFor="remember-me" className="ml-2 block text-xs font-semibold text-slate-400 select-none cursor-pointer">
                        Remember session
                      </label>
                    </div>

                    {role !== 'admin' && (
                      <div className="text-xs">
                        <button type="button" onClick={() => setIsForgotPassword(true)} className="font-black text-indigo-400 hover:text-indigo-300 cursor-pointer">
                          Forgot Access?
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2 sm:pt-4">
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className={`w-full py-3 sm:py-4 flex justify-center font-display font-black text-xs uppercase tracking-widest rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-lg group border-none ${
                        role === 'admin' 
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-amber-500/10 hover:shadow-amber-500/25 hover:scale-[1.01] border border-amber-400 font-bold' 
                          : 'text-white ' + (role === 'teacher'
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-500/20 hover:shadow-emerald-500/35 hover:scale-[1.01]'
                          : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-indigo-500/20 hover:shadow-indigo-500/35 hover:scale-[1.01]')
                      }`}
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 shrink-0" /> 
                        <span>{isSignUp ? 'REGISTER COHORT' : (role === 'admin' ? 'Sign In Admin' : 'Sign In Portal')}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>

                {role === 'parent' && (
                  <div className="text-center mt-4 sm:mt-6 border-t border-white/5 pt-3.5 sm:pt-5">
                    <button
                      type="button"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-[10px] font-black uppercase tracking-widest text-[#FF4D9D] hover:text-[#ff3891] cursor-pointer transition-colors"
                    >
                      {isSignUp ? "Existing Register? Access Here" : "No Account? Register Here"}
                    </button>
                  </div>
                )}

                {role === 'teacher' && (
                  <div className="text-center mt-4 sm:mt-6 border-t border-white/5 pt-3.5 sm:pt-5">
                    <button
                      type="button"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-350 cursor-pointer transition-colors"
                    >
                      {isSignUp ? "Existing Register? Access Here" : "No Account? Register Here"}
                    </button>
                  </div>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
