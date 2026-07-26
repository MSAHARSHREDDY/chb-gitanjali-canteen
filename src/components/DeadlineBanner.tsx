import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export function DeadlineBanner() {
  const location = useLocation();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isOrderingClosed, setIsOrderingClosed] = useState(false);
  const [activeDay, setActiveDay] = useState<string>('Monday');
  const wasOpenRef = useRef<boolean | null>(null);

  // Hidden on admin side or authorization views to maintain layout focus
  const isExcludedPath = 
    location.pathname.startsWith('/admin') || 
    location.pathname === '/login' || 
    location.pathname === '/reset-password';

  const getKolkataTimeObj = (date: Date) => {
    const kolkataTimeMs = date.getTime() + (5.5 * 60 * 60 * 1000);
    const kolkataDate = new Date(kolkataTimeMs);
    return {
      year: kolkataDate.getUTCFullYear(),
      month: kolkataDate.getUTCMonth(),
      date: kolkataDate.getUTCDate(),
      hours: kolkataDate.getUTCHours(),
      minutes: kolkataDate.getUTCMinutes(),
      seconds: kolkataDate.getUTCSeconds(),
      dayIndex: kolkataDate.getUTCDay() // 0 = Sunday, 1 = Monday, ...
    };
  };

  const getMsLeftToKolkataTarget = (now: Date, targetDayIndex: number, targetHour: number, targetMinute: number) => {
    let targetDate = new Date(now.getTime());
    for (let i = 0; i < 8; i++) {
      const kObj = getKolkataTimeObj(targetDate);
      if (kObj.dayIndex === targetDayIndex) {
        const targetUtcYear = kObj.year;
        const targetUtcMonth = kObj.month;
        const targetUtcDate = kObj.date;
        
        const targetInKolkataUtc = Date.UTC(targetUtcYear, targetUtcMonth, targetUtcDate, targetHour, targetMinute, 0, 0);
        const targetMs = targetInKolkataUtc - (5.5 * 60 * 60 * 1000);
        
        if (targetMs > now.getTime()) {
          return targetMs - now.getTime();
        }
      }
      targetDate.setTime(targetDate.getTime() + 24 * 60 * 60 * 1000);
    }
    return 0;
  };

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const kObj = getKolkataTimeObj(now);
      const curDayIndex = kObj.dayIndex; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const curHour = kObj.hours;
      
      let targetDayName = "Monday";
      let isOpen = false;
      let msLeft = 0;
      
      if (curDayIndex === 1) { // Monday
        if (curHour < 6) {
          targetDayName = "Monday";
          isOpen = true;
          msLeft = getMsLeftToKolkataTarget(now, 1, 6, 0);
        } else if (curHour < 12) {
          targetDayName = "Tuesday";
          isOpen = false;
        } else {
          targetDayName = "Tuesday";
          isOpen = true;
          msLeft = getMsLeftToKolkataTarget(now, 2, 6, 0);
        }
      } else if (curDayIndex === 2) { // Tuesday
        if (curHour < 6) {
          targetDayName = "Tuesday";
          isOpen = true;
          msLeft = getMsLeftToKolkataTarget(now, 2, 6, 0);
        } else if (curHour < 12) {
          targetDayName = "Wednesday";
          isOpen = false;
        } else {
          targetDayName = "Wednesday";
          isOpen = true;
          msLeft = getMsLeftToKolkataTarget(now, 3, 6, 0);
        }
      } else if (curDayIndex === 3) { // Wednesday
        if (curHour < 6) {
          targetDayName = "Wednesday";
          isOpen = true;
          msLeft = getMsLeftToKolkataTarget(now, 3, 6, 0);
        } else if (curHour < 12) {
          targetDayName = "Thursday";
          isOpen = false;
        } else {
          targetDayName = "Thursday";
          isOpen = true;
          msLeft = getMsLeftToKolkataTarget(now, 4, 6, 0);
        }
      } else if (curDayIndex === 4) { // Thursday
        if (curHour < 6) {
          targetDayName = "Thursday";
          isOpen = true;
          msLeft = getMsLeftToKolkataTarget(now, 4, 6, 0);
        } else if (curHour < 12) {
          targetDayName = "Friday";
          isOpen = false;
        } else {
          targetDayName = "Friday";
          isOpen = true;
          msLeft = getMsLeftToKolkataTarget(now, 5, 6, 0);
        }
      } else if (curDayIndex === 5) { // Friday
        if (curHour < 6) {
          targetDayName = "Friday";
          isOpen = true;
          msLeft = getMsLeftToKolkataTarget(now, 5, 6, 0);
        } else if (curHour < 12) {
          targetDayName = "Saturday";
          isOpen = false;
        } else {
          targetDayName = "Saturday";
          isOpen = true;
          msLeft = getMsLeftToKolkataTarget(now, 6, 6, 0);
        }
      } else if (curDayIndex === 6) { // Saturday
        if (curHour < 6) {
          targetDayName = "Saturday";
          isOpen = true;
          msLeft = getMsLeftToKolkataTarget(now, 6, 6, 0);
        } else if (curHour < 12) {
          targetDayName = "Monday";
          isOpen = false;
        } else {
          targetDayName = "Monday";
          isOpen = true;
          msLeft = getMsLeftToKolkataTarget(now, 1, 6, 0);
        }
      } else if (curDayIndex === 0) { // Sunday
        targetDayName = "Monday";
        isOpen = true;
        msLeft = getMsLeftToKolkataTarget(now, 1, 6, 0);
      }
      
      
      const getTargetDateStr = (targetDayIndex: number, targetHour: number, targetMinute: number) => {
        let targetDate = new Date(now.getTime());
        for (let i = 0; i < 8; i++) {
          const kObj = getKolkataTimeObj(targetDate);
          if (kObj.dayIndex === targetDayIndex) {
            const targetUtcYear = kObj.year;
            const targetUtcMonth = kObj.month;
            const targetUtcDate = kObj.date;
            const targetInKolkataUtc = Date.UTC(targetUtcYear, targetUtcMonth, targetUtcDate, targetHour, targetMinute, 0, 0);
            const targetMs = targetInKolkataUtc - (5.5 * 60 * 60 * 1000);
            if (targetMs > now.getTime()) {
              const d = new Date(targetMs + 5.5 * 60 * 60 * 1000);
              return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
            }
          }
          targetDate.setTime(targetDate.getTime() + 24 * 60 * 60 * 1000);
        }
        return null;
      };

      const mapNameToIndex = { "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6, "Sunday": 0 };
      const currentTargetDate = getTargetDateStr(mapNameToIndex[targetDayName], 6, 0);
      
      // DATE-BASED OVERRIDE for 27-07-2026 and 28-07-2026
      if (currentTargetDate === "2026-07-27" || currentTargetDate === "2026-07-28" || (targetDayName === "Wednesday" && !isOpen && currentTargetDate === "2026-07-29" && (curDayIndex === 1 || curDayIndex === 2))) {
        targetDayName = "Wednesday";
        isOpen = true;
        msLeft = getMsLeftToKolkataTarget(now, 3, 6, 0);
      }

      setIsOrderingClosed(!isOpen);
      setActiveDay(targetDayName);
      
      // Strict Redirection logic
      if (!isOpen) {
        if (wasOpenRef.current === true) {
          // It just closed while the user was on the app
          toast.error("Ordering is now closed. You cannot place orders until noon.", { id: 'ordering-closed' });
          if (location.pathname !== '/') {
            navigate('/');
          }
        } else if (location.pathname === '/checkout' || location.pathname === '/weekly-menu') {
          // If they directly navigate to checkout or menu when closed, block checkout
          if (location.pathname === '/checkout') {
             toast.error("Checkout is unavailable right now. Ordering is closed.", { id: 'checkout-closed' });
             navigate('/');
          }
        }
      }
      wasOpenRef.current = isOpen;
      
      if (isOpen && msLeft > 0) {
        const totalHours = Math.floor(msLeft / (1000 * 60 * 60));
        const minutes = Math.floor((msLeft / 1000 / 60) % 60);
        const seconds = Math.floor((msLeft / 1000) % 60);
        
        const hrsStr = totalHours.toString().padStart(2, '0');
        const minsStr = minutes.toString().padStart(2, '0');
        const secsStr = seconds.toString().padStart(2, '0');
        
        setTimeLeft(`${hrsStr}H ${minsStr}M ${secsStr}S`);
      } else {
        setTimeLeft('00H 00M 00S');
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [location.pathname, navigate]);

  if (isExcludedPath) return null;

  return (
    <div className="w-full relative z-30 flex flex-col">
      {/* Special Closure Notice */}
      {(() => {
        const now = new Date();
        const kolkataTimeMs = now.getTime() + (5.5 * 60 * 60 * 1000);
        const kolkataDate = new Date(kolkataTimeMs);
        const dStr = kolkataDate.getUTCFullYear() + "-" + String(kolkataDate.getUTCMonth() + 1).padStart(2, '0') + "-" + String(kolkataDate.getUTCDate()).padStart(2, '0');
        
        if (dStr >= "2026-07-25" && dStr <= "2026-07-28") {
          return (
            <div className="w-full bg-gradient-to-r from-amber-950 via-orange-950 to-amber-950 text-white py-1.5 px-3 text-center border-b border-orange-500/20 shadow-sm backdrop-blur-md relative overflow-hidden">
              <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 relative z-10 text-[11px] sm:text-xs">
                <span className="bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider border border-orange-500/30 font-bold shrink-0">
                  📢 Notice
                </span>
                <p className="text-orange-200 font-medium tracking-wide">
                  <strong className="text-white font-bold">Canteen is closed on 27-07-2026, 28-07-2026</strong> i.e on Monday and Tuesday
                </p>
              </div>
            </div>
          );
        }
        return null;
      })()}

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full relative"
      >

      {isOrderingClosed ? (
        // Spectacular Unique Styling for Orders Closed
        <div className="w-full bg-gradient-to-r from-red-950 via-rose-950 to-red-950 text-white py-1.5 px-3 text-center border-b border-rose-500/20 shadow-sm backdrop-blur-md relative overflow-hidden">
          {/* Neon micro particles under banner */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.1)_0%,transparent_70%)] pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 relative z-10 text-[11px] sm:text-xs">
            <span className="bg-rose-500/20 text-rose-405 px-1.5 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider border border-rose-500/30 font-bold shrink-0">
              Closed
            </span>
            <p className="text-rose-200 font-medium tracking-wide">
              🔒 <strong className="text-white font-bold">Canteen ordering is closed.</strong> Daily cut-off is 6:00 AM IST. Next slot for <strong className="text-white font-bold">{activeDay}</strong> opens at 12:00 PM (noon) IST.
            </p>
          </div>
        </div>
      ) : (
        // Warning/Suggestion alert layout for pending deadline countdown
        <div className="w-full bg-gradient-to-r from-slate-950 via-amber-955/60 to-slate-950 text-white py-1.5 px-3 text-center border-b border-amber-500/20 shadow-sm backdrop-blur-md relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.05)_0%,transparent_60%)] pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 relative z-10 text-[11px] sm:text-xs">
            <span className="bg-amber-500/10 text-amber-450 px-1.5 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider border border-amber-500/20 font-bold shrink-0 animate-pulse">
              ⏱ {timeLeft}
            </span>
            <p className="text-amber-200/90 font-medium tracking-wide">
              ⚠️ <strong className="text-white font-bold">Canteen ordering is open:</strong> Order for <span className="text-brand-emerald font-bold">{activeDay}</span>'s menu before the 6:00 AM IST daily cut-off!
            </p>
          </div>
        </div>
      )}
    </motion.div>
    </div>
  );
}
