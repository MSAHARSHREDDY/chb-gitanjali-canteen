import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, Edit2, Trash2, Check, X, Shield, Plus, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface Student {
  _id: string;
  parentId: any;
  name: string;
  age: number;
  rollNo: string;
  studentClass: string;
  section: string;
  planActive?: boolean;
  subscribedPlan?: string;
  planStartDate?: string;
  planExpiryDate?: string;
  planDaysRemaining?: number;
  createdAt?: string;
}

export function AdminStudents() {
  const { token, user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Search, filter, and pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', age: '', rollNo: '', studentClass: '', section: '' });

  // Filter logic
  const filteredStudents = students.filter(student => {
    const term = searchTerm.toLowerCase();
    const parentName = student.parentId?.name || '';
    const parentEmail = student.parentId?.email || '';
    const parentMobile = student.parentId?.mobile || 'N/A';
    
    const matchesSearch = 
      student.name.toLowerCase().includes(term) ||
      student.studentClass.toLowerCase().includes(term) ||
      student.section.toLowerCase().includes(term) ||
      student.rollNo.toLowerCase().includes(term) ||
      parentName.toLowerCase().includes(term) ||
      parentEmail.toLowerCase().includes(term) ||
      parentMobile.toLowerCase().includes(term);

    const matchesClass = classFilter === 'all' || student.studentClass === classFilter;

    return matchesSearch && matchesClass;
  });

  // Unique classes for reference dropdown
  const uniqueClasses = Array.from(new Set(students.map(s => s.studentClass).filter(Boolean)));

  // Pagination calculation
  const totalItems = filteredStudents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, classFilter]);

  useEffect(() => {
    fetchStudents();
  }, [token]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/students/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete student: ${name}?`)) return;

    try {
      const res = await fetch(`/api/students/admin/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success('Student deleted successfully');
        fetchStudents();
      } else {
        toast.error('Failed to delete student');
      }
    } catch (err) {
      toast.error('Failed to delete student');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/students/admin/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        toast.success("Student updated!");
        setShowForm(false);
        setEditingId(null);
        fetchStudents();
      } else {
        toast.error('Failed to update student');
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  if (loading) return <div className="text-white p-8 flex items-center justify-center"><RefreshCw className="animate-spin text-gold-500" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 border border-white/10 rounded-2xl p-6 md:p-8 gap-4">
        <div>
          <span className="text-gold-500 text-xs font-mono tracking-widest uppercase mb-1 block">Directory</span>
          <h3 className="text-3xl font-serif text-white">Student Management</h3>
          <p className="text-gray-400 text-sm mt-1">Manage global student records across all parent accounts.</p>
        </div>
        <div className="flex items-center gap-4 bg-slate-950/60 border border-white/10 px-5 py-3.5 rounded-xl shrink-0 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-white">{students.length}</div>
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Total Students</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-slate-900 border border-white/10 rounded-2xl p-5 md:p-6 shadow-xl">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search students, class, section, parent, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/50 transition-all font-sans"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs font-bold"
            >
              CLEAR
            </button>
          )}
        </div>
        <div className="w-full sm:w-60 relative">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none cursor-pointer appearance-none"
          >
            <option value="all">Grade filter: All Classes</option>
            {uniqueClasses.map((cl) => (
              <option key={cl} value={cl}>Class {cl}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs">
            ▼
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl animate-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-serif text-white flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-gold-500" />
              Edit Student Record
            </h4>
            <button
              onClick={() => { setShowForm(false); setEditingId(null); }}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Name</label>
              <input required type="text" className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-white" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Age</label>
              <input required type="number" className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-white" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Class / Grade</label>
              <input required type="text" className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-white" value={form.studentClass} onChange={e => setForm({ ...form, studentClass: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Section</label>
              <input required type="text" className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-white" value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} />
            </div>
            
            <div className="md:col-span-2 flex justify-end mt-2">
              <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-lg text-sm cursor-pointer flex items-center gap-2">
                <Check className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-xl overflow-hidden">
        
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <div className="w-full overflow-x-auto"><table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-white/10">
                <th className="p-4 text-xs font-mono font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Unique ID</th>
                <th className="p-4 text-xs font-mono font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Name</th>
                <th className="p-4 text-xs font-mono font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Class & Sec</th>
                <th className="p-4 text-xs font-mono font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Parents Info</th>
                <th className="p-4 text-xs font-mono font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Active Plan</th>
                <th className="p-4 text-xs font-mono font-bold text-gray-400 uppercase tracking-wider text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-slate-900 text-sm">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500 font-mono text-xs">No active student records found.</td>
                </tr>
              ) : (
                paginatedStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-4 whitespace-nowrap">
                      <p className="text-[10px] text-gray-500 font-mono font-bold tracking-wider">{student._id}</p>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center border border-white/10 text-emerald-400 shrink-0">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-white font-bold">{student.name}</p>
                          <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">{student.age} Years Old</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <p className="text-gray-300 font-medium">Class {student.studentClass}</p>
                      <p className="text-gray-400 font-medium text-xs mt-0.5">Section {student.section}</p>
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      {student.parentId ? (
                        <div>
                           <p className="text-gray-300 font-medium flex items-center gap-1.5"><Shield className="w-3 h-3 text-gold-500"/> {student.parentId.name}</p>   
                           <p className="text-[10px] text-gray-500 font-mono mt-0.5">{student.parentId.email}</p>
                           <p className="text-[10px] text-gray-400 font-mono mt-0.5">📱 {student.parentId?.mobile || 'N/A'}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-rose-500 font-mono italic">Account Unlinked</span>
                      )}
                    </td>
                    
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex flex-col items-start gap-1">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                          student.planActive && student.subscribedPlan
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-white/5 text-slate-500 border-white/10'
                        }`}>
                          {student.planActive && student.subscribedPlan ? student.subscribedPlan : 'None'}
                        </span>
                        {student.planActive && (
                          <>
                            <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Active
                            </span>
                            {student.planStartDate && (
                              <div className="text-[9px] font-mono text-gray-400 mt-1 space-y-0.5">
                                <div>Start: {new Date(student.planStartDate).toLocaleDateString()}</div>
                                {student.planExpiryDate && <div>End: {new Date(student.planExpiryDate).toLocaleDateString()}</div>}
                                <div className="text-emerald-400 font-bold">{student.planDaysRemaining ?? 0} days left</div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setForm({ name: student.name, age: student.age.toString(), rollNo: student.rollNo, studentClass: student.studentClass, section: student.section });
                            setEditingId(student._id);
                            setShowForm(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-emerald-400 transition-colors bg-white/5 rounded border border-white/10 cursor-pointer"
                          title="Edit Student"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(student._id, student.name)}
                          className="p-1.5 text-gray-400 hover:text-rose-400 transition-colors bg-white/5 rounded border border-white/10 cursor-pointer"
                          title="Delete Student"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table></div>
        </div>

        {/* Mobile Card-Based List View */}
        <div className="block md:hidden divide-y divide-white/10">
          {paginatedStudents.length === 0 ? (
            <div className="p-8 text-center text-gray-500 font-mono text-xs">
              No active student records found.
            </div>
          ) : (
            paginatedStudents.map((student) => (
              <div key={student._id} className="p-4 space-y-3 font-sans">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center border border-white/10 text-emerald-400 shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base leading-tight">{student.name}</h4>
                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">{student.age} Years Old • Roll {student.rollNo || "N/A"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-white/5 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold font-mono">Academic Class</span>
                    <span className="text-white font-medium">Class {student.studentClass} • Sec {student.section}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold font-mono">Linked Parent</span>
                    {student.parentId ? (
                      <span className="text-white font-medium block truncate" title={student.parentId.name}>
                        {student.parentId.name}
                      </span>
                    ) : (
                      <span className="text-rose-500 italic block">None</span>
                    )}
                  </div>
                </div>

                {student.parentId && (
                  <div className="text-xs text-slate-400 pl-1 space-y-0.5">
                    <p className="truncate"><span className="text-[10px] uppercase font-mono font-bold text-slate-500">Parent contact: </span>{student.parentId.email}</p>
                    <p><span className="text-[10px] uppercase font-mono font-bold text-slate-500">Mobile phone: </span>{student.parentId.mobile || "N/A"}</p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => {
                      setForm({ name: student.name, age: student.age.toString(), rollNo: student.rollNo, studentClass: student.studentClass, section: student.section });
                      setEditingId(student._id);
                      setShowForm(true);
                    }}
                    className="flex-1 max-w-[120px] flex items-center justify-center gap-1.5 py-1.5 bg-white/5 hover:bg-emerald-400 hover:text-slate-950 transition-all text-xs font-mono font-bold border border-white/10 rounded-lg text-slate-300 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(student._id, student.name)}
                    className="flex-1 max-w-[120px] flex items-center justify-center gap-1.5 py-1.5 bg-white/5 hover:bg-red-500 hover:text-white transition-all text-xs font-mono font-bold border border-white/10 rounded-lg text-slate-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-950/60 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs font-mono text-gray-400">
              Showing <span className="text-white font-bold">{startIndex + 1}</span> to{' '}
              <span className="text-white font-bold">
                {Math.min(startIndex + itemsPerPage, totalItems)}
              </span>{' '}
              of <span className="text-white font-bold">{totalItems}</span> records
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs font-semibold text-gray-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
              >
                Prev
              </button>
              <span className="text-xs font-bold font-mono text-white px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs font-semibold text-gray-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
