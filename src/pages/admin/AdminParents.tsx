import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Users, 
  Activity,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';

interface UserData {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  isAdmin: boolean;
  isTeacher?: boolean;
  subscribedPlan?: string;
  planActive?: boolean;
  planStartDate?: string;
  planExpiryDate?: string;
  planDaysRemaining?: number;
}

export function AdminParents() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination, Search & Role Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | 'none' | 'Daily Plan' | 'Weekly Plan' | 'Monthly Plan' | 'Yearly Plan'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'parent' | 'teacher' | 'admin'>('parent');
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const itemsPerPage = 8;

  const fetchUsers = () => {
    fetch('/api/admin/users', {
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
          setUsers(data);
        } else if (data.error !== 'Invalid token') {
          toast.error(data.error);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
        toast.error('Failed to load user registries from server.');
      });
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  const deleteUser = async (id: string) => {
    if (id === currentUser?.id) {
      toast.error("You cannot delete your own account.");
      return;
    }
    
    setConfirmDeleteId(null);
    
    try {
      toast.loading("Deleting user...", { id: "delete-user" });
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      
      let errorMsg = "Failed to delete user";
      try {
        const error = await res.json();
        if (error.error) errorMsg = error.error;
      } catch (e) {
        // Not JSON
      }

      if (res.ok) {
        toast.success("User deleted successfully.", { id: "delete-user" });
        fetchUsers();
      } else {
        toast.error(errorMsg, { id: "delete-user" });
      }
    } catch(e: any) {
      toast.error("Failed to delete user: " + e.message, { id: "delete-user" });
    }
  };

  // Filter Logic
  const filteredUsers = users.filter(u => {
    const q = searchTerm.toLowerCase().trim();
    
    // Role level filters
    if (roleFilter === 'teacher' && !u.isTeacher) return false;
    if (roleFilter === 'parent' && (u.isTeacher || u.isAdmin)) return false;
    if (roleFilter === 'admin' && !u.isAdmin) return false;

    if (planFilter !== 'all') {
      const hasPlan = u.planActive && u.subscribedPlan;
      if (planFilter === 'none' && hasPlan) return false;
      if (planFilter !== 'none' && (!hasPlan || u.subscribedPlan !== planFilter)) return false;
    }

    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.mobile && u.mobile.toLowerCase().includes(q))
    );
  });

  // Pagination Logic
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  // User Counts for Tabs
  const roleCounts = {
    all: users.length,
    parent: users.filter(u => !u.isTeacher && !u.isAdmin).length,
    teacher: users.filter(u => u.isTeacher && !u.isAdmin).length,
    admin: users.filter(u => u.isAdmin).length
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#0d1530] to-[#080d22] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <span className="text-blue-400 text-xs font-mono tracking-widest uppercase mb-1 block">Parent Administration Panel</span>
          <h3 className="text-3xl font-bold font-serif text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            Manage Parents
          </h3>
          <p className="text-slate-400 text-sm mt-1">Audit active parents, track subscription statuses, and manage accounts.</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2 flex items-center gap-3">
          <Users className="w-5 h-5 text-blue-400" />
          <div>
            <span className="block text-[10px] font-mono text-gray-500 uppercase">Parents Registered</span>
            <span className="text-sm font-bold text-white font-mono">{roleCounts.parent} parents</span>
          </div>
        </div>
      </div>

      

      {/* Filters and Search */}
      <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name, email, or mobile..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/50"
          />
        </div>
        
        <div className="relative">
          <select
            value={planFilter}
            onChange={(e) => {
              setPlanFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="bg-slate-900 border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 cursor-pointer min-w-[160px] appearance-none w-full"
          >
            <option value="all" className="bg-slate-900 text-white">All Plans</option>
            <option value="none" className="bg-slate-900 text-white">No Active Plan</option>
            <option value="Daily Plan" className="bg-slate-900 text-white">Daily Plan</option>
            <option value="Weekly Plan" className="bg-slate-900 text-white">Weekly Plan</option>
            <option value="Monthly Plan" className="bg-slate-900 text-white">Monthly Plan</option>
            <option value="Yearly Plan" className="bg-slate-900 text-white">Yearly Plan</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-2xl border border-white/5 overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-gray-500 font-mono bg-black/20">
                <th className="px-6 py-4 font-bold">Name</th>
                <th className="px-6 py-4 font-bold">Contact Node</th>
                <th className="px-6 py-4 font-bold">Plan Status</th>
                <th className="px-6 py-4 font-bold">System Role</th>
                <th className="px-6 py-4 font-bold text-right">Action Interface</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedUsers.map(u => (
                <tr key={u._id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gold-400/10 border border-gold-500/20 text-gold-500 flex items-center justify-center font-serif text-lg font-bold group-hover:scale-110 transition-transform">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-bold">{u.name}</div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">{u._id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-300 font-mono">{u.email}</div>
                    {u.mobile && <div className="text-xs text-gray-500 font-sans mt-1">📞 {u.mobile}</div>}
                  </td>
                  <td className="px-6 py-4">
                    {u.isAdmin ? (
                      <span className="text-gray-500 font-mono text-[11px] italic">N/A (Admin)</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {!u.subscribedPlan || !u.planActive ? (
                           <span className="text-gray-500 font-mono text-[11px] italic">none</span>
                        ) : (
                           <>
                             <span className={`font-bold text-[10px] uppercase tracking-wider ${
                               u.subscribedPlan === 'Daily Plan' ? 'text-blue-400' :
                               u.subscribedPlan === 'Weekly Plan' ? 'text-emerald-400' :
                               u.subscribedPlan === 'Monthly Plan' ? 'text-purple-400' :
                               u.subscribedPlan === 'Yearly Plan' ? 'text-amber-400' : 'text-gray-300'
                             }`}>
                               {u.subscribedPlan}
                             </span>
                             {u.planStartDate && (
                               <div className="text-[10px] font-mono text-gray-400 mt-1">
                                 Exp: {u.planExpiryDate ? new Date(u.planExpiryDate).toLocaleDateString() : 'N/A'}
                                 <span className="text-emerald-400 ml-2">({u.planDaysRemaining ?? 0}d left)</span>
                               </div>
                             )}
                           </>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold font-mono uppercase tracking-wide ${
                      u.isAdmin 
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                        : u.isTeacher
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {u.isAdmin ? 'Canteen Admin' : u.isTeacher ? 'Teacher' : 'Registered Parent'}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 text-right font-mono">
                    {u._id !== currentUser?.id ? (
                      confirmDeleteId === u._id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => deleteUser(u._id)}
                            className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-[10px] uppercase font-bold tracking-wider transition-colors cursor-pointer"
                          >
                            Confirm Delete
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-3 py-1.5 rounded-lg border border-gray-500/40 hover:border-gray-500 text-gray-400 hover:bg-gray-500/5 text-[10px] uppercase font-bold tracking-wider transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(u._id)}
                          className="px-3 py-1.5 rounded-lg border border-red-500/40 hover:border-red-500 text-red-500 hover:bg-red-500/5 text-[10px] uppercase font-bold tracking-wider transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      )
                    ) : (
                      <span className="text-[10px] text-gray-500 font-mono italic flex items-center justify-end gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-blue-500/70" />
                        Active Agent
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              
              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500 font-mono text-xs">
                    No user records found matching query parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden divide-y divide-white/10 font-sans">
          {paginatedUsers.map(u => (
            <div key={u._id} className="p-4 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gold-400/10 border border-gold-500/20 text-gold-500 flex items-center justify-center font-serif text-sm font-bold shrink-0">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-bold truncate text-[14px]">{u.name}</p>
                  <p className="text-gray-500 text-xs truncate font-mono mt-0.5">{u.email}</p>
                  {u.mobile && <p className="text-gray-400 text-xs font-sans mt-0.5">📞 {u.mobile}</p>}
                </div>
              </div>

              <div className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-xl border border-white/5 text-xs gap-3">
                <div className="flex flex-col gap-1 items-start">
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider font-mono">Plan status</span>
                  {u.isAdmin ? (
                    <span className="text-gray-500 font-mono text-[11px] italic">N/A (Admin)</span>
                  ) : (
                    <div className="flex flex-col items-end gap-1">
                      {!u.subscribedPlan || !u.planActive ? (
                         <span className="text-gray-500 font-mono text-[11px] italic">none</span>
                      ) : (
                         <>
                           <span className={`font-bold text-[10px] uppercase tracking-wider ${
                             u.subscribedPlan === 'Daily Plan' ? 'text-blue-400' :
                             u.subscribedPlan === 'Weekly Plan' ? 'text-emerald-400' :
                             u.subscribedPlan === 'Monthly Plan' ? 'text-purple-400' :
                             u.subscribedPlan === 'Yearly Plan' ? 'text-amber-400' : 'text-gray-300'
                           }`}>
                             {u.subscribedPlan}
                           </span>
                           {u.planStartDate && (
                             <div className="text-[9px] font-mono text-gray-400 mt-1 text-right space-y-0.5">
                               <div>Start: {new Date(u.planStartDate).toLocaleDateString()}</div>
                               {u.planExpiryDate && <div>End: {new Date(u.planExpiryDate).toLocaleDateString()}</div>}
                               <div className="text-emerald-400 font-bold mt-0.5">{u.planDaysRemaining ?? 0} days left</div>
                             </div>
                           )}
                         </>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider font-mono">System role</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase tracking-wide ${
                    u.isAdmin 
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' 
                      : u.isTeacher
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {u.isAdmin ? 'Admin' : u.isTeacher ? 'Teacher' : 'Parent'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                {u._id !== currentUser?.id ? (
                  confirmDeleteId === u._id ? (
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => deleteUser(u._id)}
                      className="flex-1 py-2 rounded-xl bg-red-500 text-white text-[10px] uppercase font-bold tracking-wider transition-colors cursor-pointer"
                    >
                      Confirm Delete
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="flex-1 py-2 rounded-xl border border-gray-500/40 text-gray-400 text-[10px] uppercase font-bold tracking-wider transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(u._id)}
                    className="w-full py-2 rounded-xl border border-red-500/40 hover:border-red-500 text-red-400 bg-red-950/20 text-[10px] uppercase font-bold tracking-wider transition-colors cursor-pointer"
                  >
                    Delete User
                  </button>
                )
                ) : (
                  <span className="text-[10px] text-gray-500 font-mono italic flex items-center justify-end gap-1.5 pt-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-blue-500/70" />
                    Active Admin Agent
                  </span>
                )}
              </div>
            </div>
          ))}
          {paginatedUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-xs">
              No user records found.
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-gray-400 font-mono">
              Showing <span className="text-white font-bold">{startIndex + 1}</span> to <span className="text-white font-bold">{Math.min(startIndex + itemsPerPage, totalItems)}</span> of <span className="text-gold-500 font-bold">{totalItems}</span> users
            </span>
            
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
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md font-bold' 
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
          </div>
        )}
      </div>
    </div>
  );
}
