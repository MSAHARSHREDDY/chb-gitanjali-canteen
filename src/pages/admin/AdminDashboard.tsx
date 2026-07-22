import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  Award, 
  PieChart, 
  Activity, 
  ChevronRight, 
  RefreshCw,
  Plus,
  Trash2,
  Calendar,
  FileText,
  AlertTriangle
} from 'lucide-react';

interface MonthlySale {
  month: string;
  revenue: number;
  orders: number;
}

interface CategorySale {
  category: string;
  revenue: number;
}

interface TopDish {
  name: string;
  quantity: number;
  revenue: number;
  image?: string;
}

interface StatusBreakdown {
  [key: string]: number;
}

interface Metrics {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  monthlySales: MonthlySale[];
  categorySales: CategorySale[];
  topDishes: TopDish[];
  statusBreakdown: StatusBreakdown;
}

const getLocalTodayString = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const parseLocalMidnight = (dateStr: string) => {
  if (!dateStr) return new Date();
  const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = cleanDate.split('-');
  if (parts.length === 3) {
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }
  return new Date(cleanDate);
};

export function AdminDashboard() {
  const { token } = useAuth();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);

  // Offline Sales Manager state
  const [activeTab, setActiveTab] = useState<'overview' | 'offline' | 'expenses' | 'pnl'>('overview');
  const [offlineSales, setOfflineSales] = useState<any[]>([]);
  const [fetchingSales, setFetchingSales] = useState(false);
  const [offlineTab, setOfflineTab] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('daily');
  const [submissionLoading, setSubmissionLoading] = useState(false);

  // Deletion confirmations
  const [deleteConfirmSale, setDeleteConfirmSale] = useState<{ id: string; description: string; amount: number } | null>(null);
  const [deleteConfirmExpense, setDeleteConfirmExpense] = useState<{ id: string; description: string; amount: number } | null>(null);

  // Form Field State
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => getLocalTodayString());
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [category, setCategory] = useState('Counter');

  // Offline Expenses Tracker state
  const [offlineExpenses, setOfflineExpenses] = useState<any[]>([]);
  const [fetchingExpenses, setFetchingExpenses] = useState(false);
  const [expensesTab, setExpensesTab] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('daily');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Ingredients');
  const [expenseDate, setExpenseDate] = useState(() => getLocalTodayString());
  const [expenseSubmissionLoading, setExpenseSubmissionLoading] = useState(false);

  // Online Orders list state (for accurate consolidated P&L matching)
  const [onlineOrders, setOnlineOrders] = useState<any[]>([]);
  const [fetchingOrders, setFetchingOrders] = useState(false);

  // Pagination Parameters and State parameters
  const ITEMS_PER_PAGE = 5;
  const [salesPage, setSalesPage] = useState(1);
  const [expensesPage, setExpensesPage] = useState(1);
  const [pnlPage, setPnlPage] = useState(1);

  useEffect(() => {
    setSalesPage(1);
  }, [offlineTab]);

  useEffect(() => {
    setExpensesPage(1);
  }, [expensesTab]);

  const fetchMetrics = () => {
    setLoading(true);
    fetch('/api/admin/metrics', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = "/";
          return null; // Stop chain
        }
        return res.json();
      })
      .then(data => {
        if (!data) return; // Break if redirected
        if (data && !data.error) {
          setMetrics(data);
        } else if (data.error && data.error !== 'Invalid token') {
          // You could toast the error here if you wanted
          console.error("Dashboard error:", data.error);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const fetchOfflineSales = () => {
    setFetchingSales(true);
    fetch('/api/admin/offline-sales', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setOfflineSales(data);
        }
        setFetchingSales(false);
      })
      .catch(err => {
        console.error(err);
        setFetchingSales(false);
      });
  };

  const fetchOfflineExpenses = () => {
    setFetchingExpenses(true);
    fetch('/api/admin/offline-expenses', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setOfflineExpenses(data);
        }
        setFetchingExpenses(false);
      })
      .catch(err => {
        console.error(err);
        setFetchingExpenses(false);
      });
  };

  const fetchOnlineOrders = () => {
    setFetchingOrders(true);
    fetch('/api/admin/orders', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setOnlineOrders(data);
        }
        setFetchingOrders(false);
      })
      .catch(err => {
        console.error(err);
        setFetchingOrders(false);
      });
  };

  useEffect(() => {
    fetchMetrics();
    fetchOfflineSales();
    fetchOfflineExpenses();
    fetchOnlineOrders();
  }, [token]);

  const handleAddOfflineSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    if (!description.trim()) {
      alert("Please specify a description/memo");
      return;
    }

    setSubmissionLoading(true);
    try {
      const response = await fetch('/api/admin/offline-sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: Number(amount),
          description: description.trim(),
          date,
          paymentMethod,
          category
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create transaction");
      }
      
      // Reset form fields
      setAmount('');
      setDescription('');
      setDate(getLocalTodayString());
      
      // Refresh statistics AND the list
      fetchMetrics();
      fetchOfflineSales();
    } catch (err: any) {
      alert(err.message || "Error adding offline transaction");
    } finally {
      setSubmissionLoading(false);
    }
  };

  const handleDeleteOfflineSale = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/offline-sales/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete transaction");
      }
      // Refresh everything
      fetchMetrics();
      fetchOfflineSales();
    } catch (err: any) {
      alert(err.message || "Error deleting transaction");
    }
  };

  const handleAddOfflineExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount || isNaN(Number(expenseAmount)) || Number(expenseAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    if (!expenseDescription.trim()) {
      alert("Please specify a description/memo");
      return;
    }

    setExpenseSubmissionLoading(true);
    try {
      const response = await fetch('/api/admin/offline-expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: Number(expenseAmount),
          description: expenseDescription.trim(),
          date: expenseDate,
          category: expenseCategory
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create expense transaction");
      }
      
      // Reset form fields
      setExpenseAmount('');
      setExpenseDescription('');
      setExpenseDate(getLocalTodayString());
      
      // Refresh statistics AND the list
      fetchMetrics();
      fetchOfflineExpenses();
    } catch (err: any) {
      alert(err.message || "Error adding offline expense");
    } finally {
      setExpenseSubmissionLoading(false);
    }
  };

  const handleDeleteOfflineExpense = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/offline-expenses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete expense");
      }
      // Refresh everything
      fetchMetrics();
      fetchOfflineExpenses();
    } catch (err: any) {
      alert(err.message || "Error deleting expense");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <RefreshCw className="w-10 h-10 animate-spin text-gold-500 mb-4" />
        <p className="font-mono text-sm tracking-widest uppercase">Calculating Real-Time Metrics...</p>
      </div>
    );
  }

  if (!metrics) {
    return <div className="text-red-500">Error loading dashboard statistics. Please refresh.</div>;
  }

  // --- STATS CARDS ---
  const statCards = [
    { 
      title: 'Gross Revenue', 
      value: `₹${metrics.totalRevenue.toLocaleString()}`, 
      icon: <DollarSign className="w-6 h-6 text-emerald-400" />,
      desc: 'All culinary ticket logs',
      accent: 'border-emerald-500/20'
    },
    { 
      title: 'Total Canteen Orders', 
      value: metrics.totalOrders, 
      icon: <ShoppingBag className="w-6 h-6 text-gold-500" />,
      desc: 'Meals dispatched to seats',
      accent: 'border-gold-500/20'
    },
    { 
      title: 'Total Users', 
      value: metrics.totalUsers, 
      icon: <Users className="w-6 h-6 text-purple-400" />,
      desc: 'Registered dining accounts',
      accent: 'border-purple-500/20'
    },
  ];

  // --- CALCULATE MATH FOR MONTHLY SALES FLOW CHART ---
  const revenues = metrics.monthlySales.map(m => m.revenue);
  const maxRevenue = Math.max(...revenues, 1000);
  const minRevenue = Math.min(...revenues, 0);
  const maxValLimit = maxRevenue * 1.15; // padding top

  // Generate SVG coordinates for a 500x200 canvas
  const canvasWidth = 600;
  const canvasHeight = 220;
  const paddingX = 50;
  const paddingY = 30;

  const getCoordinates = (idx: number, rev: number) => {
    const totalPoints = metrics.monthlySales.length;
    const x = paddingX + (idx / (totalPoints - 1)) * (canvasWidth - paddingX * 2);
    // Invert Y axis for SVG rendering (0 is at the top)
    const yRange = canvasHeight - paddingY * 2;
    const y = canvasHeight - paddingY - ((rev - minRevenue) / (maxValLimit - minRevenue)) * yRange;
    return { x, y };
  };

  const coordinates = metrics.monthlySales.map((m, idx) => getCoordinates(idx, m.revenue));

  // Build the SVG path string
  let linePath = '';
  if (coordinates.length > 0) {
    linePath = `M ${coordinates[0].x} ${coordinates[0].y} ` + 
      coordinates.slice(1).map(pt => `L ${pt.x} ${pt.y}`).join(' ');
  }

  // Gradient area path string
  let areaPath = '';
  if (coordinates.length > 0) {
    areaPath = `${linePath} L ${coordinates[coordinates.length - 1].x} ${canvasHeight - paddingY} L ${coordinates[0].x} ${canvasHeight - paddingY} Z`;
  }

  // Order status badge colors helper
  const statusBadgeColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30';
      case 'Preparing': return 'bg-orange-500/15 text-orange-500 border-orange-500/30';
      case 'Out for Delivery': return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
      case 'Delivered': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Cancelled': return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      default: return 'bg-gray-500/15 text-gray-400 border-gray-500/30';
    }
  };

  // Filtering helper for ledger view
  const getFilteredSales = () => {
    const now = new Date();
    return offlineSales.filter(sale => {
      const saleDate = parseLocalMidnight(sale.date);
      switch (offlineTab) {
        case 'daily':
          return true; // Day-to-day transaction ledger, show all entries chronological
        case 'weekly': {
          const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
          return saleDate >= sevenDaysAgo;
        }
        case 'monthly': {
          const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          return saleDate >= startOfThisMonth;
        }
        case 'quarterly': {
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const startOfThisQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
          return saleDate >= startOfThisQuarter;
        }
        case 'yearly': {
          const startOfThisYear = new Date(now.getFullYear(), 0, 1);
          return saleDate >= startOfThisYear;
        }
        default:
          return true;
      }
    });
  };

  // Aggregate stats helper for top ledger dashboard
  const getOfflineGroupTotals = () => {
    const now = new Date();
    
    // Start of Today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dailyTotal = offlineSales
      .filter(s => parseLocalMidnight(s.date) >= startOfToday)
      .reduce((sum, s) => sum + (s.amount || 0), 0);

    // Last 7 days
    const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    const weeklyTotal = offlineSales
      .filter(s => parseLocalMidnight(s.date) >= sevenDaysAgo)
      .reduce((sum, s) => sum + (s.amount || 0), 0);

    // This Month
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyTotal = offlineSales
      .filter(s => parseLocalMidnight(s.date) >= startOfThisMonth)
      .reduce((sum, s) => sum + (s.amount || 0), 0);

    // This Quarter
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const startOfThisQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
    const quarterlyTotal = offlineSales
      .filter(s => parseLocalMidnight(s.date) >= startOfThisQuarter)
      .reduce((sum, s) => sum + (s.amount || 0), 0);

    // This Calendar Year
    const startOfThisYear = new Date(now.getFullYear(), 0, 1);
    const yearlyTotal = offlineSales
      .filter(s => parseLocalMidnight(s.date) >= startOfThisYear)
      .reduce((sum, s) => sum + (s.amount || 0), 0);

    return { dailyTotal, weeklyTotal, monthlyTotal, quarterlyTotal, yearlyTotal };
  };

  // Filtering helper for expense ledger view
  const getFilteredExpenses = () => {
    const now = new Date();
    return offlineExpenses.filter(expense => {
      const expenseDate = parseLocalMidnight(expense.date);
      switch (expensesTab) {
        case 'daily':
          return true; // Day-to-day transaction ledger, show all entries chronological
        case 'weekly': {
          const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
          return expenseDate >= sevenDaysAgo;
        }
        case 'monthly': {
          const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          return expenseDate >= startOfThisMonth;
        }
        case 'quarterly': {
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const startOfThisQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
          return expenseDate >= startOfThisQuarter;
        }
        case 'yearly': {
          const startOfThisYear = new Date(now.getFullYear(), 0, 1);
          return expenseDate >= startOfThisYear;
        }
        default:
          return true;
      }
    });
  };

  // Aggregate stats helper for top ledger dashboard of expenses
  const getOfflineExpenseGroupTotals = () => {
    const now = new Date();
    
    // Start of Today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dailyTotal = offlineExpenses
      .filter(e => parseLocalMidnight(e.date) >= startOfToday)
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    // Last 7 days
    const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    const weeklyTotal = offlineExpenses
      .filter(e => parseLocalMidnight(e.date) >= sevenDaysAgo)
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    // This Month
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyTotal = offlineExpenses
      .filter(e => parseLocalMidnight(e.date) >= startOfThisMonth)
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    // This Quarter
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const startOfThisQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
    const quarterlyTotal = offlineExpenses
      .filter(e => parseLocalMidnight(e.date) >= startOfThisQuarter)
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    // This Calendar Year
    const startOfThisYear = new Date(now.getFullYear(), 0, 1);
    const yearlyTotal = offlineExpenses
      .filter(e => parseLocalMidnight(e.date) >= startOfThisYear)
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    return { dailyTotal, weeklyTotal, monthlyTotal, quarterlyTotal, yearlyTotal };
  };

  // Comprehensive P&L calculation dynamic matcher
  const getPnLData = () => {
    const now = new Date();
    
    // Helper to check if dates are same day
    const isSameDay = (d1: Date, d2: Date) => {
      return d1.getFullYear() === d2.getFullYear() &&
             d1.getMonth() === d2.getMonth() &&
             d1.getDate() === d2.getDate();
    };

    // Helper to check if date is within last X days
    const isWithinDays = (date: Date, days: number) => {
      const diffTime = now.getTime() - date.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= days;
    };

    // Helper to check if date is this month
    const isThisMonth = (date: Date) => {
      return date.getFullYear() === now.getFullYear() &&
             date.getMonth() === now.getMonth();
    };

    // Calculate totals for a given filter
    const computeTotals = (
      orderFilter: (o: any) => boolean,
      offlineSaleFilter: (s: any) => boolean,
      expenseFilter: (e: any) => boolean
    ) => {
      const onlineRev = onlineOrders
        .filter(o => o.status !== 'Cancelled')
        .filter(orderFilter)
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      const offlineRev = offlineSales
        .filter(offlineSaleFilter)
        .reduce((sum, s) => sum + (s.amount || 0), 0);

      const expTotal = offlineExpenses
        .filter(expenseFilter)
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      const revTotal = onlineRev + offlineRev;
      const profit = revTotal - expTotal;

      return {
        onlineRevenue: onlineRev,
        offlineRevenue: offlineRev,
        totalRevenue: revTotal,
        totalExpenses: expTotal,
        netProfit: profit
      };
    };

    // 1. Daily (Today)
    const daily = computeTotals(
      o => isSameDay(new Date(o.createdAt || Date.now()), now),
      s => isSameDay(parseLocalMidnight(s.date), now),
      e => isSameDay(parseLocalMidnight(e.date), now)
    );

    // 2. Weekly (7 Days)
    const weekly = computeTotals(
      o => isWithinDays(new Date(o.createdAt || Date.now()), 7),
      s => isWithinDays(parseLocalMidnight(s.date), 7),
      e => isWithinDays(parseLocalMidnight(e.date), 7)
    );

    // 3. Monthly (This Month)
    const monthly = computeTotals(
      o => isThisMonth(new Date(o.createdAt || Date.now())),
      s => isThisMonth(parseLocalMidnight(s.date)),
      e => isThisMonth(parseLocalMidnight(e.date))
    );

    // 4. Year-by-Year Breakdown
    const yearsSet = new Set<number>();
    onlineOrders.forEach(o => {
      if (o.createdAt) yearsSet.add(new Date(o.createdAt).getFullYear());
    });
    offlineSales.forEach(s => {
      if (s.date) yearsSet.add(parseLocalMidnight(s.date).getFullYear());
    });
    offlineExpenses.forEach(e => {
      if (e.date) yearsSet.add(parseLocalMidnight(e.date).getFullYear());
    });

    // Default to at least this year if empty
    if (yearsSet.size === 0) {
      yearsSet.add(now.getFullYear());
    }

    const yearlyBreakdown = Array.from(yearsSet)
      .sort((a, b) => b - a) // Most recent year first
      .map(year => {
        const stats = computeTotals(
          o => new Date(o.createdAt || Date.now()).getFullYear() === year,
          s => parseLocalMidnight(s.date).getFullYear() === year,
          e => parseLocalMidnight(e.date).getFullYear() === year
        );
        return {
          year,
          ...stats
        };
      });

    return {
      daily,
      weekly,
      monthly,
      yearlyBreakdown
    };
  };

  const filteredSales = getFilteredSales();
  const totalSalesPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE) || 1;
  const currentSalesPage = Math.min(salesPage, totalSalesPages);
  const paginatedSales = filteredSales.slice((currentSalesPage - 1) * ITEMS_PER_PAGE, currentSalesPage * ITEMS_PER_PAGE);

  const filteredExpenses = getFilteredExpenses();
  const totalExpensesPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE) || 1;
  const currentExpensesPage = Math.min(expensesPage, totalExpensesPages);
  const paginatedExpenses = filteredExpenses.slice((currentExpensesPage - 1) * ITEMS_PER_PAGE, currentExpensesPage * ITEMS_PER_PAGE);

  const pnlBreakdown = getPnLData().yearlyBreakdown;
  const totalPnlPages = Math.ceil(pnlBreakdown.length / ITEMS_PER_PAGE) || 1;
  const currentPnlPage = Math.min(pnlPage, totalPnlPages);
  const paginatedPnlBreakdown = pnlBreakdown.slice((currentPnlPage - 1) * ITEMS_PER_PAGE, currentPnlPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-8 animate-in fade-in duration-350">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-r from-slate-900 to-slate-950 border border-white/10 rounded-2xl p-6 md:p-8 gap-4">
        <div>
          <span className="text-gold-500 text-xs font-mono tracking-widest uppercase mb-1 block">Administrative Control</span>
          <h3 className="text-3xl font-serif text-white">Canteen Catering Canteen</h3>
          <p className="text-gray-400 text-sm mt-1">Real-time analytical graphs of sales, customer accounts, and seat fulfillment.</p>
        </div>
        <button 
          onClick={() => { fetchMetrics(); fetchOfflineSales(); fetchOfflineExpenses(); fetchOnlineOrders(); }}
          className="flex items-center gap-2 border border-white/10 hover:border-gold-500/50 hover:bg-white/5 text-gray-300 hover:text-gold-500 px-4 py-2.5 rounded-xl transition-all cursor-pointer font-mono text-xs text-right"
        >
          <RefreshCw className="w-4 h-4" />
          <span>RELOAD SENSOR DATA</span>
        </button>
      </div>

      {/* Tabs Layout Navigation */}
      <div className="flex flex-wrap border-b border-white/5 pb-1 gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-5 py-2.5 rounded-t-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border ${
            activeTab === 'overview'
              ? 'bg-gold-500/10 border-gold-500/30 text-gold-500 border-b-transparent'
              : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Overview Statistics
        </button>
        <button
          onClick={() => setActiveTab('offline')}
          className={`px-5 py-2.5 rounded-t-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border ${
            activeTab === 'offline'
              ? 'bg-gold-500/10 border-gold-500/30 text-gold-500 border-b-transparent'
              : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Offline Sales Ledger
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-5 py-2.5 rounded-t-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border ${
            activeTab === 'expenses'
              ? 'bg-gold-500/10 border-gold-500/30 text-gold-500 border-b-transparent'
              : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Offline Expenses Tracker
        </button>
        <button
          onClick={() => setActiveTab('pnl')}
          className={`px-5 py-2.5 rounded-t-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border ${
            activeTab === 'pnl'
              ? 'bg-gold-500/10 border-gold-500/30 text-gold-500 border-b-transparent'
              : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Profit & Loss Statements
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Main KPI Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {statCards.map((stat, idx) => (
              <div 
                key={idx} 
                className={`bg-slate-900 border ${stat.accent} rounded-2xl p-6 flex items-center justify-between shadow-lg relative group overflow-hidden`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-widest mb-1.5 font-bold font-mono">{stat.title}</p>
                  <h4 className="text-4xl font-bold text-white tracking-tight">{stat.value}</h4>
                  <p className="text-gray-500 text-[11px] mt-2 font-medium">{stat.desc}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  {stat.icon}
                </div>
              </div>
            ))}
          </div>

          {/* Charts & Interactive Flow Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* SVG MONTHLY SALES FLOW CHART */}
            <div className="lg:col-span-8 bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2.5">
                    <TrendingUp className="w-5 h-5 text-gold-500" />
                    <h4 className="text-lg font-serif text-white">Monthly Sales Flow</h4>
                  </div>
                  <span className="text-[10px] font-mono tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20 uppercase font-bold">
                    Live Revenue Trend
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-6">Interactive tracking of gross value flow and Canteen booking logs across the last 6 months.</p>
              </div>

              <div className="relative w-full">
                {/* Real SVG Area chart with Line Flow */}
                <svg 
                  viewBox={`0 0 ${canvasWidth} ${canvasHeight}`} 
                  className="w-full h-auto text-gray-700 overflow-visible"
                  id="monthly-sales-chart-svg"
                >
                  {/* Defs for gorgeous glow gradients */}
                  <defs>
                    <linearGradient id="areaGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="lineGlow" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#b4932d" />
                      <stop offset="50%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#FCD34D" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  <line x1={paddingX} y1={paddingY} x2={canvasWidth - paddingX} y2={paddingY} stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
                  <line x1={paddingX} y1={(paddingY + canvasHeight) / 2} x2={canvasWidth - paddingX} y2={(paddingY + canvasHeight) / 2} stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
                  <line x1={paddingX} y1={canvasHeight - paddingY} x2={canvasWidth - paddingX} y2={canvasHeight - paddingY} stroke="rgba(255,255,255,0.08)" />

                  {/* Glowing Area path fill */}
                  {areaPath && (
                    <path d={areaPath} fill="url(#areaGlow)" />
                  )}

                  {/* Main Line path */}
                  {linePath && (
                    <path 
                      d={linePath} 
                      fill="none" 
                      stroke="url(#lineGlow)" 
                      strokeWidth="3.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                  )}

                  {/* Interaction Node Circles & Tooltip Tracker */}
                  {coordinates.map((pt, idx) => (
                    <g 
                      key={idx}
                      className="cursor-pointer group/node"
                      onMouseEnter={() => setHoveredMonthIdx(idx)}
                      onMouseLeave={() => setHoveredMonthIdx(null)}
                    >
                      {/* Invisible larger hover node target */}
                      <circle 
                        cx={pt.x} 
                        cy={pt.y} 
                        r="15" 
                        fill="transparent" 
                      />
                      {/* Outer Pulsing Aura on Hover */}
                      <circle 
                        cx={pt.x} 
                        cy={pt.y} 
                        r={hoveredMonthIdx === idx ? "10" : "6"} 
                        fill="#D4AF37" 
                        fillOpacity={hoveredMonthIdx === idx ? "0.3" : "0.0"} 
                        className="transition-all duration-200"
                      />
                      {/* Core Node White Pin */}
                      <circle 
                        cx={pt.x} 
                        cy={pt.y} 
                        r="4.5" 
                        fill="#060b19" 
                        stroke="#F59E0B" 
                        strokeWidth="2.5" 
                      />
                    </g>
                  ))}

                  {/* X Axis Labels */}
                  {metrics.monthlySales.map((m, idx) => {
                    const pt = getCoordinates(idx, m.revenue);
                    return (
                      <text 
                        key={idx}
                        x={pt.x} 
                        y={canvasHeight - 8} 
                        textAnchor="middle" 
                        fill="#9ca3af" 
                        fontSize="10"
                        fontFamily="monospace"
                      >
                        {m.month}
                      </text>
                    );
                  })}

                  {/* Y Axis upper and lower bounds */}
                  <text x={paddingX - 10} y={paddingY + 4} textAnchor="end" fill="#6b7280" fontSize="9" fontFamily="monospace">
                    ₹{Math.round(maxValLimit)}
                  </text>
                  <text x={paddingX - 10} y={canvasHeight - paddingY + 4} textAnchor="end" fill="#6b7280" fontSize="9" fontFamily="monospace">
                    ₹0
                  </text>
                </svg>

                {/* Float Tooltip panel above the hovered SVG coordinate */}
                {hoveredMonthIdx !== null && (
                  <div 
                    className="absolute bg-slate-950 border border-gold-500/40 p-3 rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-100 pointer-events-none"
                    style={{
                      left: `${(coordinates[hoveredMonthIdx].x / canvasWidth) * 100}%`,
                      top: `${Math.max(10, (coordinates[hoveredMonthIdx].y / canvasHeight) * 100 - 35)}%`,
                      transform: 'translateX(-50%)',
                    }}
                  >
                    <div className="font-mono text-[9px] uppercase tracking-widest text-gold-500 font-bold mb-0.5">
                      {metrics.monthlySales[hoveredMonthIdx].month} Analytics
                    </div>
                    <div className="text-sm font-bold text-white mb-0.5">
                      ₹{metrics.monthlySales[hoveredMonthIdx].revenue.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {metrics.monthlySales[hoveredMonthIdx].orders} customized orders
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* DRINK & FOOD CATEGORY PERFORMANCE BREAKDOWN */}
            <div className="lg:col-span-4 bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <PieChart className="w-5 h-5 text-gold-500" />
                  <h4 className="text-lg font-serif text-white">Category Performance</h4>
                </div>
                <p className="text-xs text-gray-400 mb-6">Revenue shares grouped by gourmet division categories.</p>
              </div>

              <div className="space-y-4 flex-grow flex flex-col justify-center">
                {metrics.categorySales.map((cat, idx) => {
                  const maxCategoryAmount = Math.max(...metrics.categorySales.map(c => c.revenue), 100);
                  const percentageOfMax = (cat.revenue / maxCategoryAmount) * 100;
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-300 font-medium">{cat.category}</span>
                        <span className="text-gold-500 font-bold font-mono">₹{cat.revenue.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="bg-gradient-to-r from-gold-600 to-gold-400 h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${percentageOfMax}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                
                {metrics.categorySales.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm font-mono">
                    No categorical sales logged.
                  </div>
                )}
              </div>

              <div className="border-t border-white/5 pt-4 mt-4 flex items-center justify-between text-xs text-gray-400">
                <span>Overall Division Share</span>
                <span className="text-emerald-400 font-mono flex items-center gap-1 font-bold">
                  <Activity className="w-3.5 h-3.5" /> 100% Operational
                </span>
              </div>
            </div>
          </div>

          {/* Lower Row: Order Tracking Cycles & Top Performing Meals list */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* TOP PERFORMING MENU MEALS LIST */}
            <div className="lg:col-span-8 bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2.5">
                  <Award className="w-5 h-5 text-gold-500" />
                  <h4 className="text-lg font-serif text-white font-medium">Top Gastronomy Classics</h4>
                </div>
                <span className="text-xs text-gray-400 uppercase tracking-widest font-mono">Best Sellers</span>
              </div>

              <div className="divide-y divide-white/5">
                {metrics.topDishes.map((dish, i) => (
                  <div key={i} className="py-4 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-gold-400/10 border border-gold-500/20 flex items-center justify-center text-gold-500 font-bold font-mono text-[13px] shrink-0 shrink-0">
                        #{i + 1}
                      </div>
                      <div>
                        <h5 className="text-white text-sm font-semibold">{dish.name}</h5>
                        <p className="text-xs text-gray-500 mt-1">{dish.quantity} units served first-class</p>
                      </div>
                    </div>
                  </div>
                ))}

                {metrics.topDishes.length === 0 && (
                  <div className="text-center py-10 text-gray-500 font-mono text-xs">
                    Pending checkouts to calculate dishes leaderboard.
                  </div>
                )}
              </div>
            </div>

            {/* Canteen ORDER STATUS DISTRIBUTION */}
            <div className="lg:col-span-4 bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-gold-500" />
                  <h4 className="text-lg font-serif text-white font-medium">Order Progression Cycles</h4>
                </div>
                <p className="text-xs text-gray-400 mb-6">Status log of passengers currently preparing or dining.</p>
              </div>

              <div className="space-y-4 flex-grow flex flex-col justify-center">
                {Object.keys(metrics.statusBreakdown).map((status, index) => {
                  const count = metrics.statusBreakdown[status] || 0;
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-3 h-3 rounded-full ${
                          status === 'Pending' ? 'bg-yellow-500' : 
                          status === 'Preparing' ? 'bg-orange-500' : 
                          status === 'Out for Delivery' ? 'bg-indigo-500' : 
                          status === 'Delivered' ? 'bg-emerald-500' : 
                          'bg-rose-500'
                        }`} />
                        <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono">{status}</span>
                      </div>
                      <span className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded border ${statusBadgeColor(status)}`}>
                        {count} {count === 1 ? 'order' : 'orders'}
                      </span>
                    </div>
                  );
                })}
              </div>

              <p className="text-[10px] text-gray-500 text-center font-mono mt-4">
                Seat orders shift instantly based on galley dashboard action.
              </p>
            </div>
          </div>
        </div>
      ) : activeTab === 'offline' ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
          
          {/* OFFLINE TIMELINE AGGREGATES CARDS GRID */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-slate-900 border border-white/5 rounded-xl p-4 shadow-lg text-center">
              <span className="text-gray-500 text-[10px] font-mono tracking-wider uppercase block mb-1">Today's Transactions</span>
              <h4 className="text-2xl font-bold font-mono text-gold-500">
                ₹{getOfflineGroupTotals().dailyTotal.toLocaleString()}
              </h4>
            </div>
            
            <div className="bg-slate-900 border border-white/5 rounded-xl p-4 shadow-lg text-center">
              <span className="text-gray-500 text-[10px] font-mono tracking-wider uppercase block mb-1">Weekly (7-Day)</span>
              <h4 className="text-2xl font-bold font-mono text-white">
                ₹{getOfflineGroupTotals().weeklyTotal.toLocaleString()}
              </h4>
            </div>

            <div className="bg-slate-900 border border-white/5 rounded-xl p-4 shadow-lg text-center">
              <span className="text-gray-500 text-[10px] font-mono tracking-wider uppercase block mb-1">Monthly Sales</span>
              <h4 className="text-2xl font-bold font-mono text-emerald-400">
                ₹{getOfflineGroupTotals().monthlyTotal.toLocaleString()}
              </h4>
            </div>

            <div className="bg-slate-900 border border-white/5 rounded-xl p-4 shadow-lg text-center">
              <span className="text-gray-500 text-[10px] font-mono tracking-wider uppercase block mb-1">Quarterly (3-Month)</span>
              <h4 className="text-2xl font-bold font-mono text-indigo-400">
                ₹{getOfflineGroupTotals().quarterlyTotal.toLocaleString()}
              </h4>
            </div>

            <div className="col-span-2 lg:col-span-1 bg-slate-900 border border-white/5 rounded-xl p-4 shadow-lg text-center">
              <span className="text-gray-500 text-[10px] font-mono tracking-wider uppercase block mb-1">Yearly Revenue</span>
              <h4 className="text-2xl font-bold font-mono text-purple-400">
                ₹{getOfflineGroupTotals().yearlyTotal.toLocaleString()}
              </h4>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* TRANSACTION ADDITION FORM */}
            <div className="lg:col-span-4 bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl relative self-start">
              <h4 className="text-md font-serif text-white mb-4 flex items-center gap-1.5 border-b border-white/5 pb-2 font-medium">
                <Plus className="w-4 h-4 text-gold-500" /> Register Offline Sale
              </h4>

              <form onSubmit={handleAddOfflineSale} className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-xs font-mono uppercase tracking-widest mb-1.5 font-bold">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount, e.g. 500"
                    className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold-500 transition-colors text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-xs font-mono uppercase tracking-widest mb-1.5 font-bold">Transaction Description</label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Counter lounge refreshments"
                    className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold-500 transition-colors text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-xs font-mono uppercase tracking-widest mb-1.5 font-bold">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-gold-500 transition-colors text-xs font-mono"
                    >
                      <option value="Food">Food</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Canteens">Canteens</option>
                      <option value="Counter">Counter</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 text-xs font-mono uppercase tracking-widest mb-1.5 font-bold">Payment Mode</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-gold-500 transition-colors text-xs font-mono"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card</option>
                      <option value="NetBanking">NetBanking</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-xs font-mono uppercase tracking-widest mb-1.5 font-bold">Transaction Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold-500 transition-colors text-sm font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submissionLoading}
                  className="w-full py-2.5 mt-2 bg-gold-500 text-slate-950 font-semibold uppercase tracking-widest text-xs hover:bg-gold-400 transition-colors rounded-lg cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 font-mono"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{submissionLoading ? "Registering..." : "Add Transaction"}</span>
                </button>
              </form>
            </div>

            {/* TRANSACTIONS LEDGER RECORD BOARD */}
            <div className="lg:col-span-8 bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gold-500" />
                    <h4 className="text-lg font-serif text-white font-medium">Registry Record Ledger</h4>
                  </div>
                  
                  {/* TIME PERIOD GROUP FILTER */}
                  <div className="flex flex-wrap gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
                    {(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] as const).map((period) => (
                      <button
                        key={period}
                        onClick={() => setOfflineTab(period)}
                        className={`px-3 py-1.5 rounded text-[10px] font-mono uppercase font-bold transition-all cursor-pointer ${
                          offlineTab === period
                            ? 'bg-gold-500 text-slate-950'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {period === 'daily' ? 'Day-to-day' : period}
                      </button>
                    ))}
                  </div>
                </div>

                {/* FILTERED TRANSACTIONS ITERATOR */}
                <div className="overflow-x-auto">
                  <div className="w-full overflow-x-auto"><table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-gray-500 text-[9px] font-mono uppercase tracking-widest">
                        <th className="py-3 px-2">Date</th>
                        <th className="py-3 px-2">Description</th>
                        <th className="py-3 px-2">Category</th>
                        <th className="py-3 px-2">Type</th>
                        <th className="py-3 px-2 text-right">Amount</th>
                        <th className="py-3 px-2 text-center w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs text-gray-300">
                      {paginatedSales.map((sale) => (
                        <tr key={sale._id} className="hover:bg-white/5 group transition-colors">
                          <td className="py-3 px-2 font-mono text-[10px] text-gray-400">
                            {new Date(sale.date).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="py-3 px-2 font-semibold text-white max-w-[200px] truncate">
                            {sale.description}
                          </td>
                          <td className="py-3 px-2">
                            <span className="bg-white/5 border border-white/5 px-2 py-0.5 rounded text-[10px] font-mono text-gold-500">
                              {sale.category}
                            </span>
                          </td>
                          <td className="py-3 px-2 font-mono text-[10px] text-gray-400">
                            {sale.paymentMethod}
                          </td>
                          <td className="py-3 px-2 text-right font-mono font-bold text-white">
                            ₹{sale.amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <button
                              onClick={() => setDeleteConfirmSale({ id: sale._id, description: sale.description, amount: sale.amount })}
                              className="text-gray-500 hover:text-rose-500 p-1.5 rounded hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete transaction record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}

                      {filteredSales.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-12 font-mono text-gray-500 text-[11px]">
                            {fetchingSales ? "Syncing registry..." : `No transaction logs under ${offlineTab} ledger view.`}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table></div>
                </div>

                {/* Sales Pagination controls */}
                {totalSalesPages > 1 && (
                  <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4 select-none">
                    <div className="text-gray-500 text-[10px] font-mono">
                      Showing {((currentSalesPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentSalesPage * ITEMS_PER_PAGE, filteredSales.length)} of {filteredSales.length} logs
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={currentSalesPage === 1}
                        onClick={() => setSalesPage(p => Math.max(1, p - 1))}
                        className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded border border-white/10 bg-white/5 text-gray-300 hover:text-white hover:bg-gold-500/10 hover:border-gold-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Prev
                      </button>
                      <span className="text-[10px] font-mono font-bold text-gold-500 px-1">
                        {currentSalesPage} / {totalSalesPages}
                      </span>
                      <button
                        type="button"
                        disabled={currentSalesPage === totalSalesPages}
                        onClick={() => setSalesPage(p => Math.min(totalSalesPages, p + 1))}
                        className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded border border-white/10 bg-white/5 text-gray-300 hover:text-white hover:bg-gold-500/10 hover:border-gold-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

              </div>

              <div className="border-t border-white/5 pt-4 mt-6 flex justify-between items-center text-[10px] font-mono text-gray-500">
                <span>Active Ledger Record Count: {filteredSales.length}</span>
                <span>Combined Aggregate: ₹{filteredSales.reduce((sum, s) => sum + s.amount, 0).toLocaleString()}</span>
              </div>
            </div>

          </div>
        </div>
      ) : activeTab === 'expenses' ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* OFFLINE TIMELINE AGGREGATES CARDS GRID FOR EXPENSES */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-slate-900 border border-white/5 rounded-xl p-4 shadow-lg text-center">
              <span className="text-gray-500 text-[10px] font-mono tracking-wider uppercase block mb-1">Today's Expenses</span>
              <h4 className="text-2xl font-bold font-mono text-rose-500">
                ₹{getOfflineExpenseGroupTotals().dailyTotal.toLocaleString()}
              </h4>
            </div>
            
            <div className="bg-slate-900 border border-white/5 rounded-xl p-4 shadow-lg text-center">
              <span className="text-gray-500 text-[10px] font-mono tracking-wider uppercase block mb-1">Weekly (7-Day)</span>
              <h4 className="text-2xl font-bold font-mono text-white">
                ₹{getOfflineExpenseGroupTotals().weeklyTotal.toLocaleString()}
              </h4>
            </div>

            <div className="bg-slate-900 border border-white/5 rounded-xl p-4 shadow-lg text-center">
              <span className="text-gray-500 text-[10px] font-mono tracking-wider uppercase block mb-1">Monthly Expenses</span>
              <h4 className="text-2xl font-bold font-mono text-rose-400">
                ₹{getOfflineExpenseGroupTotals().monthlyTotal.toLocaleString()}
              </h4>
            </div>

            <div className="bg-slate-900 border border-white/5 rounded-xl p-4 shadow-lg text-center">
              <span className="text-gray-500 text-[10px] font-mono tracking-wider uppercase block mb-1">Quarterly (3-Month)</span>
              <h4 className="text-2xl font-bold font-mono text-indigo-400">
                ₹{getOfflineExpenseGroupTotals().quarterlyTotal.toLocaleString()}
              </h4>
            </div>

            <div className="col-span-2 lg:col-span-1 bg-slate-900 border border-white/5 rounded-xl p-4 shadow-lg text-center">
              <span className="text-gray-500 text-[10px] font-mono tracking-wider uppercase block mb-1">Yearly Expenses</span>
              <h4 className="text-2xl font-bold font-mono text-purple-400">
                ₹{getOfflineExpenseGroupTotals().yearlyTotal.toLocaleString()}
              </h4>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* EXPENSE ADDITION FORM */}
            <div className="lg:col-span-4 bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl relative self-start">
              <h4 className="text-md font-serif text-white mb-4 flex items-center gap-1.5 border-b border-white/5 pb-2 font-medium">
                <Plus className="w-4 h-4 text-rose-500" /> Register Offline Expense
              </h4>

              <form onSubmit={handleAddOfflineExpense} className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-xs font-mono uppercase tracking-widest mb-1.5 font-bold">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="Enter amount, e.g. 1200"
                    className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold-500 transition-colors text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-xs font-mono uppercase tracking-widest mb-1.5 font-bold">Expense Description</label>
                  <input
                    type="text"
                    required
                    value={expenseDescription}
                    onChange={(e) => setExpenseDescription(e.target.value)}
                    placeholder="e.g. Canteen culinary purchase"
                    className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold-500 transition-colors text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-gray-400 text-xs font-mono uppercase tracking-widest mb-1.5 font-bold">Category</label>
                    <select
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value)}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-gold-500 transition-colors text-xs font-mono"
                    >
                      <option value="Ingredients">Ingredients</option>
                      <option value="Rent">Rent</option>
                      <option value="Salaries">Salaries</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-xs font-mono uppercase tracking-widest mb-1.5 font-bold">Expense Date</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold-500 transition-colors text-sm font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={expenseSubmissionLoading}
                  className="w-full py-2.5 mt-2 bg-rose-500 text-white font-semibold uppercase tracking-widest text-xs hover:bg-rose-600 transition-colors rounded-lg cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 font-mono"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{expenseSubmissionLoading ? "Registering..." : "Add Expense"}</span>
                </button>
              </form>
            </div>

            {/* EXPENSES LEDGER RECORD BOARD */}
            <div className="lg:col-span-8 bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-rose-500" />
                    <h4 className="text-lg font-serif text-white font-medium">Expense Records Ledger</h4>
                  </div>
                  
                  {/* TIME PERIOD GROUP FILTER */}
                  <div className="flex flex-wrap gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
                    {(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] as const).map((period) => (
                      <button
                        key={period}
                        onClick={() => setExpensesTab(period)}
                        className={`px-3 py-1.5 rounded text-[10px] font-mono uppercase font-bold transition-all cursor-pointer ${
                          expensesTab === period
                            ? 'bg-rose-500 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {period === 'daily' ? 'Day-to-day' : period}
                      </button>
                    ))}
                  </div>
                </div>

                {/* FILTERED EXPENSES ITERATOR */}
                <div className="overflow-x-auto">
                  <div className="w-full overflow-x-auto"><table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-gray-500 text-[9px] font-mono uppercase tracking-widest">
                        <th className="py-3 px-2">Date</th>
                        <th className="py-3 px-2">Description</th>
                        <th className="py-3 px-2">Category</th>
                        <th className="py-3 px-2 text-right">Amount</th>
                        <th className="py-3 px-2 text-center w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs text-gray-300">
                      {paginatedExpenses.map((expense) => (
                        <tr key={expense._id} className="hover:bg-white/5 group transition-colors">
                          <td className="py-3 px-2 font-mono text-[10px] text-gray-400">
                            {new Date(expense.date).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="py-3 px-2 font-semibold text-white max-w-[200px] truncate">
                            {expense.description}
                          </td>
                          <td className="py-3 px-2">
                            <span className="bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded text-[10px] font-mono text-rose-400">
                              {expense.category}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right font-mono font-bold text-rose-400">
                            ₹{expense.amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <button
                              onClick={() => setDeleteConfirmExpense({ id: expense._id, description: expense.description, amount: expense.amount })}
                              className="text-gray-500 hover:text-rose-500 p-1.5 rounded hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete expense record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}

                      {filteredExpenses.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-12 font-mono text-gray-500 text-[11px]">
                            {fetchingExpenses ? "Syncing registry..." : `No expense logs under ${expensesTab} ledger view.`}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table></div>
                </div>

                {/* Expenses Pagination controls */}
                {totalExpensesPages > 1 && (
                  <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4 select-none">
                    <div className="text-gray-500 text-[10px] font-mono">
                      Showing {((currentExpensesPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentExpensesPage * ITEMS_PER_PAGE, filteredExpenses.length)} of {filteredExpenses.length} logs
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={currentExpensesPage === 1}
                        onClick={() => setExpensesPage(p => Math.max(1, p - 1))}
                        className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded border border-white/10 bg-white/5 text-gray-300 hover:text-white hover:bg-rose-500/10 hover:border-rose-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Prev
                      </button>
                      <span className="text-[10px] font-mono font-bold text-rose-400 px-1">
                        {currentExpensesPage} / {totalExpensesPages}
                      </span>
                      <button
                        type="button"
                        disabled={currentExpensesPage === totalExpensesPages}
                        onClick={() => setExpensesPage(p => Math.min(totalExpensesPages, p + 1))}
                        className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded border border-white/10 bg-white/5 text-gray-300 hover:text-white hover:bg-rose-500/10 hover:border-rose-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

              </div>

              <div className="border-t border-white/5 pt-4 mt-6 flex justify-between items-center text-[10px] font-mono text-gray-500">
                <span>Active Ledger Record Count: {filteredExpenses.length}</span>
                <span>Combined Aggregate: ₹{filteredExpenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</span>
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
          
          {/* TOP CORE RECAP METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* DAILY */}
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <span className="text-gray-500 text-[10px] font-mono tracking-wider uppercase block mb-1">Today's Net Profit</span>
              <h3 className={`text-3xl font-bold font-mono ${getPnLData().daily.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {getPnLData().daily.netProfit >= 0 ? "+" : ""}
                ₹{getPnLData().daily.netProfit.toLocaleString()}
              </h3>
              
              <div className="mt-4 flex gap-4 text-[11px] font-mono text-gray-400 border-t border-white/5 pt-3">
                <div>
                  <span className="text-gray-500 font-bold text-gold-500">Revenue:</span> ₹{getPnLData().daily.totalRevenue.toLocaleString()}
                </div>
                <div>
                  <span className="text-gray-500">Expenses:</span> ₹{getPnLData().daily.totalExpenses.toLocaleString()}
                </div>
              </div>
            </div>

            {/* WEEKLY */}
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <span className="text-gray-500 text-[10px] font-mono tracking-wider uppercase block mb-1">Weekly (7-Day) Net Profit</span>
              <h3 className={`text-3xl font-bold font-mono ${getPnLData().weekly.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {getPnLData().weekly.netProfit >= 0 ? "+" : ""}
                ₹{getPnLData().weekly.netProfit.toLocaleString()}
              </h3>
              
              <div className="mt-4 flex gap-4 text-[11px] font-mono text-gray-400 border-t border-white/5 pt-3">
                <div>
                  <span className="text-gray-500 font-bold text-gold-500">Revenue:</span> ₹{getPnLData().weekly.totalRevenue.toLocaleString()}
                </div>
                <div>
                  <span className="text-gray-500">Expenses:</span> ₹{getPnLData().weekly.totalExpenses.toLocaleString()}
                </div>
              </div>
            </div>

            {/* THIS CALENDAR MONTH */}
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <span className="text-gray-500 text-[10px] font-mono tracking-wider uppercase block mb-1">Monthly (This Month) Net Profit</span>
              <h3 className={`text-3xl font-bold font-mono ${getPnLData().monthly.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {getPnLData().monthly.netProfit >= 0 ? "+" : ""}
                ₹{getPnLData().monthly.netProfit.toLocaleString()}
              </h3>
              
              <div className="mt-4 flex gap-4 text-[11px] font-mono text-gray-400 border-t border-white/5 pt-3">
                <div>
                  <span className="text-gray-500 font-bold text-gold-500">Revenue:</span> ₹{getPnLData().monthly.totalRevenue.toLocaleString()}
                </div>
                <div>
                  <span className="text-gray-500">Expenses:</span> ₹{getPnLData().monthly.totalExpenses.toLocaleString()}
                </div>
              </div>
            </div>

          </div>

          {/* DETAILED LEDGER GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* CONSOLIDATED STATEMENT FORM SHEET */}
            <div className="lg:col-span-4 bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl relative">
              <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
                <FileText className="w-5 h-5 text-gold-500" />
                <h4 className="text-md font-serif text-white font-medium">Consolidated Profit & Loss Setup</h4>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <p className="text-gray-400 leading-relaxed font-sans text-xs">
                  This statement aggregates Canteen booking transactions processed online (via client ticket payments) as well as sales and expenses logged offline.
                </p>

                <div className="border-t border-white/5 pt-3">
                  <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest block mb-1">P&L Accounting Formula:</span>
                  <div className="bg-slate-950 p-3 rounded border border-white/5 text-[11px] leading-relaxed text-gray-400">
                    <div>Gross Revenue = Online + Offline Sales</div>
                    <div className="mt-1">Net Profit = Gross Revenue - Offline Expenses</div>
                  </div>
                </div>

                <div className="bg-gold-500/5 border border-gold-500/10 p-3.5 rounded-lg text-gray-300 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Online Tickets:</span>
                    <span className="font-bold text-white">₹{getPnLData().monthly.onlineRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Offline Sales:</span>
                    <span className="font-bold text-white">₹{getPnLData().monthly.offlineRevenue.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-white/5 pt-2 flex justify-between">
                    <span className="text-gray-400 font-bold">Sales Gross:</span>
                    <span className="font-bold text-gold-500">₹{getPnLData().monthly.totalRevenue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* YEAR-BY-YEAR DETAILED LEDGER SHEET */}
            <div className="lg:col-span-8 bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl">
              <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-lg font-serif text-white font-medium">Year-by-Year Profit Analysis</h4>
                </div>
                <span className="text-[10px] font-mono text-gray-500 uppercase">Annual Financial Audits</span>
              </div>

              <div className="overflow-x-auto">
                <div className="w-full overflow-x-auto"><table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-500 text-[9px] font-mono uppercase tracking-widest">
                      <th className="py-3 px-2">Calendar Year</th>
                      <th className="py-3 px-2 text-right">Online Booking Revenue</th>
                      <th className="py-3 px-2 text-right">Offline Sales Cashflow</th>
                      <th className="py-3 px-2 text-right">Registered Expenses</th>
                      <th className="py-3 px-2 text-right">Net Profit / Loss</th>
                      <th className="py-3 px-2 text-right">Profit Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-gray-300">
                    {paginatedPnlBreakdown.map((row) => {
                      const profitRate = row.totalRevenue > 0 
                        ? ((row.netProfit / row.totalRevenue) * 100).toFixed(1)
                        : "0.0";
                      
                      return (
                        <tr key={row.year} className="hover:bg-white/5 transition-colors">
                          <td className="py-4 px-2 font-mono font-bold text-lg text-white">
                            {row.year}
                          </td>
                          <td className="py-4 px-2 text-right font-mono text-gray-400">
                            ₹{row.onlineRevenue.toLocaleString()}
                          </td>
                          <td className="py-4 px-2 text-right font-mono text-gray-400">
                            ₹{row.offlineRevenue.toLocaleString()}
                          </td>
                          <td className="py-4 px-2 text-right font-mono text-rose-400">
                            ₹{row.totalExpenses.toLocaleString()}
                          </td>
                          <td className={`py-4 px-2 text-right font-mono font-bold text-sm ${row.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {row.netProfit >= 0 ? "+" : ""}₹{row.netProfit.toLocaleString()}
                          </td>
                          <td className="py-4 px-2 text-right">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${row.netProfit >= 0 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
                              {profitRate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}

                    {pnlBreakdown.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-12 font-mono text-gray-500 text-[11px]">
                          No annual accounting logs found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table></div>
              </div>

              {/* PnL Statement Pagination controls */}
              {totalPnlPages > 1 && (
                <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4 select-none">
                  <div className="text-gray-500 text-[10px] font-mono">
                    Showing {((currentPnlPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPnlPage * ITEMS_PER_PAGE, pnlBreakdown.length)} of {pnlBreakdown.length} statements
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPnlPage === 1}
                      onClick={() => setPnlPage(p => Math.max(1, p - 1))}
                      className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded border border-white/10 bg-white/5 text-gray-300 hover:text-white hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Prev
                    </button>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 px-1">
                      {currentPnlPage} / {totalPnlPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPnlPage === totalPnlPages}
                      onClick={() => setPnlPage(p => Math.min(totalPnlPages, p + 1))}
                      className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded border border-white/10 bg-white/5 text-gray-300 hover:text-white hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              <div className="border-t border-white/5 pt-4 mt-6 flex justify-between items-center text-[10px] font-mono text-gray-500">
                <span>Fiscal Years Tracked: {pnlBreakdown.length}</span>
                <span>Active Ledger Mode: Live Consolidated Auditing</span>
              </div>
            </div>

          </div>
        </div>
      )}
      {/* Dynamic Offline Sales Ledger Deletion Modal */}
      {deleteConfirmSale !== null && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-500 border-b border-white/5 pb-3">
              <AlertTriangle className="w-6 h-6 shrink-0 text-rose-500" />
              <h4 className="text-lg font-semibold text-white">Delete Offline Transaction</h4>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              Are you sure you want to permanently delete the offline sale transaction <strong className="text-white">"{deleteConfirmSale.description}"</strong>? This will remove the ₹{deleteConfirmSale.amount.toLocaleString()} revenue entry from your consolidated accounting logs.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2 font-mono">
              <button
                type="button"
                onClick={() => setDeleteConfirmSale(null)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold px-4 py-2 rounded text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const item = deleteConfirmSale;
                  setDeleteConfirmSale(null);
                  handleDeleteOfflineSale(item.id);
                }}
                className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-red-500/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Offline Expenses Deletion Modal */}
      {deleteConfirmExpense !== null && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-500 border-b border-white/5 pb-3">
              <AlertTriangle className="w-6 h-6 shrink-0 text-rose-500" />
              <h4 className="text-lg font-semibold text-white">Delete Expense Record</h4>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              Are you sure you want to permanently delete the offline expense log <strong className="text-white">"{deleteConfirmExpense.description}"</strong>? This will remove the ₹{deleteConfirmExpense.amount.toLocaleString()} deduction from your consolidated P&L statements.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2 font-mono">
              <button
                type="button"
                onClick={() => setDeleteConfirmExpense(null)}
                className="bg-white/5 hover:bg-white/5 border border-white/10 text-gray-300 font-bold px-4 py-2 rounded text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const item = deleteConfirmExpense;
                  setDeleteConfirmExpense(null);
                  handleDeleteOfflineExpense(item.id);
                }}
                className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-red-500/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
