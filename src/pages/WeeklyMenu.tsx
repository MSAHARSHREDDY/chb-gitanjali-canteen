import { motion } from "framer-motion";
import { Check, Sparkles, Utensils, Heart, Lock, HelpCircle, ChevronRight, Clock, AlertCircle, Minus, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useCart } from "../context/CartContext";
import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMenuItems } from "../api/client";

// Standard school weekdays (Monday-Friday) according to Canteen schedule
const weeklyDays = [
  {
    day: "Monday",
    theme: "Energetic Boost",
    tagline: "Start the week with sustained slow-release energy",
    badge: "High Fiber & Digestible Carbs",
    badgeBg: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    popular: false,
    colorGlow: "from-blue-500/10 to-transparent",
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80",
    meals: [
      { 
        type: "Breakfast", 
        title: "Idli with Sambar & Coconut Chutney", 
        desc: "Fermented soft rice cakes rich in probiotics.",
        image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=300&q=80" 
      },
      { 
        type: "Lunch", 
        title: "Tomato Rice with Dal Fry & Potato Capsicum", 
        desc: "Sautéed tomato basmati served with stewed yellow dhal.",
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80" 
      },
      { 
        type: "Snacks", 
        title: "Fresh Fruit Custard Bowl", 
        desc: "Fresh papaya, pomegranate seeds, grapes in organic custard.",
        image: "https://images.unsplash.com/photo-1519996521430-02b798c1d881?auto=format&fit=crop&w=300&q=80" 
      }
    ]
  },
  {
    day: "Tuesday",
    theme: "Protein Builders",
    tagline: "Essential muscle-building organic proteins",
    badge: "Calcium-Packed Lunch Selection",
    badgeBg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    popular: true,
    colorGlow: "from-emerald-500/10 to-transparent",
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80",
    meals: [
      { 
        type: "Breakfast", 
        title: "Uttapam & Sliced Fresh Fruits", 
        desc: "Savory thick rice-lentil pancakes topped with fine carrots and peas, served alongside fresh seasonal sliced fruits.",
        image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=300&q=80" 
      },
      { 
        type: "Lunch", 
        title: "Leafy Vegetable Dal Rice, Vegetable Fry, Fryums, Curd", 
        desc: "Nutrient-rich leafy organic greens cooked into hearty yellow split dal, served with basmati rice, mild veggie fry, and curd.",
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=300&q=80" 
      },
      { 
        type: "Snacks", 
        title: "Fruit Custard", 
        desc: "Refreshing eggless vanilla bean milk custard infused with a colorful mix of diced apples, pomegranates, and bananas.",
        image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=300&q=80" 
      }
    ]
  },
  {
    day: "Wednesday",
    theme: "Iron Vitality",
    tagline: "Finger millet ragi iron & pediatric immune support",
    badge: "High-Iron Pediatric Selection",
    badgeBg: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    popular: false,
    colorGlow: "from-amber-500/10 to-transparent",
    image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80",
    meals: [
      { 
        type: "Breakfast", 
        title: "Vegetable Bambino", 
        desc: "Roasted wheat vermicelli cooked with fine-cut local beans, carrots, and peas with chef's mild spice tempering.",
        image: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=300&q=80" 
      },
      { 
        type: "Lunch", 
        title: "Bagara Rice, Paneer / Chana Masala, Raita, Veg Salad", 
        desc: "Aromatic seasoned rice paired with flavorful cottage cheese paneer cubes (or chickpeas), refreshing cucumber yogurt raita, and green salad.",
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=300&q=80" 
      },
      { 
        type: "Snacks", 
        title: "Fruit Chat", 
        desc: "A zesty, refreshing medley of local farm-fresh fruits tossed with a pinch of dynamic spice powder.",
        image: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=300&q=80" 
      }
    ]
  },
  {
    day: "Thursday",
    theme: "Whole Grain Harmony",
    tagline: "Folic acid and wholesome ancient elements",
    badge: "B-Complex & Trace Minerals",
    badgeBg: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    popular: false,
    colorGlow: "from-rose-500/10 to-transparent",
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80",
    meals: [
      { 
        type: "Breakfast", 
        title: "Chapathi + Vegetable Curry + Veg Salad", 
        desc: "Two soft whole wheat flatbreads served with nutritious home-style mixed vegetable curry and fresh crunchy garden salad.",
        image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=300&q=80" 
      },
      { 
        type: "Lunch", 
        title: "Sambar Rice, Curd Rice, Papad", 
        desc: "Classic duo of comforting steam-boiled lentil-vegetable sambar rice, paired with cold soothing curd rice and papad.",
        image: "https://images.unsplash.com/photo-1630175860333-5131bda75071?w=300&auto=format&fit=crop&q=80" 
      },
      { 
        type: "Snacks", 
        title: "Veg Sandwich (2 Pieces)", 
        desc: "Lightly toasted whole-grain bread slices with fine cucumber, tomato, cheese slices, and fresh green lettuce.",
        image: "https://images.unsplash.com/photo-1521305916504-4a1121188589?auto=format&fit=crop&w=300&q=80" 
      }
    ]
  },
  {
    day: "Friday",
    theme: "Smart Brain Day",
    tagline: "Healthy Omega-3 fats to fuel intellectual focus",
    badge: "Omega-3 Brain Booster Day",
    badgeBg: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    popular: true,
    colorGlow: "from-purple-500/10 to-transparent",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
    meals: [
      { 
        type: "Breakfast", 
        title: "Vegetable Upma + Fresh Fruits", 
        desc: "Semolina wheat dry-roasted and cooked with fresh garden peas, ginger, and curry leaves alongside freshly sliced apples.",
        image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&auto=format&fit=crop&q=80" 
      },
      { 
        type: "Lunch", 
        title: "Veg Biryani, Veg Masala Curry, Raita", 
        desc: "Traditional slow-cooked layered vegetable basmati rice, coupled with aromatic rich vegetable masala curry and refreshing yogurt raita.",
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=300&q=80" 
      },
      { 
        type: "Snacks", 
        title: "Veg Puff + Muffin", 
        desc: "Crispy layered baked local vegetable turnover puff served with one soft chocolate chip snack dessert muffin.",
        image: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&w=300&q=80" 
      }
    ]
  },
  {
    day: "Saturday",
    theme: "Weekend Delight",
    tagline: "Lighter digestion comfort and premium weekend favorites to wrap up the week",
    badge: "Light Comfort Foods",
    badgeBg: "bg-teal-500/10 text-teal-400 border border-teal-500/20",
    popular: false,
    colorGlow: "from-teal-500/10 to-transparent",
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80",
    meals: [
      { 
        type: "Breakfast", 
        title: "Dosa Chutney + Sprouts", 
        desc: "Crispy grilled fermented rice batter dosa, tasty coconut chutney, accompanied by highly nutritious steamed green gram sprouts.",
        image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=300&q=80" 
      },
      { 
        type: "Lunch", 
        title: "Lemon Rice, Beetroot Rice, Bhoondi Raita", 
        desc: "Stir-fried tangy mustard-tempered lemon Sona Masuri rice, paired with fiber-rich sweet beetroot rice, and crispy yogurt boondi raita.",
        image: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=300&auto=format&fit=crop&q=80" 
      },
      { 
        type: "Snacks", 
        title: "Garlic Bread + Mini Donut", 
        desc: "Two slices of baked local fresh garlic butter herb bread alongside a tiny soft glazed morning party donut.",
        image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=300&q=80" 
      }
    ]
  }
];

export function WeeklyMenu() {
  const { students, addToCart } = useCart();
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const isTeacher = !!user?.isTeacher;
  const [customMenuItems, setCustomMenuItems] = useState<any[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [selectedStudentName, setSelectedStudentName] = useState<string>("");

  // Timer logic
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isOrderingClosed, setIsOrderingClosed] = useState(false);
  const [realActiveDay, setRealActiveDay] = useState<string>("Monday");
  const [realCurrentDay, setRealCurrentDay] = useState<string>("Monday");


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
      
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const curDayName = dayNames[curDayIndex];
      
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

      const mapNameToIndex: Record<string, number> = { "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6, "Sunday": 0 };
      const currentTargetDate = getTargetDateStr(mapNameToIndex[targetDayName], 6, 0);
      
      // DATE-BASED OVERRIDE for 27-07-2026 and 28-07-2026
      if (currentTargetDate === "2026-07-27" || currentTargetDate === "2026-07-28" || (targetDayName === "Wednesday" && !isOpen && currentTargetDate === "2026-07-29" && (curDayIndex === 1 || curDayIndex === 2))) {
        targetDayName = "Wednesday";
        isOpen = true;
        msLeft = getMsLeftToKolkataTarget(now, 3, 6, 0);
      }

      setIsOrderingClosed(!isOpen);
      setRealActiveDay(targetDayName);
      setRealCurrentDay(curDayName);
      
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
  }, []);

  const [prices, setPrices] = useState({
    breakfast: 55,
    lunch: 75,
    breakfastLunch: 130,
    lunchSnacks: 110,
    allTogether: 165
  });

  useEffect(() => {
    fetch('/api/admin/canteen-settings/meal_prices')
      .then(res => res.json())
      .then(data => {
        if (data && data.value) {
          setPrices(data.value);
        }
      })
      .catch(err => {
        console.error("Failed to load live dynamic prices:", err);
      });
  }, []);

  const getSelectedMealTypes = (studentName: string, day: string) => {
    const pkgId = getSelectedPackage(studentName, day);
    if (pkgId === "breakfast") return ["Breakfast"];
    if (pkgId === "lunch") return ["Lunch"];
    if (pkgId === "breakfastLunch") return ["Breakfast", "Lunch"];
    if (pkgId === "lunchSnacks") return ["Lunch", "Snacks"];
    if (pkgId === "allTogether") return ["Breakfast", "Lunch", "Snacks"];
    return ["Breakfast", "Lunch", "Snacks"];
  };

  const getCustomMealPackagePrice = (selected: string[]) => {
    const hasBreakfast = selected.includes("Breakfast");
    const hasLunch = selected.includes("Lunch");
    const hasSnacks = selected.includes("Snacks");

    if (hasBreakfast && hasLunch && hasSnacks) {
      return prices.allTogether;
    }
    if (hasLunch && hasSnacks) {
      return prices.lunchSnacks;
    }
    if (hasBreakfast && hasLunch) {
      return prices.breakfastLunch ?? 130;
    }
    if (hasBreakfast && hasSnacks) {
      const snacksPrice = prices.lunchSnacks - prices.lunch;
      return prices.breakfast + snacksPrice;
    }
    if (hasBreakfast) {
      return prices.breakfast;
    }
    if (hasLunch) {
      return prices.lunch;
    }
    if (hasSnacks) {
      return prices.lunchSnacks - prices.lunch;
    }
    return 0;
  };

  useEffect(() => {
    const loadCustom = async () => {
      try {
        setMenuLoading(true);
        const items = await getMenuItems();
        setCustomMenuItems(items || []);
      } catch (err) {
        console.error("Failed to load custom menu items:", err);
      } finally {
        setMenuLoading(false);
      }
    };
    loadCustom();
  }, []);

  const resolvedWeeklyDays = useMemo(() => {
    return weeklyDays.map(dayItem => {
      let finalMeals: any[] = [];
      
      if (customMenuItems && customMenuItems.length > 0) {
        const dayCustomItems = customMenuItems.filter(
          c => c.day?.toLowerCase() === dayItem.day.toLowerCase()
        );
        
        if (dayCustomItems.length > 0) {
          finalMeals = dayCustomItems.map(c => {
            const matchedHardcoded = dayItem.meals.find(m => m.type.toLowerCase() === c.categoryId.toLowerCase());
            return {
              type: c.categoryId.charAt(0).toUpperCase() + c.categoryId.slice(1),
              title: c.name,
              desc: c.description || matchedHardcoded?.desc || "",
              image: c.image || matchedHardcoded?.image || "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=300&q=80"
            };
          });
        } else {
          finalMeals = dayItem.meals;
        }
      } else {
        finalMeals = dayItem.meals;
      }
      
      const order = { "Breakfast": 1, "Lunch": 2, "Snacks": 3 };
      finalMeals.sort((a, b) => (order[a.type as keyof typeof order] || 99) - (order[b.type as keyof typeof order] || 99));

      return {
        ...dayItem,
        meals: finalMeals
      };
    });
  }, [weeklyDays, customMenuItems]);

  // Target orders calculations
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  // Day Simulator state representing what day "today" is. Defaulting to null to dynamically load the active real-time weekday (Asia/Kolkata timezone)
  const [simulatedDay, setSimulatedDay] = useState<string | null>(null);

  const computedToday = useMemo(() => {
    return simulatedDay || realCurrentDay;
  }, [simulatedDay, realCurrentDay]);

  const activeDayOfAction = useMemo(() => {
    return simulatedDay || realActiveDay;
  }, [simulatedDay, realActiveDay]);

  const getFormattedDateForDay = (dayName: string) => {
    const now = new Date();
    const kObj = getKolkataTimeObj(now);
    const curDayIndex = kObj.dayIndex;
    const curHour = kObj.hours;

    let isNextWeek = false;
    if (curDayIndex === 0) { // Sunday
      isNextWeek = true;
    } else if (curDayIndex === 6 && curHour >= 6) { // Saturday after 6 AM
      isNextWeek = true;
    }

    const kolkataDate = new Date(Date.UTC(kObj.year, kObj.month, kObj.date, 12, 0, 0));

    let daysToMonday = 0;
    if (isNextWeek) {
      if (curDayIndex === 6) daysToMonday = 2; // Saturday -> next Monday is in 2 days
      else if (curDayIndex === 0) daysToMonday = 1; // Sunday -> next Monday is in 1 day
      else daysToMonday = 8 - curDayIndex;
    } else {
      daysToMonday = -(curDayIndex - 1);
    }

    const mondayDate = new Date(kolkataDate.getTime() + daysToMonday * 24 * 60 * 60 * 1000);
    
    const TARGET_INDEX: Record<string, number> = { 
      "Monday": 1, 
      "Tuesday": 2, 
      "Wednesday": 3, 
      "Thursday": 4, 
      "Friday": 5,
      "Saturday": 6,
      "Sunday": 7
    };
    const targetOffset = (TARGET_INDEX[dayName] || 1) - 1;
    
    const targetDate = new Date(mondayDate.getTime() + targetOffset * 24 * 60 * 60 * 1000);
    
    const day = targetDate.getUTCDate().toString().padStart(2, '0');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthName = months[targetDate.getUTCMonth()];
    const year = targetDate.getUTCFullYear();
    
    return `${day} ${monthName} ${year}`;
  };

  const getDayStatus = (dayName: string) => {
    return "closed"; // TEMPORARY CLOSURE
  };

  // Automatically scroll down to the active day card when menu page is loaded or simulated day is selected
  useEffect(() => {
    if (menuLoading) return;
    const targetElement = document.getElementById(`menu-card-${activeDayOfAction.toLowerCase()}`);
    if (targetElement) {
      const scrollTimer = setTimeout(() => {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
      return () => clearTimeout(scrollTimer);
    }
  }, [activeDayOfAction, menuLoading]);

  // Package selection per student per day. Key: `${studentName}_${day}` -> 'breakfast' | 'lunch' | 'lunchSnacks' | 'allTogether' | 'none'
  const [packageSelections, setPackageSelections] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('classroom_menu_package_selections');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [menuQtyMap, setMenuQtyMap] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('classroom_menu_qty_map');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const getMenuQty = (studentName: string, day: string) => {
    return menuQtyMap[`${studentName}_${day}`] || 1;
  };

  const adjustMenuQty = (studentName: string, day: string, direction: number) => {
    const key = `${studentName}_${day}`;
    const current = getMenuQty(studentName, day);
    const updated = current + direction;
    if (updated >= 1) {
      setMenuQtyMap(prev => {
        const nextMap = { ...prev, [key]: updated };
        localStorage.setItem('classroom_menu_qty_map', JSON.stringify(nextMap));
        return nextMap;
      });
    }
  };

  const getSelectedPackage = (studentName: string, day: string) => {
    const key = `${studentName}_${day}`;
    if (packageSelections[key] !== undefined) {
      return packageSelections[key];
    }
    return "allTogether"; // default to allTogether
  };

  const setSelectedPackage = (studentName: string, day: string, pkgId: string) => {
    const key = `${studentName}_${day}`;
    const currentPkg = getSelectedPackage(studentName, day);
    // If they click on already selected package, toggle it off (uncheck -> set to "none")
    const nextPkg = currentPkg === pkgId ? "none" : pkgId;

    setPackageSelections(prev => {
      const nextMap = {
        ...prev,
        [key]: nextPkg
      };
      localStorage.setItem('classroom_menu_package_selections', JSON.stringify(nextMap));
      return nextMap;
    });
  };

  // Active child being customized globally
  const [activeCardStudent, setActiveCardStudent] = useState<Record<string, string>>({});

  // Get the display child list
  const activeStudentsList = useMemo(() => {
    if (isTeacher) {
      return [{ name: user?.name || "Teacher", id: "teacher", planActive: true, isTeacher: true }];
    }
    return students.length > 0 ? students : [{ name: "Registered Student", id: "demo", planActive: true }];
  }, [students, isTeacher, user]);

  useEffect(() => {
    if (activeStudentsList.length > 0) {
      const isCurrentValid = activeStudentsList.some(s => s.name === selectedStudentName);
      if (!selectedStudentName || selectedStudentName === "Registered Student" || !isCurrentValid) {
        setSelectedStudentName(activeStudentsList[0].name);
      }
    }
  }, [activeStudentsList, selectedStudentName]);

  const handleOrderCustomMeals = (dayItem: any) => {
    if (!user) {
      toast.error("Please login to dispatch chosen meals to your cart. Redirecting you to login page...", { icon: '🔒', duration: 4050 });
      setTimeout(() => {
        navigate('/login?redirect=/weekly-menu');
      }, 1205);
      return;
    }

    const cardStatus = getDayStatus(dayItem.day);
    if (cardStatus !== "active" && cardStatus !== "today-active") {
      toast.error(`Canteen ordering is currently closed or inactive for ${dayItem.day}!`, { icon: '🔒' });
      return;
    }

    const targetStudentName = selectedStudentName || activeStudentsList[0]?.name || "Registered Student";

    if (!isTeacher && students.length === 0) {
      toast.error("Please add a child profile first.");
      navigate('/add-child');
      return;
    }

    const selectedMealsForDay = getSelectedMealTypes(targetStudentName, dayItem.day);
    const totalPackagePrice = getCustomMealPackagePrice(selectedMealsForDay);
    const qty = getMenuQty(targetStudentName, dayItem.day);

    if (selectedMealsForDay.length === 0) {
      toast.error(`Please select at least one meal checkbox option to order!`, { icon: '⚠️' });
      return;
    }

    // Determine the exact image of the meal selected
    const resolvedDayItem = resolvedWeeklyDays.find(d => d.day.toLowerCase() === dayItem.day.toLowerCase()) || dayItem;
    const dayMeals = resolvedDayItem.meals || [];
    let selectedImage = dayItem.image;
    let selectedImages: string[] = [];

    if (selectedMealsForDay.length === 1) {
      const singleMealType = selectedMealsForDay[0];
      const matchedMeal = dayMeals.find((m: any) => m.type?.toLowerCase() === singleMealType.toLowerCase());
      if (matchedMeal && matchedMeal.image) {
        selectedImage = matchedMeal.image;
      }
    } else if (selectedMealsForDay.length > 0) {
      const preferredOrder = ["Lunch", "Breakfast", "Snacks"];
      for (const mealType of preferredOrder) {
        if (selectedMealsForDay.includes(mealType)) {
          const matchedMeal = dayMeals.find((m: any) => m.type?.toLowerCase() === mealType.toLowerCase());
          if (matchedMeal && matchedMeal.image) {
            selectedImage = matchedMeal.image;
            break;
          }
        }
      }
      // Collect all images for multiple selections
      selectedImages = selectedMealsForDay.map(mealType => {
        const matched = dayMeals.find((m: any) => m.type?.toLowerCase() === mealType.toLowerCase());
        return matched?.image || "";
      }).filter(Boolean) as string[];
    }

    addToCart({
      id: `weekly_${dayItem.day.toLowerCase()}_meals_pack_${selectedMealsForDay.map(m => m.toLowerCase()).join('_')}_${targetStudentName.replace(/\s+/g, '_')}`,
      name: `[${dayItem.day}] Custom Diet Set (${selectedMealsForDay.join(', ')})`,
      price: totalPackagePrice,
      image: selectedImage,
      images: selectedImages.length > 1 ? selectedImages : undefined,
      quantity: qty
    }, targetStudentName);

    toast.success(`Success! Sent customized diet meals for ${targetStudentName} into your cart bag.`, {
      icon: '🍱',
      duration: 4000
    });
  };

  if (menuLoading) {
    return (
      <div className="w-full relative min-h-screen bg-transparent pt-12 pb-12 overflow-x-hidden flex flex-col items-center justify-center">
        <div className="absolute inset-0 pointer-events-none select-none z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-gradient-to-br from-indigo-500/5 to-[#FF4D9D]/5 rounded-full blur-[100px] animate-float-slow"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[350px] h-[350px] bg-gradient-to-br from-[#FF6B6B]/5 to-emerald-500/5 rounded-full blur-[80px] animate-float-reverse"></div>
        </div>
        <div className="flex flex-col items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
          <p className="text-slate-400 font-medium text-sm animate-pulse">Loading Gitanjali School Canteen Menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative min-h-screen bg-transparent pt-6 pb-12 overflow-x-hidden">
      
      {/* Exquisite Ambient Background Orbs */}
      <div className="absolute inset-0 pointer-events-none select-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-gradient-to-br from-indigo-500/5 to-[#FF4D9D]/5 rounded-full blur-[100px] animate-float-slow"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[350px] h-[350px] bg-gradient-to-br from-[#FF6B6B]/5 to-emerald-500/5 rounded-full blur-[80px] animate-float-reverse"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Title & Introduction Block */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-8"
        >
          <span className="bg-[#15193B]/60 border-white/10 text-white backdrop-blur-md border border-white/40 shadow-lg text-[#FF8E53] text-[9px] font-sans font-black uppercase tracking-widest px-4 py-1.5 rounded-full inline-flex items-center gap-2 mb-4">
            <Utensils className="w-3.5 h-3.5 text-[#FF4D9D]" /> Diet Scheduler
          </span>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight leading-tight mb-2">
            Weekly Interactive Menu
          </h1>
          <p className="text-slate-400 text-[11px] sm:text-xs font-semibold uppercase tracking-wider leading-relaxed">
            Choose individual meal selections for each child independently. Safe pediatric planning is fully customizable.
          </p>
        </motion.div>

        {/* Global Child Selector Tray */}
        {!isTeacher && students.length > 0 && (
          <div className="max-w-2xl mx-auto mb-10 p-5 bg-[#0a0f2c]/75 border border-white/10 rounded-3xl flex flex-col items-center gap-3 text-center backdrop-blur-md shadow-2xl">
            <span className="text-[10px] text-slate-400 font-sans tracking-widest uppercase font-black bg-white/5 border border-white/10 px-4 py-1.5 rounded-full inline-flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> Customizing Diet Scheduled Meals For:
            </span>
            <div className="flex flex-wrap justify-center gap-3 mt-1">
              {students.map((student) => {
                const isSelected = (selectedStudentName || students[0]?.name) === student.name;
                return (
                  <button
                    key={student.name}
                    id={`global-child-btn-${student.name.replace(/\s+/g, '-').toLowerCase()}`}
                    onClick={() => setSelectedStudentName(student.name)}
                    className={`px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer flex items-center gap-2 border ${
                      isSelected
                        ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 text-slate-950 border-emerald-400 shadow-[0_5px_15px_rgba(16,185,129,0.3)] scale-[1.02]"
                        : "bg-slate-950/60 text-slate-400 border-white/5 hover:border-white/15 hover:bg-slate-950 hover:text-white"
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${isSelected ? "bg-slate-950 animate-pulse" : "bg-emerald-500"}`}></div>
                    <span>{student.name}</span>
                    <span className="text-[9.5px] opacity-85 font-mono italic font-normal normal-case">
                      (Class {student.studentClass || student.grade || "N/A"})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Menu Grid Schedule */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14 max-w-7xl mx-auto pt-8">
          {resolvedWeeklyDays.map((dayItem, idx) => {
            const cardStatus = getDayStatus(dayItem.day);
            const targetStudentName = selectedStudentName || activeStudentsList[0]?.name || "Registered Student";

            return (
              <div key={idx} className="relative group">
                
                {/* Day Card Main Structural Body */}
                <motion.div
                  id={`menu-card-${dayItem.day.toLowerCase()}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05, duration: 0.5 }}
                  className={`rounded-3xl pt-12 pb-6 px-4 sm:px-6 relative flex flex-col justify-between h-full bg-gradient-to-b from-slate-900/90 via-[#0a0c10]/95 to-[#020211]/98 border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.6)] transition-all duration-500 ${
                    cardStatus === "closed" || cardStatus === "today-closed" || cardStatus === "target-closed"
                      ? "border border-rose-500/20 opacity-75 shadow-lg shadow-rose-950/25 bg-[#160c11]/80"
                      : cardStatus === "active" || cardStatus === "today-active"
                        ? "ring-2 ring-emerald-500/35 border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.12)]"
                        : "opacity-95 shadow-md hover:border-white/25"
                  }`}
                >

                  {/* Floating Day Ribbon */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-[95%] sm:w-auto flex justify-center z-10 font-sans">
                    <span className={`w-full sm:w-auto sm:px-8 text-center text-[10px] sm:text-xs font-black uppercase tracking-widest px-4 py-2.5 rounded-full shadow-lg whitespace-nowrap ${
                      cardStatus === "closed" || cardStatus === "today-closed" || cardStatus === "target-closed"
                        ? "bg-slate-950 border border-rose-500/50 text-rose-400"
                        : cardStatus === "active" || cardStatus === "today-active"
                          ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 text-slate-950 italic animate-pulse font-black" 
                          : "bg-gradient-to-r from-slate-800 to-slate-900 text-slate-300 border border-white/5"
                    }`}>
                      {dayItem.day} {
                        cardStatus === "today-active" ? " (Today - Open)" :
                        cardStatus === "today-closed" ? " (Today - Closed)" :
                        cardStatus === "active" ? " (Ordering Open)" :
                        cardStatus === "target-closed" ? " (Opens at 12 PM)" :
                        cardStatus === "closed" ? " (Orders Closed)" : " (View Menu)"
                      }
                    </span>
                    <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 ${
                      cardStatus === "closed" || cardStatus === "today-closed" || cardStatus === "target-closed"
                        ? "bg-rose-950 border-r border-b border-rose-500/30" 
                        : cardStatus === "active" || cardStatus === "today-active" 
                          ? "bg-blue-600" 
                          : "bg-slate-900"
                    }`}></div>
                  </div>

                  <div className="relative z-10">

                    <div className="flex justify-between items-start gap-2 mb-3 mt-2">
                      <div>
                        <h3 className="font-display font-black text-lg sm:text-2xl text-white drop-shadow-sm uppercase tracking-tight">
                          {dayItem.theme}
                        </h3>
                        <div className="text-[10px] sm:text-xs font-bold text-emerald-400/95 font-mono tracking-wider mt-0.5 uppercase">
                          🗓️ {getFormattedDateForDay(dayItem.day)}
                        </div>
                      </div>
                      {dayItem.popular && cardStatus === "active" && (
                        <span className="flex h-2 w-2 relative mt-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                      )}
                    </div>

                    <div className="mb-4">
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${dayItem.badgeBg}`}>
                        {dayItem.badge}
                      </span>
                    </div>

                    <p className="text-white/60 text-xs mb-5 font-semibold leading-relaxed">
                      {dayItem.tagline}
                    </p>

                    <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent w-full mb-4"></div>

                    {/* Integrated Customizer Widget */}
                    <div className="mb-4 p-4 bg-slate-950/80 border border-white/5 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Heart className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                          <span className="text-[9.5px] uppercase font-black text-slate-350 tracking-widest font-mono">Select Meal Options</span>
                        </div>
                        <span className="text-[9.5px] bg-slate-900 text-slate-400 py-1 px-2.5 rounded-lg border border-white/5 font-black uppercase">
                          For: {targetStudentName}
                        </span>
                      </div>

                      {/* Package Plan Choices Option Cards Grid */}
                      <div className="grid grid-cols-2 gap-2 mt-3 select-none">
                        {[
                          { id: "breakfast", label: "Breakfast Only", price: prices.breakfast, desc: "Breakfast menu" },
                          { id: "lunch", label: "Lunch Only", price: prices.lunch, desc: "Lunch menu" },
                          { id: "breakfastLunch", label: "Breakfast + Lunch", price: prices.breakfastLunch ?? 130, desc: "Breakfast + Lunch" },
                          { id: "lunchSnacks", label: "Lunch + Snacks", price: prices.lunchSnacks, desc: "Lunch, snacks" },
                          { id: "allTogether", label: "All Together", price: prices.allTogether, desc: "Full daily meal plan" }
                        ].map((pkg) => {
                          const isPkgSelected = getSelectedPackage(targetStudentName, dayItem.day) === pkg.id;
                          return (
                             <div
                               key={pkg.id}
                               onClick={() => setSelectedPackage(targetStudentName, dayItem.day, pkg.id)}
                               className={`p-2 py-2 px-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[56px] h-auto ${
                                 pkg.id === "allTogether" ? "col-span-2" : ""
                               } ${
                                 isPkgSelected
                                   ? "border-emerald-500 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.08)] scale-[1.01]"
                                   : "border-white/5 bg-slate-950/60 hover:bg-slate-950/90 hover:border-white/10 opacity-80"
                               }`}
                             >
                               <div className="flex items-center gap-1.5 min-w-0">
                                 <input 
                                   type="checkbox"
                                   checked={isPkgSelected}
                                   onChange={() => setSelectedPackage(targetStudentName, dayItem.day, pkg.id)}
                                   onClick={(e) => e.stopPropagation()} // Prevent double clicks
                                   className="rounded border-white/20 text-emerald-500 bg-slate-900 focus:ring-0 cursor-pointer w-3 h-3 accent-emerald-500 shrink-0"
                                 />
                                 <span className="text-[9.5px] sm:text-[10px] font-black text-white leading-none">{pkg.label}</span>
                               </div>
                               <div className="flex items-center justify-between gap-1 mt-1">
                                 <span className="text-[8px] text-slate-400 truncate leading-none">{pkg.desc}</span>
                                 <span className="text-[10px] font-mono font-black text-emerald-400 shrink-0 leading-none font-sans">₹{pkg.price}</span>
                               </div>
                               {isPkgSelected && (
                                 <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-bl-lg flex items-center justify-center">
                                   <Check className="w-2 h-2 text-slate-950 stroke-[4px]" />
                                 </div>
                               )}
                             </div>
                           );
                        })}
                      </div>

                      {/* Compact Daily Menu Items Strip List */}
                      <div className="mt-4 space-y-2">
                        <div className="text-[10px] uppercase font-black tracking-wider text-slate-400 font-mono">Daily Menu Dishes:</div>
                        <div className="space-y-2">
                          {dayItem.meals.map((meal: any, mIdx: number) => {
                            const selectedPkgId = getSelectedPackage(targetStudentName, dayItem.day);
                            const includesMeal = (pkgId: string, type: string) => {
                              if (pkgId === "none") return false;
                              if (pkgId === "breakfast") return type === "Breakfast";
                              if (pkgId === "lunch") return type === "Lunch";
                              if (pkgId === "breakfastLunch") return type === "Breakfast" || type === "Lunch";
                              if (pkgId === "lunchSnacks") return type === "Lunch" || type === "Snacks";
                              return true;
                            };
                            
                            const isIncluded = includesMeal(selectedPkgId, meal.type);

                            return (
                              <div 
                                key={mIdx} 
                                className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                                  isIncluded
                                    ? "bg-slate-900/60 border-white/10 shadow-sm"
                                    : "bg-transparent border-transparent opacity-20"
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  {/* Gourmet Food Snippet Image */}
                                  <div className="w-11 h-11 rounded-lg bg-slate-950 overflow-hidden shrink-0 border border-white/10 shadow-inner">
                                    <img 
                                      src={meal.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&q=80"} 
                                      alt={meal.title} 
                                      className="w-full h-full object-cover" 
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <span className={`text-[8px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded shrink-0 mb-1 inline-block ${
                                      isIncluded
                                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                                        : "bg-white/5 text-slate-500 border border-white/5"
                                    }`}>
                                      {meal.type}
                                    </span>
                                    <h4 className="text-[11px] sm:text-[12px] font-extrabold text-white whitespace-normal break-words leading-tight">{meal.title}</h4>
                                  </div>
                                </div>
                                {isIncluded && (
                                  <span className="text-[8px] font-mono font-bold text-emerald-400 uppercase tracking-widest shrink-0 bg-emerald-500/5 px-2 py-0.5 rounded-lg border border-emerald-500/10 mt-0.5 ml-2">
                                    Selected
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Quantity Selector Section */}
                      <div className="mt-3.5 p-2 px-3 bg-slate-950/20 border border-white/5 rounded-xl flex items-center justify-between select-none">
                        <span className="text-[10px] font-sans font-bold text-slate-350">Order Quantity:</span>
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => adjustMenuQty(targetStudentName, dayItem.day, -1)}
                            className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 border border-white/10 active:scale-90 transition-all cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-[11px] font-mono font-black text-white w-4 text-center">{getMenuQty(targetStudentName, dayItem.day)}</span>
                          <button
                            type="button"
                            onClick={() => adjustMenuQty(targetStudentName, dayItem.day, 1)}
                            className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 border border-white/10 active:scale-90 transition-all cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Live Reactive Selection Total */}
                      <div className="mt-2.5 p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center justify-between">
                        <span className="text-[10px] font-sans font-bold text-slate-350">Subtotal:</span>
                        <div className="flex flex-col items-end">
                          <span className="text-[11px] font-display font-black text-emerald-400 uppercase tracking-tight">
                            ₹{getCustomMealPackagePrice(getSelectedMealTypes(targetStudentName, dayItem.day)) * getMenuQty(targetStudentName, dayItem.day)}/-
                            {getMenuQty(targetStudentName, dayItem.day) > 1 && (
                              <span className="text-[8px] font-normal text-slate-400 block text-right mt-0.5 font-mono normal-case">
                                (₹{getCustomMealPackagePrice(getSelectedMealTypes(targetStudentName, dayItem.day))} × {getMenuQty(targetStudentName, dayItem.day)})
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Action Button Panel */}
                  <button
                    onClick={() => handleOrderCustomMeals(dayItem)}
                    disabled={!(cardStatus === "active" || cardStatus === "today-active")}
                    className={`w-full py-3.5 rounded-2xl font-display font-black text-xs uppercase tracking-widest transition-all duration-350 select-none border-b-2 mt-2 ${
                      (cardStatus === "active" || cardStatus === "today-active")
                        ? "cursor-pointer hover:scale-[1.015] active:scale-95 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 text-slate-950 shadow-[0_15px_30px_rgba(16,185,129,0.15)] border-teal-300/30"
                        : "bg-rose-950/20 text-rose-500/50 border-rose-950/40 cursor-not-allowed opacity-60"
                    }`}
                  >
                    {cardStatus === "active" || cardStatus === "today-active"
                      ? "add to cart"
                      : cardStatus === "today-closed"
                        ? "Today's Slot Closed"
                        : cardStatus === "target-closed"
                          ? "Opens at 12:00 PM IST"
                          : cardStatus === "closed"
                            ? "Orders Closed"
                            : "Opens Soon"
                    }
                  </button>

                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
