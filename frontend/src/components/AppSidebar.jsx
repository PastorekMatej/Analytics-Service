import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, User, FileText, Mic, BarChart3, LayoutDashboard, GraduationCap, LogOut, CheckCircle, Activity } from 'lucide-react';
import authService from '../services/authService';

const AppSidebar = ({ userEmail, userRole, onLogout }) => {
  const location = useLocation();
  
  // Navigation items based on user role
  const studentNavItems = [
    { id: 'written-analysis', label: 'My Writing', icon: FileText, path: '/written-analysis' },
    { id: 'oral-analysis', label: 'My Voice', icon: Mic, path: '/oral-analysis' },
    { id: 'progress', label: 'My Progress', icon: BarChart3, path: '/progress' },
    { id: 'analytics', label: 'Analytics', icon: Activity, path: '/analytics' },
    { id: 'corrections', label: 'Corrections', icon: CheckCircle, path: '/corrections' },
    { id: 'profile', label: 'My Profile', icon: User, path: '/profile' }
  ];

  const teacherAdminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'progress', label: 'Student Progress', icon: GraduationCap, path: '/progress' },
    { id: 'analytics', label: 'Analytics', icon: Activity, path: '/analytics' },
    { id: 'corrections', label: 'Corrections', icon: CheckCircle, path: '/corrections' },
    { id: 'profile', label: 'My Profile', icon: User, path: '/profile' }
  ];

  const navItems = (userRole === 'student') ? studentNavItems : teacherAdminNavItems;

  const handleLogoutClick = async () => {
    await authService.logout();
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <BookOpen className="text-white w-6 h-6" />
          </div>
          <span className="font-bold text-xl text-slate-800 tracking-tight">ProfÉlite</span>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => (
          <Link
            key={item.id}
            to={item.path}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              location.pathname === item.path
                ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-300 overflow-hidden">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userEmail ? userEmail.split('@')[0] : 'User'}`} alt="Profile" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">{userEmail ? userEmail.split('@')[0] : 'User'}</p>
              <p className="text-[10px] text-slate-500 uppercase font-medium">{userRole}</p>
            </div>
          </div>
          <button
            onClick={handleLogoutClick}
            className="text-slate-400 hover:text-indigo-600 transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
