import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, User, ArrowRight, Activity } from 'lucide-react';

export default function LoginView({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('1990-05-15');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    if (isSignUp && !name) {
      setError('Please provide your full name.');
      return;
    }

    setLoading(true);

    // Simulate real auth handshake and store user profile
    setTimeout(() => {
      const userProfile = {
        name: isSignUp ? name.trim() : (email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())),
        email: email.trim(),
        dob: dob || '1990-05-15',
        accountStatus: 'Active • Verified Medical Account',
        loginTime: new Date().toISOString(),
      };

      localStorage.setItem('medlens_user', JSON.stringify(userProfile));
      setLoading(false);
      onLoginSuccess(userProfile);
    }, 400);
  };

  const handleQuickAccess = (userRole) => {
    const profile = userRole === 'john' ? {
      name: 'John Doe',
      email: 'john.doe@healthportal.org',
      dob: '1985-08-22',
      accountStatus: 'Active • Verified Patient',
      loginTime: new Date().toISOString(),
    } : {
      name: 'Sarah Jenkins',
      email: 's.jenkins@healthrecord.io',
      dob: '1992-11-04',
      accountStatus: 'Active • Verified Patient',
      loginTime: new Date().toISOString(),
    };

    localStorage.setItem('medlens_user', JSON.stringify(profile));
    onLoginSuccess(profile);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background Decorative Gradient Blobs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-teal-100/60 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-800 to-teal-600 text-white shadow-lg shadow-teal-700/20 mb-3">
            <Activity className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            MedLens AI
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Clinical Document Analysis & Plain-Language Explanations
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-card space-y-6">
          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setError(''); }}
              className={`flex-1 pb-3 text-xs sm:text-sm font-semibold transition-colors relative ${
                !isSignUp ? 'text-teal-800 border-b-2 border-teal-700' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setError(''); }}
              className={`flex-1 pb-3 text-xs sm:text-sm font-semibold transition-colors relative ${
                isSignUp ? 'text-teal-800 border-b-2 border-teal-700' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:bg-white transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:bg-white transition-all"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-sm shadow-teal-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>{loading ? 'Authenticating...' : (isSignUp ? 'Create Patient Profile & Upload' : 'Sign In & Upload Document')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Sign-in Shortcuts for convenience */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 text-center">
              Quick access accounts
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickAccess('john')}
                className="p-2 border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 rounded-xl text-left transition-all group"
              >
                <div className="text-xs font-semibold text-slate-800 group-hover:text-teal-900">John Doe</div>
                <div className="text-[10px] text-slate-400 truncate">john.doe@healthportal.org</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickAccess('sarah')}
                className="p-2 border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 rounded-xl text-left transition-all group"
              >
                <div className="text-xs font-semibold text-slate-800 group-hover:text-teal-900">Sarah Jenkins</div>
                <div className="text-[10px] text-slate-400 truncate">s.jenkins@healthrecord.io</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security / HIPAA badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Encrypted patient portal • Protected health information</span>
        </div>
      </div>
    </div>
  );
}
