import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingBag, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  Filter, 
  Calendar, 
  ChevronRight, 
  Users,
  RefreshCw,
  Coins
} from 'lucide-react';
import toast from 'react-hot-toast';

export function AdminSales() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'today' | 'monthly' | 'quarterly' | 'yearly'>('monthly');

  const fetchOrders = () => {
    setLoading(true);
    fetch('/api/admin/orders', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/';
        }
        return res.json();
      })
      .then(data => {
        if (!data.error) {
          setOrders(data);
        } else if (data.error !== 'Invalid token') {
          toast.error(data.error);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
        toast.error('Failed to load transaction data.');
      });
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  // Helper Custom Converter for Indian Standard Time (IST)
  const formatIST = (dateStr: string, includeDate = true) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: includeDate ? 'medium' : undefined,
        timeStyle: 'short'
      }).format(date);
    } catch (e) {
      return dateStr;
    }
  };

  // Helper to extract product string from items array
  const getItemsSummary = (items: any[]) => {
    if (!items || items.length === 0) return "No items";
    return items.map(it => `${it.name} x${it.quantity}`).join(', ');
  };

  // Dynamic processings based on timeframe
  const dynamicData = React.useMemo(() => {
    const now = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;

    let filteredOrders: any[] = [];
    let previousOrders: any[] = [];
    let chartData: { label: string; value: number; orders: number }[] = [];

    if (timeframe === 'today') {
      // 1. Current 24 hours vs previous 24 hours
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const yesterdayStart = todayStart - oneDayMs;

      filteredOrders = orders.filter(o => new Date(o.createdAt).getTime() >= todayStart);
      previousOrders = orders.filter(o => {
        const t = new Date(o.createdAt).getTime();
        return t >= yesterdayStart && t < todayStart;
      });

      // Group hourly: 00:00 to 04:00, 04:00 to 08:00, etc.
      const hours = ["08:00", "12:00", "16:00", "20:00", "24:00"];
      chartData = hours.map((h, index) => {
        const endHour = (index + 2) * 4; // e.g., 8, 12, 16, 20, 24
        const startHour = endHour - 4;
        const binOrders = filteredOrders.filter(o => {
          const hr = new Date(o.createdAt).getHours();
          return hr >= startHour && hr < endHour;
        });
        const revenue = binOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        return { label: `${startHour}:00 - ${endHour}:00`, value: revenue, orders: binOrders.length };
      });

    } else if (timeframe === 'monthly') {
      // 2. Current 30 days vs previous 30 days
      const thirtyDaysAgo = now.getTime() - (30 * oneDayMs);
      const sixtyDaysAgo = now.getTime() - (60 * oneDayMs);

      filteredOrders = orders.filter(o => new Date(o.createdAt).getTime() >= thirtyDaysAgo);
      previousOrders = orders.filter(o => {
        const t = new Date(o.createdAt).getTime();
        return t >= sixtyDaysAgo && t < thirtyDaysAgo;
      });

      // Group weekly
      chartData = Array.from({ length: 4 }).map((_, i) => {
        const endDay = (i + 1) * 7.5;
        const startDay = i * 7.5;
        const binOrders = filteredOrders.filter(o => {
          const diffDays = (now.getTime() - new Date(o.createdAt).getTime()) / oneDayMs;
          return diffDays >= startDay && diffDays < endDay;
        });
        const revenue = binOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        return { label: `Week ${4 - i}`, value: revenue, orders: binOrders.length };
      }).reverse(); // Order from earliest to latest week

    } else if (timeframe === 'quarterly') {
      // 3. Current 90 days vs previous 90 days
      const ninetyDaysAgo = now.getTime() - (90 * oneDayMs);
      const oneEightyDaysAgo = now.getTime() - (180 * oneDayMs);

      filteredOrders = orders.filter(o => new Date(o.createdAt).getTime() >= ninetyDaysAgo);
      previousOrders = orders.filter(o => {
        const t = new Date(o.createdAt).getTime();
        return t >= oneEightyDaysAgo && t < ninetyDaysAgo;
      });

      // Group monthly (3 months)
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthsInQuarterSet = new Set<string>();
      for (let i = 2; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        monthsInQuarterSet.add(monthNames[d.getMonth()]);
      }

      chartData = Array.from(monthsInQuarterSet).map(mName => {
        const binOrders = filteredOrders.filter(o => {
          const dateMonth = monthNames[new Date(o.createdAt).getMonth()];
          return dateMonth === mName;
        });
        const revenue = binOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        return { label: mName, value: revenue, orders: binOrders.length };
      });

    } else {
      // 4. Yearly (last 365 days) vs previous 365 days
      const threeSixtyFiveDaysAgo = now.getTime() - (365 * oneDayMs);
      const sevenThirtyDaysAgo = now.getTime() - (730 * oneDayMs);

      filteredOrders = orders.filter(o => new Date(o.createdAt).getTime() >= threeSixtyFiveDaysAgo);
      previousOrders = orders.filter(o => {
        const t = new Date(o.createdAt).getTime();
        return t >= sevenThirtyDaysAgo && t < threeSixtyFiveDaysAgo;
      });

      // Group quarterly (Q1 to Q4 or last 4 quarters)
      chartData = Array.from({ length: 4 }).map((_, i) => {
        const quarterNum = 4 - i;
        const binOrders = filteredOrders.filter(o => {
          const orderMonth = new Date(o.createdAt).getMonth();
          const qGroup = Math.floor(orderMonth / 3) + 1; // 1, 2, 3, 4
          return qGroup === quarterNum;
        });
        const revenue = binOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        return { label: `Q${quarterNum}`, value: revenue, orders: binOrders.length };
      }).reverse();
    }

    // Sort transactions from newest to oldest
    const transactions = filteredOrders.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Sum totals safely
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalTransactions = filteredOrders.length;
    const avgOrderValue = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;

    // Calculate growth safely
    const prevRevenue = previousOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const isUp = revenueGrowth >= 0;

    return {
      revenue: `₹${totalRevenue.toLocaleString()}`,
      ordersCount: `${totalTransactions} Transactions`,
      avgOrderValue: `₹${avgOrderValue.toLocaleString()}`,
      growthText: prevRevenue > 0 
        ? `${isUp ? '+' : ''}${revenueGrowth.toFixed(1)}% vs previous timeframe` 
        : `Baseline created (${totalTransactions} tickets check)`,
      trend: isUp ? "up" : "down",
      chartData,
      transactions
    };

  }, [orders, timeframe]);

  const maxVal = Math.max(...dynamicData.chartData.map(d => d.value), 2000);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400 space-y-4">
        <RefreshCw className="w-12 h-12 stroke-[1.5] text-gold-500 animate-spin" />
        <p className="font-mono text-sm tracking-widest uppercase">Fetching Dynamic Transaction Logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <span className="text-gold-500 text-xs font-mono tracking-widest uppercase mb-1 block">Revenue Auditing</span>
          <h3 className="text-3xl font-serif text-white">Sales & Flows</h3>
          <p className="text-gray-400 text-sm mt-1">Audit live transaction sheets, dynamic margins, and toggle real-time revenue charts.</p>
        </div>
        
        {/* Toggle Toggles */}
        <div className="flex flex-wrap bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
          {(['today', 'monthly', 'quarterly', 'yearly'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                timeframe === tf 
                  ? 'bg-gold-500 text-slate-950 shadow-md font-bold' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-white/5 rounded-xl p-5 space-y-1.5">
          <span className="text-xs font-mono text-gray-500 uppercase tracking-wider block">Gourmet Sales Revenue</span>
          <h4 className="text-3xl font-bold text-white tracking-tight font-mono">{dynamicData.revenue}</h4>
          <span className={`text-xs inline-flex items-center gap-1 ${dynamicData.trend === 'up' ? 'text-emerald-400' : 'text-rose-400'} font-mono mt-1`}>
            {dynamicData.trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {dynamicData.growthText}
          </span>
        </div>

        <div className="bg-slate-900 border border-white/5 rounded-xl p-5 space-y-1.5">
          <span className="text-xs font-mono text-gray-500 uppercase tracking-wider block">Transaction volume</span>
          <h4 className="text-3xl font-bold text-white tracking-tight font-mono">{dynamicData.ordersCount}</h4>
          <span className="text-xs text-gray-450 font-mono mt-1 block">Successfully processed checkouts</span>
        </div>

        <div className="bg-slate-900 border border-white/5 rounded-xl p-5 space-y-1.5">
          <span className="text-xs font-mono text-gray-500 uppercase tracking-wider block">Average Ticket pricing</span>
          <h4 className="text-3xl font-bold text-white tracking-tight font-mono">{dynamicData.avgOrderValue}</h4>
          <span className="text-xs text-gold-500 bg-gold-400/10 px-2 py-0.5 rounded font-mono mt-1 inline-block">Maximizing Ticket Profit</span>
        </div>
      </div>

      {/* Interactive Revenue Flowchart */}
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <div>
            <h4 className="text-lg font-serif text-white uppercase tracking-wider">Revenue Flowchart</h4>
            <p className="text-xs text-gray-400 mt-0.5">Continuous analytical visualization during {timeframe.toUpperCase()} session.</p>
          </div>
          <span className="text-xs text-gold-550 font-mono flex items-center gap-1">
            <Coins className="w-4 h-4 text-gold-500" /> INR (₹) Revenue Scale
          </span>
        </div>

        {/* Customized Pure CSS/SVG Bar Chart structure */}
        <div className="h-64 flex items-end justify-between gap-3 md:gap-8 pt-8 px-2 border-b border-white/10 relative">
          
          {/* Horizontal Grid lines */}
          <div className="absolute left-0 right-0 top-1/4 border-t border-white/3 text-[9px] font-mono text-gray-600 pt-0.5">₹{Math.round(maxVal * 0.75).toLocaleString()}</div>
          <div className="absolute left-0 right-0 top-2/4 border-t border-white/3 text-[9px] font-mono text-gray-600 pt-0.5">₹{Math.round(maxVal * 0.5).toLocaleString()}</div>
          <div className="absolute left-0 right-0 top-3/4 border-t border-white/3 text-[9px] font-mono text-gray-600 pt-0.5">₹{Math.round(maxVal * 0.25).toLocaleString()}</div>

          {dynamicData.chartData.map((bar, i) => {
            const hPct = maxVal > 0 ? (bar.value / maxVal) * 85 : 10;
            return (
              <div key={i} className="flex-1 flex flex-col items-center group relative z-10">
                
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 bg-slate-950 border border-gold-500/30 px-2.5 py-1.5 rounded-xl text-[10px] text-white font-mono opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center shadow-xl z-20 whitespace-nowrap">
                  <p className="font-bold text-gold-500">₹{bar.value.toLocaleString()}</p>
                  <p className="text-gray-400">{bar.orders} orders</p>
                </div>

                {/* The Bar */}
                <div 
                  className="w-full max-w-[48px] bg-gradient-to-t from-gold-600 to-amber-400 rounded-t-lg transition-all duration-500 hover:brightness-110 active:brightness-90 hover:shadow-[0_0_15px_rgba(234,179,8,0.25)] flex items-end justify-center pb-2 text-[9px] font-mono font-bold text-slate-950"
                  style={{ height: `${hPct}%`, minHeight: '14px' }}
                >
                  <span className="hidden md:inline">₹{(bar.value > 1000 ? (bar.value / 1000) === Math.round(bar.value/1000) ? (bar.value/1000) : (bar.value / 1000).toFixed(1) : bar.value)}k</span>
                </div>

                {/* X-Axis label */}
                <span className="text-xs font-mono text-gray-500 mt-3 truncate max-w-full text-center">{bar.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction Records Sheet */}
      <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
          <h4 className="text-sm uppercase tracking-wide text-white font-bold font-mono">Recent transaction logs ({timeframe})</h4>
          <span className="text-xs text-gray-450 font-mono">{dynamicData.transactions.length} entries listed</span>
        </div>
        <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
          {dynamicData.transactions.map((txn, index) => (
            <div key={txn._id || index} className="px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-white/5 transition-colors gap-2">
			  <div>
				<div className="flex items-center gap-2">
				  <span className="text-xs bg-white/10 font-bold font-mono text-gray-300 px-2 py-0.5 rounded border border-white/5">
					#{txn._id.slice(-8).toUpperCase()}
				  </span>
				  <p className="text-white font-semibold text-sm">{txn.customerName}</p>
				</div>
				<p className="text-xs text-gray-400 mt-1.5 font-mono">{getItemsSummary(txn.items)}</p>
				{txn.address && (
				  <p className="text-[11px] text-gray-500 mt-1 max-w-md truncate">📍 {txn.address}</p>
				)}
			  </div>
			  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end shrink-0">
				<span className="text-xs text-gray-400 font-mono leading-none">{formatIST(txn.createdAt)}</span>
				<div className="text-right">
				  <p className="text-gold-500 font-bold text-sm font-mono">₹{txn.totalAmount.toLocaleString()}</p>
				  <span className={`text-[10px] tracking-widest font-bold uppercase rounded font-mono ${txn.status === 'Delivered' ? 'text-emerald-400' : txn.status === 'Cancelled' ? 'text-rose-400' : 'text-amber-400'}`}>
					{txn.status}
				  </span>
				</div>
			  </div>
            </div>
          ))}
          {dynamicData.transactions.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-sm font-mono">No transaction tickets stored under this timeframe.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
