import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { 
  Trash2, 
  MapPin, 
  ShoppingBag, 
  Clock, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Filter, 
  Calendar,
  DollarSign,
  User,
  Activity
} from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  studentName?: string;
  studentClass?: string;
  section?: string;
  rollNo?: string;
}

interface Order {
  _id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  address: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
  paymentStatus?: string;
  paymentMethod?: string;
  stripePaymentIntentId?: string;
  userId?: string;
}

export function AdminOrders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [dayFilter, setDayFilter] = useState('all');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Map state
  const [selectedMapAddress, setSelectedMapAddress] = useState<string | null>(null);

  // State-based deletion confirmation modal
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<Order | null>(null);

  // Sort direction for "Order Valuation"
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  // Number of orders to download in excel
  const [exportCount, setExportCount] = useState<number>(0);

  // Role tab filtering (all, parent, teacher)
  const [roleTab, setRoleTab] = useState<'all' | 'parent' | 'teacher'>('all');


  const isOrderTeacher = (order: Order) => {
    return !!(order.items && order.items.some(it => 
      it.studentClass === "Teacher" || 
      it.section === "Faculty" || 
      it.studentClass === "Staff" || 
      (it.studentClass || "").toLowerCase().includes("teacher") ||
      (it.studentClass || "").toLowerCase().includes("staff")
    ));
  };

  const fetchOrders = () => {
    fetch(`/api/admin/orders?t=${Date.now()}`, {
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
        toast.error('Failed to load orders from server.');
      });
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.success(`Order status updated to ${status}`);
        fetchOrders(); // Refresh list
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Failed to update status');
      }
    } catch(e) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (order: Order) => {
    setDeleteConfirmOrder(order);
  };

  const confirmDeleteAction = async () => {
    if (!deleteConfirmOrder) return;
    const orderId = deleteConfirmOrder._id;
    setDeleteConfirmOrder(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        toast.success("Order deleted successfully!");
        fetchOrders();
        // Adjust page down if necessary
        const remainingFetchedOrders = orders.filter(o => o._id !== orderId);
        const maxPages = Math.ceil(remainingFetchedOrders.length / itemsPerPage);
        if (currentPage > maxPages && maxPages > 0) {
          setCurrentPage(maxPages);
        }
      } else {
        const errData = await res.json();
        toast.error(errData.error || "Failed to delete order record.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while deleting the order.");
    }
  };

  // Helper custom converter for Indian Standard Time (IST) timezone
  const formatIST = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'medium'
      }).format(date) + ' (IST)';
    } catch (e) {
      return dateStr;
    }
  };

  // Filter logic
  const filteredOrders = orders.filter(order => {
    // Role filter
    if (roleTab === 'parent' && isOrderTeacher(order)) return false;
    if (roleTab === 'teacher' && !isOrderTeacher(order)) return false;

    const term = searchTerm.toLowerCase();
    
    // Deep search within student meal preferences/items
    const hasStudentMatch = order.items && order.items.some(item => 
      (item.studentName && item.studentName.toLowerCase().includes(term)) ||
      (item.studentClass && item.studentClass.toLowerCase().includes(term)) ||
      (item.section && item.section.toLowerCase().includes(term))
    );

    const matchesSearch = 
      order.customerName.toLowerCase().includes(term) ||
      order.customerEmail.toLowerCase().includes(term) ||
      (order.customerPhone && order.customerPhone.toLowerCase().includes(term)) ||
      (order.address && order.address.toLowerCase().includes(term)) ||
      order._id.toLowerCase().includes(term) ||
      hasStudentMatch;

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    // Specific Date filter matching (in Indian Standard Time)
    let matchesDate = true;
    if (dateFilter) {
      try {
        const istDateStr = new Date(order.createdAt).toLocaleDateString('sv-SE', {
          timeZone: 'Asia/Kolkata'
        }); // 'sv-SE' returns 'YYYY-MM-DD' cleanly
        matchesDate = istDateStr === dateFilter;
      } catch (e) {
        const fallbackDateStr = new Date(order.createdAt).toISOString().split('T')[0];
        matchesDate = fallbackDateStr === dateFilter;
      }
    }

    // Specific Day of Week matching (in Indian Standard Time)
    let matchesDay = true;
    if (dayFilter !== 'all') {
      try {
        const orderDayName = new Date(order.createdAt).toLocaleDateString('en-US', {
          timeZone: 'Asia/Kolkata',
          weekday: 'long'
        }); // e.g. 'Monday', 'Tuesday'
        matchesDay = orderDayName === dayFilter;
      } catch (e) {
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const orderDayIndex = new Date(order.createdAt).getDay();
        const orderDayName = daysOfWeek[orderDayIndex];
        matchesDay = orderDayName === dayFilter;
      }
    }

    return matchesSearch && matchesStatus && matchesDate && matchesDay;
  });

  // Sort logic for ordering by Valuation column
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortDirection === 'asc') {
      return a.totalAmount - b.totalAmount;
    } else if (sortDirection === 'desc') {
      return b.totalAmount - a.totalAmount;
    }
    return 0; // Default: chronological sort
  });

  // Pagination calculation
  const totalItems = sortedOrders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = sortedOrders.slice(startIndex, startIndex + itemsPerPage);

  // Navigate pages
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, roleTab, dateFilter, dayFilter]);

  const exportOrdersToExcel = async () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Helper to format order date nicely to avoid ###
    const formatOrderDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    };

    // Filter relevant orders set based on exportCount and UI filters
    let baseOrders = [...sortedOrders];
    if (exportCount > 0) {
      baseOrders = baseOrders.slice(0, exportCount);
    }

    if (baseOrders.length === 0) {
      toast.error(exportCount > 0 ? "No orders found in registries." : "No orders found for the selected filters.");
      return;
    }

    const toastId = toast.loading('Structuring Excel workbook and resolving rosters...');
    let teachersList: any[] = [];
    try {
      const res = await fetch('/api/admin/teachers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        teachersList = await res.json();
      }
    } catch (err) {
      console.error("Failed to load teachers for export details mapping", err);
    }

    // Try to find a reference teacher if possible or fallback to N/A
    const fallbackTeacher = teachersList.length > 0 ? teachersList[0] : null;

    const parentRows: any[] = [];
    const teacherRows: any[] = [];

    // Filter orders
    const parentOrders = baseOrders.filter(o => !isOrderTeacher(o));
    const teacherOrders = baseOrders.filter(o => isOrderTeacher(o));

    // Compile parent-student rows (Parents Sheet / Students Sheet)
    parentOrders.forEach(o => {
      const orderDate = formatOrderDate(o.createdAt);
      const parentPhone = o.customerPhone || "N/A";
      const parentsName = o.customerName || "N/A";
      const parentEmail = o.customerEmail || "N/A";
      
      if (o.items && o.items.length > 0) {
        o.items.forEach(item => {
          const isTeacher = item.studentClass === "Teacher" || item.section === "Faculty" || item.studentClass === "Staff";
          if (isTeacher) return;

          const studentName = item.studentName || "N/A";
          const studentClass = item.studentClass || 'N/A';
          const studentSection = item.section || 'N/A';

          const teacherId = fallbackTeacher ? fallbackTeacher._id : "N/A";
          const teacherPhone = fallbackTeacher ? (fallbackTeacher.mobile || "N/A") : "N/A";

          parentRows.push({
            "Order ID": o._id,
            "Date": orderDate,
            "Student Name": studentName,
            "Class / Grade": studentClass,
            "Section": studentSection,
            "Parent Name": parentsName,
            "Parent Phone": parentPhone,
            "Parent Email": parentEmail,
            "Meal Ordered": item.name || "N/A",
            "Quantity": item.quantity || 1,
            "Price per Unit (₹)": item.price || 0,
            "Item Subtotal (₹)": (item.price || 0) * (item.quantity || 1),
            "Order Total Amount (₹)": o.totalAmount || 0,
            "Order Status": o.status || "Pending",
            "Payment Status": o.paymentStatus || "Paid",
            "Payment Method": o.paymentMethod || "Online Stripe"
          });
        });
      } else {
        parentRows.push({
          "Order ID": o._id,
          "Date": orderDate,
          "Student Name": "N/A",
          "Class / Grade": "N/A",
          "Section": "N/A",
          "Parent Name": parentsName,
          "Parent Phone": parentPhone,
          "Parent Email": parentEmail,
          "Meal Ordered": "N/A",
          "Quantity": 0,
          "Price per Unit (₹)": 0,
          "Item Subtotal (₹)": 0,
          "Order Total Amount (₹)": o.totalAmount || 0,
          "Order Status": o.status || "Pending",
          "Payment Status": o.paymentStatus || "Paid",
          "Payment Method": o.paymentMethod || "Online Stripe"
        });
      }
    });

    // Compile teacher rows (Teachers Sheet)
    teacherOrders.forEach(o => {
      const orderDate = formatOrderDate(o.createdAt);
      const email = o.customerEmail || "N/A";
      const phone = o.customerPhone || "N/A";
      const teacherId = o.userId || "N/A";

      if (o.items && o.items.length > 0) {
        o.items.forEach(item => {
          const isTeacher = item.studentClass === "Teacher" || item.section === "Faculty" || item.studentClass === "Staff";
          if (!isTeacher) return;

          const name = item.studentName || o.customerName || "N/A";

          teacherRows.push({
            "Order ID": o._id,
            "Date": orderDate,
            "Teacher ID": teacherId,
            "Teacher Name": name,
            "Teacher Email": email,
            "Teacher Phone": phone,
            "Meal Ordered": item.name || "N/A",
            "Quantity": item.quantity || 1,
            "Price per Unit (₹)": item.price || 0,
            "Item Subtotal (₹)": (item.price || 0) * (item.quantity || 1),
            "Order Total Amount (₹)": o.totalAmount || 0,
            "Order Status": o.status || "Pending",
            "Payment Status": o.paymentStatus || "Paid",
            "Payment Method": o.paymentMethod || "Online Stripe"
          });
        });
      } else {
        teacherRows.push({
          "Order ID": o._id,
          "Date": orderDate,
          "Teacher ID": teacherId,
          "Teacher Name": o.customerName || "N/A",
          "Teacher Email": email,
          "Teacher Phone": phone,
          "Meal Ordered": "N/A",
          "Quantity": 0,
          "Price per Unit (₹)": 0,
          "Item Subtotal (₹)": 0,
          "Order Total Amount (₹)": o.totalAmount || 0,
          "Order Status": o.status || "Pending",
          "Payment Status": o.paymentStatus || "Paid",
          "Payment Method": o.paymentMethod || "Online Stripe"
        });
      }
    });

    try {
      const wb = XLSX.utils.book_new();
      
      if (roleTab === 'parent') {
        const wsStudents = XLSX.utils.json_to_sheet(parentRows);
        XLSX.utils.book_append_sheet(wb, wsStudents, "Students");
        XLSX.writeFile(wb, `canteen_student_orders_${todayStr}.xlsx`);
        toast.success(`Exported ${parentRows.length} student-parent orders successfully!`, { id: toastId });
      } else if (roleTab === 'teacher') {
        const wsTeachers = XLSX.utils.json_to_sheet(teacherRows);
        XLSX.utils.book_append_sheet(wb, wsTeachers, "Teachers");
        XLSX.writeFile(wb, `canteen_teacher_orders_${todayStr}.xlsx`);
        toast.success(`Exported ${teacherRows.length} teacher faculty orders successfully!`, { id: toastId });
      } else {
        const wsStudents = XLSX.utils.json_to_sheet(parentRows);
        XLSX.utils.book_append_sheet(wb, wsStudents, "Students");
        
        const wsTeachers = XLSX.utils.json_to_sheet(teacherRows);
        XLSX.utils.book_append_sheet(wb, wsTeachers, "Teachers");
        
        XLSX.writeFile(wb, `canteen_all_orders_${todayStr}.xlsx`);
        toast.success(`Excel workbook with separate Students and Teachers sheets downloaded!`, { id: toastId });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to export spreadsheet: ${err.message}`, { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400 space-y-4">
        <Activity className="w-12 h-12 stroke-[1.5] text-gold-500 animate-pulse" />
        <p className="text-sm font-mono tracking-wide">Reading order registries...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <span className="text-gold-500 text-xs font-mono tracking-widest uppercase mb-1 block">Cabin Steward Desk</span>
          <h3 className="text-3xl font-serif text-white">Manage Orders</h3>
          <p className="text-gray-400 text-sm mt-1">Audit customer deliveries, update preparing cycles, and manage dining logs.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs">
            <span className="text-gray-400 font-mono text-[9px] uppercase tracking-wider">Export Limit:</span>
            <input
              type="number"
              min="0"
              placeholder="All Today"
              value={exportCount || ''}
              onChange={(e) => setExportCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-20 bg-slate-950 border border-white/10 rounded px-2 py-1 text-center font-bold text-emerald-400 outline-none focus:border-emerald-500 text-xs"
              title="Leave empty or set to 0 to download all orders for today. Enter a positive number to download exactly that many recent orders."
            />
            <span className="text-[10px] text-gray-500 font-bold uppercase font-mono">orders</span>
          </div>

          <button
            onClick={exportOrdersToExcel}
            className="bg-emerald-500/25 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 rounded-xl px-4 py-3 flex items-center gap-2 transition-all text-xs font-bold uppercase tracking-widest cursor-pointer select-none"
            title="Download Excel Spreadsheet with Student name, Items, Class Section & descriptions"
          >
            📊 Export to Excel
          </button>


          <div className="bg-gold-500/10 border border-gold-500/20 rounded-xl px-4 py-2 flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-gold-500" />
            <div>
              <span className="block text-[10px] font-mono text-gray-500 uppercase">Total Tickets</span>
              <span className="text-sm font-bold text-white font-mono">{orders.length} order sheets</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Role Selector Tabs */}
      <div className="flex flex-col sm:flex-row w-full sm:w-max gap-2 p-1.5 bg-slate-950/60 border border-white/10 rounded-2xl">
        <button
          onClick={() => setRoleTab('all')}
          className={`flex-1 sm:flex-initial px-4 py-2 font-mono text-[10px] uppercase tracking-wider font-bold rounded-xl transition-all cursor-pointer ${
            roleTab === 'all' 
              ? 'bg-gradient-to-r from-gold-500 to-amber-400 text-slate-950 shadow-md' 
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          🌐 All Orders ({orders.length})
        </button>
        <button
          onClick={() => setRoleTab('parent')}
          className={`flex-1 sm:flex-initial px-4 py-2 font-mono text-[10px] uppercase tracking-wider font-bold rounded-xl transition-all cursor-pointer ${
            roleTab === 'parent' 
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md' 
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          🧑‍🎓 Student Parents ({orders.filter(o => !isOrderTeacher(o)).length})
        </button>
        <button
          onClick={() => setRoleTab('teacher')}
          className={`flex-1 sm:flex-initial px-4 py-2 font-mono text-[10px] uppercase tracking-wider font-bold rounded-xl transition-all cursor-pointer ${
            roleTab === 'teacher' 
              ? 'bg-gradient-to-r from-sky-400 to-indigo-500 text-slate-950 shadow-md' 
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          🍎 Teacher Faculty ({orders.filter(o => isOrderTeacher(o)).length})
        </button>
      </div>

      {/* Control Box: Search and Status Filters */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/10 space-y-4 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Field */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by ID, customer name, email, or student destination details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:border-gold-500 outline-none transition-all placeholder-gray-500"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl pl-11 pr-10 py-3 text-sm text-white focus:border-gold-500 outline-none appearance-none cursor-pointer transition-all font-medium"
            >
              <option value="all">All Order Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Preparing">Preparing</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
              ▼
            </div>
          </div>
        </div>

        {/* Date and Day filters row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-white/5 items-center">
          {/* Date Picker Filter */}
          <div className="relative flex items-center">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl pl-11 pr-10 py-2.5 text-sm text-white focus:border-gold-500 outline-none cursor-pointer transition-all font-mono scheme-dark"
              title="Filter by Order Creation Date"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-sm font-bold bg-slate-900 border border-white/10 w-5 h-5 rounded-full flex items-center justify-center transition-all"
                title="Clear date filter"
              >
                ✕
              </button>
            )}
          </div>

          {/* Day of the Week Dropdown */}
          <div className="relative">
            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl pl-11 pr-10 py-2.5 text-sm text-white focus:border-gold-500 outline-none appearance-none cursor-pointer transition-all font-medium"
            >
              <option value="all">All Days (Monday - Sunday)</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
              ▼
            </div>
          </div>

          {/* Reset Filters CTA */}
          <div className="flex items-center justify-end sm:col-span-2 md:col-span-1">
            {(searchTerm || statusFilter !== 'all' || dateFilter || dayFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setDateFilter('');
                  setDayFilter('all');
                }}
                className="text-xs text-gold-500 hover:text-gold-300 transition-colors font-mono uppercase tracking-wider font-bold bg-gold-500/10 border border-gold-500/20 px-3.5 py-2 rounded-lg"
              >
                Reset All Filters ({[
                  searchTerm ? 1 : 0,
                  statusFilter !== 'all' ? 1 : 0,
                  dateFilter ? 1 : 0,
                  dayFilter !== 'all' ? 1 : 0
                ].reduce((a, b) => a + b, 0)})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Data Table Container - Flex layout parent */}
      <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Desktop View Table */}
        <div className="hidden md:block overflow-x-auto">
          <div className="w-full overflow-x-auto"><table className="w-full text-left text-sm text-gray-200">
            <thead className="bg-white/5 text-xs uppercase border-b border-white/10 text-white font-mono tracking-wider">
              {roleTab === 'teacher' ? (
                <tr>
                  <th className="px-6 py-4">Reference ID</th>
                  <th className="px-6 py-4">Meal Plan Preference</th>
                  <th className="px-6 py-4">Teacher Name</th>
                  <th className="px-6 py-4">Teacher Email</th>
                  <th className="px-6 py-4 font-bold text-gold-500">Teacher Phone & Timestamp</th>
                  <th className="px-6 py-4">Teacher ID</th>
                  <th className="px-6 py-4 text-center">Operational Progress</th>
                  <th className="px-5 py-4 text-center">Actions</th>
                </tr>
              ) : roleTab === 'parent' ? (
                <tr>
                  <th className="px-6 py-4">Reference ID</th>
                  <th className="px-6 py-4">Meal Plan Preference</th>
                  <th className="px-6 py-4 text-emerald-400">Name of Student</th>
                  <th className="px-6 py-4">Class</th>
                  <th className="px-6 py-4">Section</th>
                  <th className="px-6 py-4">Parents Name</th>
                  <th className="px-6 py-4">Parents Contact & Timestamp</th>
                  <th className="px-6 py-4 text-center">Operational Progress</th>
                  <th className="px-5 py-4 text-center">Actions</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-6 py-4">Reference ID</th>
                  <th className="px-6 py-4">Meal Plan Preference</th>
                  <th className="px-6 py-4 text-emerald-450">Name of Student</th>
                  <th className="px-6 py-4 text-sky-450">Teacher</th>
                  <th className="px-6 py-4">Class</th>
                  <th className="px-6 py-4">Section</th>
                  <th className="px-6 py-4">Parents Name</th>
                  <th className="px-6 py-4">Parents Contact</th>
                  <th className="px-6 py-4 text-center">Operational Progress</th>
                  <th className="px-5 py-4 text-center">Actions</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedOrders.map(order => (
                <tr key={order._id} className="hover:bg-white/5 transition-colors align-top">
                  
                  {/* Order Reference ID */}
                  <td className="px-6 py-5">
                    <span className="bg-white/10 text-white text-xs font-mono font-bold px-2.5 py-1 rounded-md border border-white/5 block w-max">
                      #{order._id.slice(-8).toUpperCase()}
                    </span>
                    <span className="text-[10px] text-gray-550 font-mono mt-1 block">Full ID: {order._id}</span>
                  </td>

                  {/* Meal Plan Preference */}
                  <td className="px-6 py-5">
                    <div className="space-y-1.5 bg-slate-950/40 p-2.5 border border-white/5 rounded-xl min-w-[150px]">
                      {order.items && order.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between gap-3 text-xs">
                          <span className="font-medium text-white">{it.name}</span>
                          <span className="font-mono text-emerald-400 font-bold shrink-0">x{it.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </td>

                  {roleTab === 'teacher' ? (
                    <>
                      {/* Teacher Name */}
                      <td className="px-6 py-5 font-bold text-sky-400">
                        <div className="space-y-1.5">
                          {order.items && order.items.map((it, idx) => {
                            const isTeacher = it.studentClass === "Teacher" || it.section === "Faculty" || it.studentClass === "Staff";
                            return (
                              <div key={idx} className="bg-sky-500/10 px-2.5 py-0.5 rounded-md border border-sky-500/20 w-max text-xs block" style={{ minHeight: '24px' }}>
                                {isTeacher ? (it.studentName || 'Teacher') : 'Teacher'}
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Teacher Email */}
                      <td className="px-6 py-5 text-white text-xs">
                        <div className="font-mono">{order.customerEmail}</div>
                      </td>

                      {/* Teacher Phone & Timestamp */}
                      <td className="px-6 py-5 text-gold-400 font-mono text-xs">
                        <div>{order.customerPhone || 'N/A'}</div>
                        <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-500 shrink-0" />
                          <span>{formatIST(order.createdAt)}</span>
                        </div>
                      </td>

                      {/* Teacher ID */}
                      <td className="px-6 py-5 text-slate-350 font-mono text-xs">
                        <span className="bg-white/5 px-2 py-0.5 rounded text-[10px] border border-white/10 font-bold">
                          {order.userId || 'N/A'}
                        </span>
                      </td>
                    </>
                  ) : roleTab === 'parent' ? (
                    <>
                      {/* Name of Student */}
                      <td className="px-6 py-5 font-bold text-emerald-400">
                        <div className="space-y-1.5">
                          {order.items && order.items.map((it, idx) => {
                            const isTeacher = it.studentClass === "Teacher" || it.section === "Faculty" || it.studentClass === "Staff";
                            return (
                              <div key={idx} className="bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20 w-max text-xs block" style={{ minHeight: '24px' }}>
                                {!isTeacher ? (it.studentName || 'Self / staff') : 'N/A'}
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Class */}
                      <td className="px-6 py-5 font-mono text-gray-300 text-xs">
                        <div className="space-y-1">
                          {order.items && order.items.map((it, idx) => (
                            <div key={idx} className="py-0.5 block">{it.studentClass || 'N/A'}</div>
                          ))}
                        </div>
                      </td>

                      {/* Section */}
                      <td className="px-6 py-5 font-mono text-gray-300 text-xs">
                        <div className="space-y-1">
                          {order.items && order.items.map((it, idx) => (
                            <div key={idx} className="py-0.5 block">{it.section || 'N/A'}</div>
                          ))}
                        </div>
                      </td>

                      {/* Parents Name */}
                      <td className="px-6 py-5 text-white font-medium text-xs">
                        <div>{order.customerName}</div>
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">{order.customerEmail}</div>
                      </td>

                      {/* Parents Contact */}
                      <td className="px-6 py-5 text-gold-400 font-mono text-xs">
                        <div>{order.customerPhone || 'N/A'}</div>
                        <div className="text-[10px] text-gray-550 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-500 shrink-0" />
                          <span>{formatIST(order.createdAt)}</span>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      {/* Name of Student */}
                      <td className="px-6 py-5 font-bold text-emerald-400">
                        <div className="space-y-1.5">
                          {order.items && order.items.map((it, idx) => {
                            const isTeacher = it.studentClass === "Teacher" || it.section === "Faculty" || it.studentClass === "Staff";
                            return (
                              <div key={idx} className="bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20 w-max text-xs block" style={{ minHeight: '24px' }}>
                                {!isTeacher ? (it.studentName || 'Self / staff') : 'N/A'}
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Teacher */}
                      <td className="px-6 py-5 font-bold text-sky-400">
                        <div className="space-y-1.5">
                          {order.items && order.items.map((it, idx) => {
                            const isTeacher = it.studentClass === "Teacher" || it.section === "Faculty" || it.studentClass === "Staff";
                            return (
                              <div key={idx} className="bg-sky-500/10 px-2.5 py-0.5 rounded-md border border-sky-500/20 w-max text-xs block" style={{ minHeight: '24px' }}>
                                {isTeacher ? (it.studentName || 'Teacher') : 'N/A'}
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Class */}
                      <td className="px-6 py-5 font-mono text-gray-300 text-xs">
                        <div className="space-y-1">
                          {order.items && order.items.map((it, idx) => (
                            <div key={idx} className="py-0.5 block">{it.studentClass || 'N/A'}</div>
                          ))}
                        </div>
                      </td>

                      {/* Section */}
                      <td className="px-6 py-5 font-mono text-gray-300 text-xs">
                        <div className="space-y-1">
                          {order.items && order.items.map((it, idx) => (
                            <div key={idx} className="py-0.5 block">{it.section || 'N/A'}</div>
                          ))}
                        </div>
                      </td>

                      {/* Parents Name */}
                      <td className="px-6 py-5 text-white font-medium text-xs">
                        <div>{order.customerName}</div>
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">{order.customerEmail}</div>
                      </td>

                      {/* Parents Contact */}
                      <td className="px-6 py-5 text-gold-400 font-mono text-xs">
                        <div>{order.customerPhone || 'N/A'}</div>
                        <div className="text-[10px] text-gray-550 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-500 shrink-0" />
                          <span>{formatIST(order.createdAt)}</span>
                        </div>
                      </td>
                    </>
                  )}

                  {/* Operational Progress Status Selector */}
                  <td className="px-6 py-5 text-center">
                    <div className="inline-flex flex-col items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] tracking-wider font-mono font-bold uppercase border
                        ${order.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                          order.status === 'Preparing' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                          order.status === 'Out for Delivery' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                          order.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                          'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}
                      >
                        {order.status}
                      </span>
                      
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order._id, e.target.value)}
                        className="bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-white text-xs outline-none w-28 text-center cursor-pointer hover:border-gold-500/50 transition-all font-medium"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </td>

                  {/* Actions (Delete Icon) */}
                  <td className="px-5 py-5 text-center">
                    <button
                      onClick={() => handleDelete(order)}
                      title="Purge transaction ticket"
                      className="p-2 border border-white/5 hover:border-red-500/30 text-gray-500 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </td>

                </tr>
              ))}
              
              {paginatedOrders.length === 0 && (
                <tr>
                  <td colSpan={roleTab === 'teacher' ? 8 : roleTab === 'parent' ? 9 : 10} className="text-center py-12 text-gray-400">
                    <p className="text-sm font-mono">No order records match the parameters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table></div>
        </div>

        {/* Mobile View - Responsive flexing cards list (Shown on Mobile screens) */}
        <div className="flex flex-col divide-y divide-white/5 md:hidden">
          {paginatedOrders.map(order => (
            <div key={order._id} className="p-4 space-y-4">
              
              {/* Card Meta & Header info */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="bg-white/10 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-white/5 inline-block">
                    #{order._id.slice(-8).toUpperCase()}
                  </span>
                  <span className="text-[9px] text-gray-500 font-mono mt-0.5 block max-w-[120px] truncate">ID: {order._id}</span>
                </div>
                
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] tracking-wider font-mono font-black uppercase border
                    ${order.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                      order.status === 'Preparing' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                      order.status === 'Out for Delivery' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                      order.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}
                  >
                    {order.status}
                  </span>
                  <span className="text-[9px] text-gray-400 font-mono flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-gray-500 shrink-0" />
                    <span>{formatIST(order.createdAt)}</span>
                  </span>
                </div>
              </div>

              {/* Customer Contact Card segment */}
              <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5 space-y-1 text-[11px]">
                <div className="text-[9px] text-slate-500 font-mono uppercase font-bold mb-1">Customer / Contact</div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Name:</span>
                  <span className="text-white font-bold">{order.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Phone:</span>
                  <span className="text-gold-400 font-bold font-mono">{order.customerPhone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Email:</span>
                  <span className="text-slate-300 font-mono truncate max-w-[170px]">{order.customerEmail}</span>
                </div>
                {roleTab === 'teacher' && order.userId && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Teacher ID:</span>
                    <span className="text-slate-300 font-mono">{order.userId}</span>
                  </div>
                )}
              </div>

              {/* Items in ticket choices */}
              <div className="space-y-1.5">
                <div className="text-[9px] text-slate-500 font-mono uppercase font-bold">Meal Choices & Roster Info</div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 space-y-2">
                  {order.items && order.items.map((it, idx) => {
                    const isTeacherMeal = it.studentClass === "Teacher" || it.section === "Faculty" || it.studentClass === "Staff" || (it.studentClass || '').toLowerCase().includes("teacher");
                    return (
                      <div key={idx} className="border-b border-white/5 last:border-0 pb-2 last:pb-0 font-sans">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-white max-w-[80%] truncate">{it.name}</span>
                          <span className="font-mono text-emerald-400 font-bold shrink-0 text-xs">x{it.quantity}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] mt-1.5 text-slate-400">
                          <div>
                            <span className="text-slate-500 font-mono block text-[8px] uppercase">Roster:</span>
                            <span className={`font-bold ${isTeacherMeal ? 'text-sky-400' : 'text-emerald-400'}`}>
                              {it.studentName || (isTeacherMeal ? 'Teacher' : 'Student')}
                            </span>
                          </div>
                          {!isTeacherMeal && (
                            <div>
                              <span className="text-slate-500 font-mono block text-[8px] uppercase">Class & Sec:</span>
                              <span className="font-bold text-slate-200">
                                {it.studentClass || 'N/A'} ({it.section || 'A'})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Operations & Progress status / action */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase shrink-0">Status:</span>
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order._id, e.target.value)}
                    className="bg-slate-950 border border-white/10 focus:border-gold-500 rounded-lg px-2 py-1 text-white text-xs outline-none w-28 text-center cursor-pointer hover:border-gold-500/50 transition-all font-medium"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleDelete(order)}
                    title="Purge transaction ticket"
                    className="p-2 border border-white/5 hover:border-red-500/30 text-gray-500 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ))}

          {paginatedOrders.length === 0 && (
            <div className="text-center py-12 text-slate-400 font-mono text-xs">
              No order records match the parameters.
            </div>
          )}
        </div>

        {/* Customized Pagination Footer Bar */}
        {totalItems > 0 && (
          <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <span className="text-xs text-gray-400 font-mono">
                Showing <span className="text-white font-bold">{startIndex + 1}</span> to <span className="text-white font-bold">{Math.min(startIndex + itemsPerPage, totalItems)}</span> of <span className="text-gold-500 font-bold">{totalItems}</span> dining logs
              </span>
              
              <div className="flex items-center gap-1.5 bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1 text-xs">
                <span className="text-gray-500 font-mono text-[9px] uppercase tracking-wider">Per Page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(parseInt(e.target.value, 10));
                    setCurrentPage(1);
                  }}
                  className="bg-transparent border-0 text-white font-mono font-bold text-xs outline-none cursor-pointer p-0 select-none focus:ring-0"
                >
                  <option value="5" className="bg-slate-900 text-white">5</option>
                  <option value="10" className="bg-slate-900 text-white">10</option>
                  <option value="25" className="bg-slate-900 text-white">25</option>
                  <option value="50" className="bg-slate-900 text-white">50</option>
                  <option value="100" className="bg-slate-900 text-white">100</option>
                </select>
              </div>
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="p-2 border border-white/15 bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer border ${
                      currentPage === page 
                        ? 'bg-gold-500 border-gold-500 text-slate-950 shadow-md font-bold' 
                        : 'border-white/10 text-gray-400 hover:text-white hover:border-white/30 bg-transparent'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-white/15 bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* REUSABLE STATE-BASED TRANSACTION PURGE MODAL */}
      {deleteConfirmOrder !== null && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-400 border-b border-white/10 pb-3">
              <AlertTriangle className="w-6 h-6 shrink-0 text-red-500" />
              <h4 className="text-lg font-serif text-white font-medium">Purge Transaction Ticket</h4>
            </div>
            <div>
              <p className="text-sm text-gray-300 leading-relaxed">
                Are you absolutely sure you want to permanently delete order record <strong className="text-white font-mono">#{deleteConfirmOrder._id.slice(-8).toUpperCase()}</strong>?
              </p>
              <div className="mt-3 bg-white/5 border border-white/5 p-3 rounded-lg space-y-1">
                <p className="text-xs text-gray-400"><strong className="text-gray-300 font-medium">Customer:</strong> {deleteConfirmOrder.customerName}</p>
                <p className="text-xs text-gray-400"><strong className="text-gray-300 font-medium">Amount:</strong> ₹{deleteConfirmOrder.totalAmount}</p>
                <p className="text-xs text-gray-400"><strong className="text-gray-300 font-medium">Timestamp:</strong> {formatIST(deleteConfirmOrder.createdAt)}</p>
              </div>
              <p className="text-[11px] text-red-400 mt-3 font-mono">
                * This execution removes files from the core dining logs. This action cannot be revoked.
              </p>
            </div>
            
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
              <button
                onClick={() => setDeleteConfirmOrder(null)}
                className="bg-white/5 hover:bg-white/5 border border-white/10 text-gray-300 font-medium px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer"
              >
                Cancel Purge
              </button>
              <button
                onClick={confirmDeleteAction}
                className="bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-red-500/20"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Live Google Map Modal */}
      {selectedMapAddress && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setSelectedMapAddress(null)} />
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-4xl relative overflow-hidden shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-250">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-950">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gold-500 animate-pulse" />
                <div className="text-left">
                  <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Canteen Gourmet Delivery Destination Map</h4>
                  <p className="text-[10px] font-mono text-gray-400 mt-0.5 max-w-[500px] truncate">{selectedMapAddress}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMapAddress(null)}
                className="text-gray-400 hover:text-white hover:bg-white/5 p-1.5 rounded-lg border border-white/5 font-mono text-xs uppercase tracking-widest transition-colors cursor-pointer"
              >
                Close Map
              </button>
            </div>

            {/* Frame Container */}
            <div className="relative aspect-video w-full bg-black/50">
              <iframe
                title="Google Maps Location Tracker representation"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedMapAddress)}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
              />
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-950 border-t border-white/5 flex justify-between items-center text-[10px] font-mono text-gray-500">
              <span>Delivery Address Geolocation Node</span>
              <span>Google Maps Live Server Embed</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
