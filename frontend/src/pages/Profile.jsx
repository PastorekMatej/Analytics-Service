import React, { useState, useEffect } from 'react';
import { User, Mail, ShieldCheck, GraduationCap, Star, ChevronRight, Settings, Bell, Search, BookOpen, FileText, Mic, BarChart3, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import authService from '../services/authService';

// --- Types & Constants ---

const ProfileBadge = ({
  children,
  color = 'blue'
}) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100'
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${colors[color]}`}>
      {children}
    </span>
  );
};

const Profile = ({ userEmail, userRole }) => {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      // Load teachers list
      const teachersResponse = await authService.getTeachersList();
      if (teachersResponse.success) {
        setTeachers(teachersResponse.teachers);
      }

      // Load current teacher assignment from localStorage
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      const userData = users[userEmail];
      if (userData && userData.teacherId) {
        setCurrentTeacher(userData.teacherId);
        setSelectedTeacher(userData.teacherId);
      }
    };
    loadData();
  }, [userEmail]);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await authService.assignTeacher(userEmail, selectedTeacher || null);
      
      if (response.success) {
        setSuccess(true);
        setCurrentTeacher(selectedTeacher || null);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Error saving');
    } finally {
      setLoading(false);
    }
  };

  const getTeacherName = (email) => {
    const teacher = teachers.find(t => t.email === email);
    return teacher ? teacher.name : email;
  };

  if (userRole !== 'student') {
    return (
      <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">My Profile</h1>
              <p className="text-sm text-slate-500">Restricted access</p>
            </div>
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Restricted Access</h2>
                    <p className="text-sm text-slate-500">Teachers do not have access to this profile page.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header Section */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search settings..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all hover:bg-white" 
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-500 font-medium">Last Updated</p>
              <p className="text-sm font-semibold text-slate-800">{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <button className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-lg transition-all active:scale-95">
              Edit Profile
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="p-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">My Profile</h1>
            <p className="text-sm text-slate-500">Manage your personal information, security settings, and learning preferences</p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Account Information Card */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: 0.1 }} 
              className="lg:col-span-7"
            >
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden h-full">
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                      <User size={24} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">Account Information</h2>
                      <p className="text-sm text-slate-500">Your private data and identity details</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:border-indigo-200">
                      <div className="flex items-center gap-3 mb-2 text-slate-400">
                        <Mail size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">Email Address</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700 font-medium text-lg">{userEmail}</span>
                        <button className="text-indigo-600 text-sm font-semibold hover:underline">Change</button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3 mb-3 text-slate-400">
                          <ShieldCheck size={16} />
                          <span className="text-xs font-bold uppercase tracking-widest">Role</span>
                        </div>
                        <ProfileBadge color="blue">Student</ProfileBadge>
                      </div>

                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3 mb-3 text-slate-400">
                          <Star size={16} />
                          <span className="text-xs font-bold uppercase tracking-widest">Plan</span>
                        </div>
                        <ProfileBadge color="green">Free Account</ProfileBadge>
                      </div>
                    </div>

                    <div className="pt-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                          <Bell size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700">Email Notifications</p>
                          <p className="text-xs text-slate-400">Weekly progress reports</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setNotifications(!notifications)} 
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${notifications ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out transform ${notifications ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Teacher Selection Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: 0.2 }} 
              className="lg:col-span-5"
            >
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden h-full">
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                      <GraduationCap size={24} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">My Teacher</h2>
                      <p className="text-sm text-slate-500">Personalized tracking and feedback</p>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-sm flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      Changes saved successfully!
                    </div>
                  )}

                  <AnimatePresence mode="wait">
                    {!currentTeacher ? (
                      <motion.div 
                        key="empty" 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="text-center py-10 px-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 mb-8"
                      >
                        <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4 text-slate-300">
                          <Search size={32} />
                        </div>
                        <h3 className="font-bold text-slate-700 text-lg mb-2">No Teacher Assigned</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                          Select a mentor from the list below to share your progress and receive expert guidance.
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="assigned" 
                        initial={{ opacity: 0, scale: 0.95 }} 
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 mb-8 flex items-center gap-4"
                      >
                        <div className="w-14 h-14 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 text-xl font-bold">
                          {getTeacherName(currentTeacher).charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="text-emerald-800 font-bold text-lg">{getTeacherName(currentTeacher)}</p>
                          <p className="text-emerald-600 text-sm flex items-center gap-1">
                            <CheckCircle2 size={14} /> Active Connection
                          </p>
                        </div>
                        <button 
                          onClick={() => {
                            setSelectedTeacher('');
                            setCurrentTeacher(null);
                          }} 
                          className="p-2 text-emerald-400 hover:text-emerald-600 transition-colors"
                        >
                          <Settings size={20} />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Select Teacher</label>
                    <div className="relative group">
                      <select 
                        className="w-full h-14 pl-5 pr-12 rounded-2xl bg-slate-50 border border-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-700 font-medium cursor-pointer group-hover:bg-white" 
                        value={selectedTeacher} 
                        onChange={e => setSelectedTeacher(e.target.value)}
                      >
                        <option value="">Choose from list...</option>
                        {teachers.map((teacher) => (
                          <option key={teacher.email} value={teacher.email}>
                            {teacher.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronRight size={20} className="rotate-90" />
                      </div>
                    </div>
                    <button 
                      className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed" 
                      disabled={!selectedTeacher || loading || selectedTeacher === currentTeacher} 
                      onClick={handleSave}
                    >
                      {loading ? 'Saving...' : 'Confirm Assignment'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
