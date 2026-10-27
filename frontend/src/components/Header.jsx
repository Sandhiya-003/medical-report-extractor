import React from 'react';
import { Lock, LogOut, Upload, Activity } from 'lucide-react';

export default function Header({ 
  user, 
  onLogout, 
  onNavigateUpload, 
  onNavigateSettings,
  _labReference = "#883921-A" 
}) {
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-800 to-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-700/20 flex-shrink-0">
          <Activity className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg leading-tight">
              MedLens AI
            </span>
            <span className="text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200/70">
              Clinical
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium leading-none mt-0.5 hidden xs:block">
            Medical Report Understanding & Plain-Language Summary
          </p>
        </div>
      </div>

      {/* Middle Security Statement Banner (Desktop) */}
      <div className="hidden lg:flex items-center gap-2 text-xs text-teal-800 bg-teal-50/80 border border-teal-200/60 px-3.5 py-1.5 rounded-full font-medium">
        <Lock className="w-3.5 h-3.5 text-teal-700 flex-shrink-0" />
        <span>End-to-End Encrypted Patient Records</span>
      </div>

      {/* Right Controls: Upload Action, Profile & Logout */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          onClick={onNavigateUpload}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-xs font-semibold rounded-lg shadow-sm shadow-teal-700/20 transition-all cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Upload Report</span>
        </button>

        {/* User Pill */}
        {user && (
          <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
            <div 
              onClick={onNavigateSettings}
              className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity"
              title="Open Settings & Profile"
            >
              <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-200 text-teal-800 font-bold text-xs flex items-center justify-center flex-shrink-0">
                {getInitials(user.name)}
              </div>
              <div className="hidden md:block text-left min-w-0 max-w-[130px]">
                <div className="text-xs font-bold text-slate-800 truncate">{user.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
