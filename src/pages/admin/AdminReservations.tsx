import React, { useState, useEffect } from 'react';
import { getReservations, updateReservationInStorage, deleteReservationInStorage, submitReservation } from '../../api/client';
import { 
  Calendar, 
  Users, 
  Check, 
  X, 
  Trash2, 
  Search, 
  AlertTriangle, 
  Plus, 
  Plane, 
  ChevronLeft, 
  ChevronRight, 
  Bookmark, 
  RefreshCw 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Reservation {
  id: any;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  tables?: number;
  seatNumber: string;
  status: string;
  classType: string;
}

export function AdminReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Manual Add Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('14:00');
  const [guests, setGuests] = useState('2');
  const [tablesVal, setTablesVal] = useState('1');
  const [classType, setClassType] = useState('First Class');
  const [seatNumber, setSeatNumber] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Custom delete confirmation modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState<any | null>(null);

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const data = await getReservations();
      setReservations(data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load Canteen reservations.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (resObj: Reservation, newStatus: string) => {
    const updated = { ...resObj, status: newStatus };
    try {
      await updateReservationInStorage(updated);
      toast.success(`Reservation status updated to ${newStatus}`);
      loadReservations();
    } catch (e) {
      toast.error("Error saving status check.");
    }
  };

  const handleDelete = (id: any) => {
    setDeleteConfirmId(id);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error("Please fill out Passenger Name and Contact Email.");
      return;
    }

    try {
      await submitReservation({
        name,
        email,
        phone,
        date,
        time,
        guests: Number(guests),
        tables: Number(tablesVal),
        classType,
        seatNumber: seatNumber || undefined
      });
      toast.success("Passenger reserved successfully!");
      setIsAddOpen(false);
      // reset fields
      setName('');
      setEmail('');
      setPhone('');
      setSeatNumber('');
      setTablesVal('1');
      loadReservations();
    } catch (e: any) {
      toast.error(e.message || "Error creating manual logging.");
    }
  };

  // Metrics Today vs Total
  const todayStr = new Date().toISOString().split('T')[0];
  const todayReservationsCount = reservations.filter(r => r.date === todayStr).length;
  const pendingReservationsCount = reservations.filter(r => r.status === 'Pending').length;
  const bookedTablesToday = reservations
    .filter(r => r.date === todayStr && r.status !== 'Cancelled')
    .reduce((sum, r) => sum + (r.tables || 1), 0);
  const remainingTablesToday = Math.max(0, 10 - bookedTablesToday);

  // Filter lists
  const filtered = reservations.filter(res => {
    const matchesSearch = res.name.toLowerCase().includes(search.toLowerCase()) || 
                          res.email.toLowerCase().includes(search.toLowerCase()) ||
                          res.seatNumber.toLowerCase().includes(search.toLowerCase());
    const matchesClass = classFilter === 'all' || res.classType.toLowerCase() === classFilter.toLowerCase();
    const matchesStatus = statusFilter === 'all' || res.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesClass && matchesStatus;
  });

  // Paginated List calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Confirmed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Completed': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'Cancelled': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-white/5 text-gray-400 border-white/5';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <RefreshCw className="w-10 h-10 animate-spin text-gold-500 mb-4" />
        <p className="font-mono text-sm tracking-wider uppercase">Accessing reservation logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-r from-slate-900 to-slate-950 border border-white/10 rounded-2xl p-6 shadow-xl gap-4">
        <div>
          <span className="text-gold-500 text-xs font-mono tracking-widest uppercase mb-1 block">Passenger Logbook</span>
          <h3 className="text-3xl font-serif text-white">Table & Cabin Bookings</h3>
          <p className="text-gray-400 text-sm mt-1">Approve, update layouts, and allocate VIP seats to Canteen customers.</p>
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-slate-950 font-bold px-5 py-3 rounded-xl transition-all shadow-lg text-sm"
        >
          <Plus className="w-5 h-5 animate-pulse" />
          <span>Manual Reservation</span>
        </button>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-sans">
        <div className="bg-slate-900 border border-white/5 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs tracking-wider uppercase font-mono">Today's Reserved Canteens</p>
            <h4 className="text-3xl font-bold text-white mt-1">{todayReservationsCount}</h4>
            <p className="text-xs text-gold-500 inline-block bg-gold-500/10 px-2 py-0.5 rounded mt-2 font-mono">Real-time Scheduled</p>
          </div>
          <div className="bg-gold-500/10 p-3 rounded-lg border border-gold-500/20">
            <Calendar className="w-6 h-6 text-gold-500" />
          </div>
        </div>
        <div className="bg-slate-900 border border-white/5 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs tracking-wider uppercase font-mono font-bold text-yellow-500">Pending Approvals</p>
            <h4 className="text-3xl font-bold text-white mt-1">{pendingReservationsCount}</h4>
            <p className="text-xs text-gray-400 mt-2">Requires verification</p>
          </div>
          <div className="bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
            <Plane className="w-6 h-6 text-yellow-500" />
          </div>
        </div>
        <div className="bg-slate-900 border border-white/5 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs tracking-wider uppercase font-mono text-gold-500 font-bold">Today's Tables Left</p>
            <h4 className="text-2xl font-bold text-white mt-1">{remainingTablesToday} / 10 Remaining</h4>
            <div className="w-24 bg-white/5 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${remainingTablesToday > 5 ? 'bg-emerald-500' : remainingTablesToday > 2 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${(remainingTablesToday / 10) * 100}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">{bookedTablesToday} tables reserved</p>
          </div>
          <div className="bg-gold-500/10 p-3 rounded-lg border border-gold-500/20">
            <RefreshCw className="w-6 h-6 text-gold-500" />
          </div>
        </div>
        <div className="bg-slate-900 border border-white/5 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs tracking-wider uppercase font-mono">VIP / First-Class Shares</p>
            <h4 className="text-3xl font-bold text-white mt-1">
              {Math.round((reservations.filter(r => r.classType === 'First Class').length / (reservations.length || 1)) * 100)}%
            </h4>
            <p className="text-xs text-gray-400 mt-2">Elite Canteen seating ratio</p>
          </div>
          <div className="bg-purple-500/10 p-3 rounded-lg border border-purple-500/20">
            <Bookmark className="w-6 h-6 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative md:col-span-2">
          <input 
            type="text" 
            placeholder="Search passenger names, emails, seat number..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 pl-10 text-sm text-white placeholder-gray-500 outline-none focus:border-gold-500/50"
          />
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
        </div>
        <div>
          <select
            value={classFilter}
            onChange={(e) => { setClassFilter(e.target.value); setCurrentPage(1); }}
            className="w-full h-full bg-slate-900 border border-white/10 rounded-xl px-3 py-3 text-sm text-white select-none cursor-pointer outline-none focus:border-gold-500"
          >
            <option value="all">All Cabin Tiers</option>
            <option value="first class">First Class Elite</option>
            <option value="business class">Business Class</option>
          </select>
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="w-full h-full bg-slate-900 border border-white/10 rounded-xl px-3 py-3 text-sm text-white select-none cursor-pointer outline-none focus:border-gold-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Logs</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Main reservation Table */}
      <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <div className="w-full overflow-x-auto"><table className="w-full text-left text-sm text-gray-200">
            <thead className="bg-white/5 text-xs uppercase text-white border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Passenger Name</th>
                <th className="px-6 py-4">Canteen Details</th>
                <th className="px-6 py-4">Seating</th>
                <th className="px-6 py-4">Passengers / Tables</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(res => (
                <tr key={res.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-medium text-base">{res.name}</p>
                      <p className="text-xs text-gray-500 tracking-wide mt-1">{res.email} • {res.phone}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-gray-300 bg-white/5 border border-white/5 px-2 py-1 rounded text-xs">
                      {res.date} @ {res.time}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <span className="text-gold-500 font-bold font-mono text-xs block">Seat #{res.seatNumber}</span>
                      <span className="text-[10px] uppercase text-gray-400 font-bold bg-white/5 px-1.5 py-0.5 rounded">{res.classType}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-white font-mono">
                    <div className="flex flex-col gap-1 items-start">
                      <div className="flex items-center gap-1.5 text-xs text-gray-300">
                        <Users className="w-3.5 h-3.5 text-gray-400" /> {res.guests} Pax
                      </div>
                      <span className="font-mono text-[11px] font-bold tracking-wide text-gold-500 bg-gold-500/10 px-1.5 py-0.5 rounded border border-gold-500/20">
                        {res.tables || 1} { (res.tables || 1) === 1 ? 'Table' : 'Tables' }
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full border ${getStatusStyle(res.status)}`}>
                      {res.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end items-center gap-2">
                      {res.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(res, 'Confirmed')}
                            className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 rounded transition-all cursor-pointer"
                            title="Confirm Booking"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(res, 'Cancelled')}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded transition-all cursor-pointer"
                            title="Decline/Cancel Booking"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {res.status === 'Confirmed' && (
                        <button
                          onClick={() => handleUpdateStatus(res, 'Completed')}
                          className="text-xs bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white border border-indigo-500/20 px-2 py-1.5 rounded transition-all cursor-pointer"
                        >
                          Complete
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDelete(res.id)}
                        className="p-1.5 bg-white/5 hover:bg-red-500 text-gray-400 hover:text-white rounded transition-all cursor-pointer"
                        title="Purged record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-500">
                    <AlertTriangle className="w-8 h-8 text-yellow-500/50 mx-auto mb-3" />
                    No bookings logged. Try clearing filter settings.
                  </td>
                </tr>
              )}
            </tbody>
          </table></div>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Showing <span className="text-white font-bold">{startIndex + 1}</span> to <span className="text-white font-bold">{Math.min(startIndex + itemsPerPage, filtered.length)}</span> of <span className="font-mono text-gold-500 font-bold">{filtered.length}</span> bookings
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-2 rounded-lg bg-white/5 border border-white/5 text-gray-400 disabled:opacity-30 disabled:pointer-events-none hover:bg-white/10"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-all ${
                    currentPage === idx + 1 
                      ? 'bg-gold-500 text-slate-950 font-bold border border-gold-500' 
                      : 'hover:bg-white/5 text-gray-400'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-2 rounded-lg bg-white/5 border border-white/5 text-gray-400 disabled:opacity-30 disabled:pointer-events-none hover:bg-white/5"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: New Manual passenger booking Add */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-[999]">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center bg-white/5 px-6 py-4 border-b border-b-white/10">
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                <Plane className="w-5 h-5 text-gold-500" />
                Seat Reserve Logger
              </h4>
              <button 
                onClick={() => setIsAddOpen(false)}
                className="text-gray-400 hover:text-white bg-white/5 p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-bold">Passenger Name *</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Saharsh Reddy"
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-gold-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-bold">Contact Email *</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="email@example.com"
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-gold-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-bold">Contact Phone</label>
                  <input 
                    type="text" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 900-xx-xxxx"
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-gold-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-bold">Canteen Date</label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-gold-500 text-sm cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-bold">Meal Schedule Slot</label>
                  <input 
                    type="text" 
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="14:30"
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-gold-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-bold">Guests Count</label>
                  <select 
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-gold-500 text-sm cursor-pointer"
                  >
                    <option value="1">1 Person</option>
                    <option value="2">2 Persons</option>
                    <option value="3">3 Persons</option>
                    <option value="4">4 Persons</option>
                    <option value="5">5 Persons</option>
                    <option value="6">6 Persons</option>
                    <option value="7">7 Persons</option>
                    <option value="8">8 Persons</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gold-500 mb-1 font-bold">Tables Count</label>
                  <select 
                    value={tablesVal}
                    onChange={(e) => setTablesVal(e.target.value)}
                    className="w-full bg-slate-950 border border-gold-500/30 rounded-lg px-3 py-2 text-white outline-none focus:border-gold-400 text-sm cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <option key={n} value={n}>{n} {n === 1 ? 'Table' : 'Tables'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-bold">Seat Alloc.</label>
                  <input 
                    type="text" 
                    value={seatNumber}
                    onChange={(e) => setSeatNumber(e.target.value)}
                    placeholder="e.g. 14F"
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-gold-500 outline-none text-sm uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-bold">Cabin Class</label>
                  <select 
                    value={classType}
                    onChange={(e) => setClassType(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-gold-500 text-sm cursor-pointer"
                  >
                    <option value="First Class">First Class</option>
                    <option value="Business Class">Business</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="bg-white/5 hover:bg-white/5 text-gray-400 border border-transparent px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gold-500 text-slate-950 font-bold px-5 py-2 rounded-lg text-sm hover:bg-gold-400 hover:shadow-lg transition-all cursor-pointer"
                >
                  Save Passenger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REUSABLE STATE-BASED DELETION CONFIRMATION DIALOG FOR BOOKINGS */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-500 border-b border-white/10 pb-3">
              <AlertTriangle className="w-6 h-6 shrink-0 text-red-500" />
              <h4 className="text-lg font-serif text-white font-medium">Delete Reservation Entry</h4>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              Are you sure you want to permanently cancel and delete this passenger booking? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="bg-white/5 hover:bg-white/5 border border-white/10 text-gray-300 font-medium px-4 py-2 rounded-xl text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const idToDel = deleteConfirmId;
                  setDeleteConfirmId(null);
                  try {
                    await deleteReservationInStorage(idToDel);
                    toast.success("Passenger booking deleted.");
                    loadReservations();
                  } catch (err) {
                    console.error(err);
                    toast.error("Deletion cycle failed.");
                  }
                }}
                className="bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-2 rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-red-500/20"
              >
                Delete Reservation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
