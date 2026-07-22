import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GoldenParticles } from "../components/GoldenParticles";

export function Home() {
  const [showCeremony, setShowCeremony] = useState(true);

  return (
    <div className="w-full bg-transparent relative overflow-hidden flex flex-col justify-center min-h-[85vh] py-12">

      {/* Welcome Ceremony Celebration Overlay */}
      <AnimatePresence>
        {showCeremony && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-[4px] pointer-events-auto"
            id="welcome_ceremony_overlay"
          >
            {/* Close Button */}
            <button
              onClick={() => setShowCeremony(false)}
              className="absolute top-6 right-6 md:top-10 md:right-10 z-[60] w-12 h-12 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all duration-300 cursor-pointer hover:-rotate-90 hover:scale-110 active:scale-95"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Elegant Golden particles canvas */}
            <GoldenParticles />

            {/* Glowing Congratulatory Message */}
            <motion.div
              initial={{ scale: 0.88, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 1.05, y: -25, opacity: 0 }}
              transition={{ delay: 0.2, duration: 0.75, ease: "easeOut" }}
              className="flex flex-col items-center justify-center text-center px-4 sm:px-6 w-full max-w-3xl z-40 pointer-events-none"
            >
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-400/40 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(245,158,11,0.25)] animate-pulse mx-auto">
                <Sparkles className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="font-display font-black text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-yellow-500 drop-shadow-[0_2px_15px_rgba(245,158,11,0.35)] tracking-tight uppercase leading-[1.15] mb-4 w-full px-2 mx-auto">
                Welcome to <br /> CHB Gitanjali Canteen
              </h2>
              <p className="text-amber-100/90 text-[10px] sm:text-sm font-sans tracking-widest uppercase font-black bg-[#161304]/90 border border-amber-500/30 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full shadow-2xl mt-2 mx-auto max-w-[90%] md:max-w-max break-words">
                ✨ Taste &amp; Health Integrated ✨
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative flex items-center justify-center px-4 sm:px-6 z-10">
        <div className="max-w-5xl mx-auto text-center flex flex-col items-center">
          
          <div className="mb-6 sm:mb-8">
            <span className="bg-[#15193B]/60 border-white/10 text-white backdrop-blur-md border border-white/40 shadow-lg text-[10px] sm:text-xs font-sans font-black uppercase tracking-widest px-4 sm:px-5 py-2 rounded-full inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-500" /> 
              Premium School Canteen Services
            </span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.1] tracking-tight mb-6 sm:mb-8 text-white">
            Healthy Meals For <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 drop-shadow-sm">
              Growing Minds
            </span>
          </h1>

          <p className="text-slate-330 text-sm sm:text-base md:text-xl leading-relaxed max-w-2xl font-medium mb-12 drop-shadow-sm px-2">
            Providing fresh, hygienic, and nutritious meals for Gitanjali School students. Designed by pediatricians to deliver the perfect nutrients for your child's peak focus.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto px-4 sm:px-0">
            <Link
               to="/weekly-menu"
               className="group relative w-full sm:w-auto px-8 py-3.5 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full font-display font-bold text-xs sm:text-sm text-white uppercase tracking-wider flex items-center justify-center gap-2 overflow-hidden hover:scale-105 transition-transform duration-300 shadow-[0_0_20px_rgba(37,99,235,0.4)] cursor-pointer"
            >
              <span className="relative flex items-center gap-2">
                View Today's Menu 
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1.5 transition-transform animate-none" />
              </span>
            </Link>
            
            <Link
              to="/plans"
              className="group relative w-full sm:w-auto px-8 py-3.5 sm:py-4 bg-[#15193B]/80 text-white backdrop-blur-md rounded-full font-display font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 overflow-hidden hover:scale-105 transition-transform duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/20 cursor-pointer"
            >
              <span className="relative flex items-center gap-2 group-hover:text-orange-400 transition-colors">
                Explore Plans
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1.5 transition-transform text-orange-500" />
              </span>
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
}
