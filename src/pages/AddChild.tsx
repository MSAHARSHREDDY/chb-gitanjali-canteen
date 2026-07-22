import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UsersIcon, Edit2, Trash2, Check, Plus, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

export function AddChild() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { students, refreshStudents } = useCart();
  const [studentForm, setStudentForm] = useState({
    name: '', age: '', rollNo: '', studentClass: '', section: ''
  });
  const [isEditingStudent, setIsEditingStudent] = useState<string | null>(null);

  // Prevent teachers or non-logged in users from accessing
  React.useEffect(() => {
    if (!user) {
      toast.error('Please login first.');
      navigate('/');
    } else if (user.isTeacher) {
      toast.error('Teachers cannot access child registration.');
      navigate('/');
    }
  }, [user, navigate]);

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    if (!studentForm.studentClass || !studentForm.section) {
      toast.error('Please select both Class and Section.');
      return;
    }

    try {
      const endpoint = isEditingStudent ? `/api/students/${isEditingStudent}` : '/api/students';
      const method = isEditingStudent ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...studentForm, age: parseInt(studentForm.age) })
      });

      if (res.ok) {
        toast.success(isEditingStudent ? 'Child details updated!' : 'Child registered successfully!');
        setStudentForm({ name: '', age: '', rollNo: '', studentClass: '', section: '' });
        setIsEditingStudent(null);
        await refreshStudents();
      } else {
        const err = await res.json().catch(() => null);
        if (res.status === 401 || err?.error === "Invalid token") {
          toast.error("Your session has expired. Please log in again.");
          logout();
          navigate('/');
        } else {
          toast.error(err?.error || 'Failed to save details');
        }
      }
    } catch (err) {
      toast.error('Local error saving child details.');
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!window.confirm("Remove this child profile?")) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Child profile removed.');
        await refreshStudents();
      } else {
        toast.error('Failed to remove child profile');
      }
    } catch (err) {
      toast.error('Error removing profile.');
    }
  };

  if (!user || user.isTeacher) return null;

  return (
    <div className="w-full pt-20 pb-12 min-h-screen relative overflow-x-hidden bg-transparent">
      {/* Ambient background decoration */}
      <div className="absolute inset-0 pointer-events-none select-none z-0">
        <div className="absolute top-[20%] right-[10%] w-[350px] h-[350px] bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-[90px] animate-pulse"></div>
        <div className="absolute bottom-[30%] left-[5%] w-[400px] h-[400px] bg-gradient-to-tr from-cyan-500/5 to-emerald-500/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 w-full animate-in fade-in duration-300">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
          <div>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white mb-1 uppercase tracking-tight">Manage Children Profiles</h2>
            <p className="text-slate-400 text-xs font-semibold">Register your children to subscribe plans independently.</p>
          </div>
          <button 
            onClick={() => navigate('/weekly-menu')}
            className="flex items-center justify-center gap-2 bg-[#15193B]/80 text-blue-100 border border-white/10 hover:border-white/20 hover:text-white hover:bg-slate-900 px-4 py-2 text-xs font-sans font-black uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 cursor-pointer shrink-0 w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" /> Back to Menu
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Form Component */}
          <div className="bg-slate-950/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl h-max">
            <h3 className="text-sm font-bold text-brand-emerald uppercase tracking-wider mb-6 flex items-center gap-2">
              <UsersIcon className="w-4 h-4" /> {isEditingStudent ? "Modify Child Details" : "Register New Child"}
            </h3>
            <form onSubmit={handleSaveStudent}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Student Full Name</label>
                  <input
                    required
                    type="text"
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-brand-emerald text-xs"
                    value={studentForm.name}
                    onChange={e => setStudentForm({ ...studentForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Age</label>
                  <input
                    required
                    type="number"
                    min="3"
                    max="20"
                    placeholder="e.g. 10"
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-brand-emerald text-xs"
                    value={studentForm.age}
                    onChange={e => setStudentForm({ ...studentForm, age: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Class</label>
                    <select
                      required
                      className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-2.5 text-white outline-none focus:border-brand-emerald text-[11px] font-medium"
                      value={studentForm.studentClass}
                      onChange={e => setStudentForm({ ...studentForm, studentClass: e.target.value })}
                    >
                      <option value="">Class</option>
                      {["Pre-KG", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map(cls => (
                         <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Section</label>
                    <select
                      required
                      className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-2.5 text-white outline-none focus:border-brand-emerald text-[11px] font-medium"
                      value={studentForm.section}
                      onChange={e => setStudentForm({ ...studentForm, section: e.target.value })}
                    >
                      <option value="">Sec</option>
                      {["A", "B", "C", "D", "E"].map(sec => (
                         <option key={sec} value={sec}>{sec}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-end pt-3">
                <button 
                  type="button"
                  onClick={() => navigate('/weekly-menu')}
                  className="w-full sm:w-auto justify-center bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 font-bold px-5 py-2.5 rounded-lg text-[10px] tracking-wider uppercase transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-blue-400" /> Back to Menu
                </button>
                {isEditingStudent && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setStudentForm({ name: '', age: '', rollNo: '', studentClass: '', section: '' });
                      setIsEditingStudent(null);
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 justify-center rounded-lg text-[10px] tracking-wider uppercase font-bold text-gray-400 hover:text-white bg-white/5 border border-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button type="submit" className="w-full sm:w-auto justify-center bg-brand-emerald hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-lg text-[10px] tracking-wider uppercase transition-colors cursor-pointer inline-flex items-center gap-1.5 focus:ring-2 focus:ring-emerald-500/50">
                  {isEditingStudent ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {isEditingStudent ? 'Update Details' : 'Add Child'}
                </button>
              </div>
            </form>
          </div>

          {/* Children List */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Registered Children ({students.length})
            </h3>
            
            {students.length === 0 ? (
              <div className="text-center py-10 bg-slate-900/40 border border-white/5 rounded-2xl flex flex-col items-center">
                <AlertCircle className="w-10 h-10 text-orange-500/50 mb-3" />
                <p className="text-gray-400 text-sm">No children profiles found.</p>
                <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">Register a child to activate plans</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {students.map(student => (
                  <div key={student._id || (student as any).id} className="bg-slate-900 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 justify-between sm:items-center group transition-all hover:border-white/20">
                    <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                      <div className="w-10 h-10 rounded-full bg-slate-950 border border-white/10 flex items-center justify-center shrink-0">
                        <UsersIcon className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-sm sm:text-base truncate">{student.name}</h4>
                        <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-widest font-mono">
                          Age {student.age} • Class {student.studentClass} • Sec {student.section}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 self-end sm:self-auto opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300">
                      <button
                        title="Edit profile"
                        onClick={() => {
                          setStudentForm({ 
                            name: student.name,
                            age: (student.age || '').toString(),
                            rollNo: student.rollNo || '',
                            studentClass: (student as any).grade || student.studentClass || '',
                            section: student.section || ''
                          });
                          setIsEditingStudent(student._id || (student as any).id);
                        }}
                        className="p-2.5 text-gray-450 hover:text-emerald-400 bg-slate-950/60 hover:bg-slate-950 rounded-lg transition-all cursor-pointer border border-white/5"
                      >
                        <Edit2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                      </button>
                      <button
                        title="Delete profile"
                        onClick={() => handleDeleteStudent(student._id || (student as any).id)}
                        className="p-2.5 text-gray-450 hover:text-rose-500 bg-slate-950/60 hover:bg-slate-950 rounded-lg transition-all cursor-pointer border border-white/5"
                      >
                        <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
