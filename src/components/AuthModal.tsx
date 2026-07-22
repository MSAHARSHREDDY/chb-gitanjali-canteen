import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, LogIn, KeyRound, Phone, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, login } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'otp'>('email');
  const [otpCode, setOtpCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  // Validations
  const validate = () => {
    if (!email) {
      toast.error('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    if (!isForgotPassword) {
      if (!isLogin && !name.trim()) {
        toast.error('Name is required');
        return false;
      }
      if (!isLogin && !mobile.trim()) {
        toast.error('Mobile number is required');
        return false;
      }
      if (!isLogin && !/^[0-9]{10,15}$/.test(mobile.trim())) {
        toast.error('Please enter a valid mobile number');
        return false;
      }
      if (!password) {
        toast.error('Password is required');
        return false;
      }
      if (!isLogin && password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return false;
      }
    }
    return true;
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset code');
      }
      
      toast.success(data.message || 'Verification OTP sent code!');
      setForgotStep('otp');
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      toast.error('Please enter a 6-digit verification code.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Invalid or expired OTP code.');
      }
      toast.success('Code verified successfully! Redirecting...');
      closeAuthModal();
      const verifiedOtp = otpCode;
      setForgotStep('email');
      setOtpCode('');
      navigate(`/reset-password?token=${verifiedOtp}&email=${email}`);
    } catch (err: any) {
      toast.error(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);

    try {
      const endpoint = isLogin ? '/api/login' : '/api/signup';
      const body = isLogin ? { email, password } : { name, email, mobile, password };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Unable to contact integration servers. Please verify database connection or restart the dev server.");
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (!isLogin) {
        toast.success("Account created successfully! Please sign in.");
        setIsLogin(true);
        setPassword('');
      } else {
        // Successful login
        toast.success("Logged in successfully!");
        login(data.user, data.token);
        setName('');
        setEmail('');
        setMobile('');
        setPassword('');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred. Make sure the database is connected.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsForgotPassword(false);
    setForgotStep('email');
    setOtpCode('');
    setIsLogin(!isLogin);
  };

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAuthModal}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[101] p-6 outline-none"
          >
            <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 to-transparent pointer-events-none" />
              
              <button
                type="button"
                onClick={closeAuthModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-50 p-2 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-8 relative z-10">
                <div className="text-center mb-8">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    {isForgotPassword ? <KeyRound className="w-6 h-6 text-emerald-500" /> : <LogIn className="w-6 h-6 text-emerald-500" />}
                  </div>
                  <h2 className="heading-serif text-3xl text-white mb-2">
                    {isForgotPassword 
                      ? (forgotStep === 'email' ? 'Reset Password' : 'Verify OTP') 
                      : (isLogin ? 'Welcome Back' : 'Create Account')}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {isForgotPassword 
                      ? (forgotStep === 'email' 
                        ? 'Enter your email to receive a 6-digit OTP' 
                        : 'Enter the 6-digit code sent to your email')
                      : (isLogin ? 'Sign in to manage your Canteen reservations' : 'Join us to experience exclusive culinary Canteens')}
                  </p>
                </div>

                {isForgotPassword ? (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    {forgotStep === 'email' ? (
                      <>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email Address"
                            className="w-full bg-slate-950/50 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full py-3 mt-4 bg-emerald-500 text-slate-950 font-semibold uppercase tracking-widest text-sm hover:bg-emerald-400 transition-colors rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? 'Processing...' : 'Send Verification Code'}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <input
                            type="text"
                            required
                            maxLength={6}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="6-Digit OTP"
                            className="w-full bg-slate-950/50 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-white text-center font-mono tracking-[0.5em] text-lg focus:outline-none focus:border-emerald-500 transition-colors"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleVerifyOTP}
                          disabled={isLoading || otpCode.length !== 6}
                          className="w-full py-3 mt-4 bg-emerald-500 text-slate-950 font-semibold uppercase tracking-widest text-sm hover:bg-emerald-400 transition-colors rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? 'Verifying...' : 'Verify Code'}
                        </button>
                        <div className="text-center mt-2">
                          <button
                            type="button"
                            onClick={() => setForgotStep('email')}
                            className="text-emerald-500 hover:text-emerald-400 text-xs transition-colors cursor-pointer"
                          >
                            Resend Code / Change Email
                          </button>
                        </div>
                      </>
                    )}
                    <div className="mt-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(false);
                          setForgotStep('email');
                          setOtpCode('');
                        }}
                        className="text-gray-400 hover:text-emerald-500 transition-colors text-sm cursor-pointer"
                      >
                        Back to Login
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4 font-normal">
                    {!isLogin && (
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Full Name"
                          className="w-full bg-slate-950/50 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                      </div>
                    )}
                    {!isLogin && (
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="tel"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          placeholder="Mobile Number"
                          className="w-full bg-slate-950/50 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                      </div>
                    )}
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email Address"
                        className="w-full bg-slate-950/50 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full bg-slate-950/50 border border-white/10 rounded-lg pl-11 pr-11 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors cursor-pointer"
                        id="auth-modal-password-toggle-btn"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>
                    </div>

                    {isLogin && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setIsForgotPassword(true)}
                          className="text-emerald-500 hover:text-emerald-400 text-xs transition-colors cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 mt-4 bg-emerald-500 text-slate-950 font-semibold uppercase tracking-widest text-sm hover:bg-emerald-400 transition-colors rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                  </form>
                )}

                {!isForgotPassword && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={toggleMode}
                      className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors text-sm cursor-pointer bg-emerald-500/10 px-4 py-2 rounded-lg border border-emerald-500/20"
                    >
                      {isLogin
                        ? "Don't have an account? Sign Up"
                        : "Already have an account? Sign In"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
