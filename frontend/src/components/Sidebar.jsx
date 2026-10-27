import React from 'react';
import { Home, FileText, Upload, Clock, Settings, LogOut } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, user, onLogout }) {
  const navItems = [
    { id: 'upload', label: 'Upload Document', icon: Upload, badge: 'New' },
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'reports', label: 'My Reports', icon: FileText },
    { id: 'history', label: 'Health History', icon: Clock },
    { id: 'settings', label: 'Settings & Profile', icon: Settings },
  ];

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 flex-shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Navigation list */}
      <nav className="space-y-1.5">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all text-left cursor-pointer ${
                isActive
                  ? 'bg-teal-50 text-teal-800 font-bold shadow-xs border border-teal-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-teal-700' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && !isActive && (
                <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Authenticated User Account Footer Card */}
      <div className="pt-4 border-t border-slate-100 space-y-2">
        <div 
          onClick={() => setActiveTab('settings')}
          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-200"
        >
          <div className="w-9 h-9 rounded-full bg-teal-50 ring-2 ring-teal-500/20 text-teal-800 flex items-center justify-center font-bold text-xs flex-shrink-0">
            {getInitials(user?.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 truncate">
              {user?.name || 'Verified Patient'}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {user?.email || 'View Profile'}
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
