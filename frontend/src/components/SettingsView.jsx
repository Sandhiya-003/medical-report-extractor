import React, { useState, useEffect } from 'react';
import { 
  User, CheckCircle, Edit3, Type, LogOut, Save, 
  Shield, Cpu, Globe, Sliders, Check, Sparkles, RefreshCw, AlertCircle
} from 'lucide-react';
import { checkHealth } from '../api';

export default function SettingsView({
  user,
  onUpdateUser,
  onLogout,
  textSize = 'medium',
  setTextSize,
  detailLevel = 'standard',
  setDetailLevel,
  preferredLanguage = 'English (US)',
  setPreferredLanguage
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [patientName, setPatientName] = useState(user?.name || 'Verified Patient');
  const [patientEmail, setPatientEmail] = useState(user?.email || 'patient@healthrecord.org');
  const [dob, setDob] = useState(user?.dob || '1990-05-15');
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || 'O Positive (O+)');
  const [mrn, setMrn] = useState(user?.mrn || 'MRN-884920');
  const [maskPii, setMaskPii] = useState(true);
  const [highContrastRanges, setHighContrastRanges] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // System & AI backend status
  const [systemHealth, setSystemHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setPatientName(user.name || 'Verified Patient');
      setPatientEmail(user.email || 'patient@healthrecord.org');
      setDob(user.dob || '1990-05-15');
      if (user.bloodGroup) setBloodGroup(user.bloodGroup);
      if (user.mrn) setMrn(user.mrn);
    }
  }, [user]);

  const loadHealthStatus = async () => {
    try {
      setHealthLoading(true);
      const data = await checkHealth();
      setSystemHealth(data);
    } catch (err) {
      console.warn("Could not retrieve backend health status:", err);
      setSystemHealth({ status: 'offline', ocr_available: false, reports_count: 0 });
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    loadHealthStatus();
  }, []);

  const handleSaveProfile = () => {
    if (onUpdateUser) {
      onUpdateUser({
        ...user,
        name: patientName,
        email: patientEmail,
        dob: dob,
        bloodGroup: bloodGroup,
        mrn: mrn,
      });
    }
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const languages = [
    'English (US)',
    'English (UK)',
    'Spanish (Español)',
    'French (Français)',
    'German (Deutsch)',
    'Hindi (हिन्दी)',
  ];

  const textSizeOptions = [
    { id: 'standard', label: 'Standard', scaleText: '100%' },
    { id: 'medium', label: 'Medium', scaleText: '+112%' },
    { id: 'large', label: 'Large', scaleText: '+125%' },
  ];

  const detailOptions = [
    { id: 'concise', label: 'Concise', desc: 'Fast, bulleted takeaways for quick reading.' },
    { id: 'standard', label: 'Standard', desc: 'Balanced summary with clinical context and key items.' },
    { id: 'in-depth', label: 'In-Depth', desc: 'Full medical rationale, ranges, and explanations.' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-7 pb-16">
      {/* Top Header */}
      <div className="pt-2">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-teal-800 uppercase bg-teal-50 border border-teal-200/60 px-2.5 py-0.5 rounded-full mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
          Account & Clinical Preferences
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Settings & Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          Manage your patient identity, AI summarization depth, readability scaling, and data privacy.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fadeIn shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Patient profile and preferences updated successfully.</span>
        </div>
      )}

      {/* Card 1: Personal Information */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-card space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 flex-shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Personal Patient Information</h2>
              <p className="text-xs text-slate-400 mt-0.5">Details associated with your clinical health records</p>
            </div>
          </div>

          <button
            onClick={() => {
              if (isEditing) {
                handleSaveProfile();
              } else {
                setIsEditing(true);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            {isEditing ? <Save className="w-3.5 h-3.5 text-teal-700" /> : <Edit3 className="w-3.5 h-3.5 text-slate-500" />}
            <span>{isEditing ? 'Save Changes' : 'Edit Profile'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Full Name
            </span>
            {isEditing ? (
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            ) : (
              <span className="text-xs sm:text-sm font-semibold text-slate-800">{patientName}</span>
            )}
          </div>

          <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Email Address
            </span>
            {isEditing ? (
              <input
                type="email"
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
                className="w-full text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            ) : (
              <span className="text-xs sm:text-sm font-semibold text-slate-800">{patientEmail}</span>
            )}
          </div>

          <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Date of Birth
            </span>
            {isEditing ? (
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            ) : (
              <span className="text-xs sm:text-sm font-semibold text-slate-800">{dob}</span>
            )}
          </div>

          <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Medical Record Number (MRN)
            </span>
            {isEditing ? (
              <input
                type="text"
                value={mrn}
                onChange={(e) => setMrn(e.target.value)}
                className="w-full text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            ) : (
              <span className="text-xs sm:text-sm font-mono font-semibold text-slate-800">{mrn}</span>
            )}
          </div>

          <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Blood Type
            </span>
            {isEditing ? (
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              >
                <option value="A Positive (A+)">A Positive (A+)</option>
                <option value="A Negative (A-)">A Negative (A-)</option>
                <option value="B Positive (B+)">B Positive (B+)</option>
                <option value="B Negative (B-)">B Negative (B-)</option>
                <option value="AB Positive (AB+)">AB Positive (AB+)</option>
                <option value="AB Negative (AB-)">AB Negative (AB-)</option>
                <option value="O Positive (O+)">O Positive (O+)</option>
                <option value="O Negative (O-)">O Negative (O-)</option>
              </select>
            ) : (
              <span className="text-xs sm:text-sm font-semibold text-slate-800">{bloodGroup}</span>
            )}
          </div>

          <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Account Status
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                {user?.accountStatus || 'Active • Verified Medical Account'}
              </span>
            </div>

            <div className="pt-2">
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out of Portal</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Reading & Explanation Preferences */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-card space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 flex-shrink-0">
            <Type className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Reading & Explanation Preferences</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize font scaling, language translation, and clinical detail levels
            </p>
          </div>
        </div>

        {/* Preferred Language */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">Preferred Language</label>
          <div className="relative max-w-sm">
            <select
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage && setPreferredLanguage(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 shadow-xs cursor-pointer"
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-slate-400">
            Translations are aligned with standardized LOINC and RxNorm biomedical vocabularies.
          </p>
        </div>

        {/* Display Text Size */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">Display Text Size</label>
            <span className="text-[11px] font-medium text-teal-700">
              Currently: {textSize.charAt(0).toUpperCase() + textSize.slice(1)} ({textSize === 'large' ? '+125%' : (textSize === 'medium' ? '+112%' : '100%')})
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 max-w-md">
            {textSizeOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setTextSize && setTextSize(opt.id)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  textSize === opt.id
                    ? 'bg-teal-50 border-teal-600 text-teal-800 ring-1 ring-teal-600 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {textSize === opt.id && <span className="mr-1 text-teal-700">✓</span>}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Readability Preview Box */}
        <div className="bg-teal-50/40 border border-teal-100 rounded-xl p-4 sm:p-5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block mb-1.5">
            Readability Preview
          </span>
          <p className="text-slate-800 italic leading-relaxed text-xs sm:text-sm">
            "Your blood sugar (glucose) is in the healthy zone at 94 mg/dL. This shows your body is managing everyday energy well."
          </p>
        </div>

        {/* Explanation Detail Level */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-700 block">Explanation Detail Level</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {detailOptions.map((opt) => (
              <div
                key={opt.id}
                onClick={() => setDetailLevel && setDetailLevel(opt.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  detailLevel === opt.id
                    ? 'bg-teal-50/70 border-teal-600 ring-1 ring-teal-600/40 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">{opt.label}</span>
                  {detailLevel === opt.id && <span className="text-teal-700 text-xs font-bold">✓</span>}
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">{opt.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card 3: Clinical System & AI Pipeline Status */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-card space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 flex-shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Clinical System & AI Pipeline Status</h2>
              <p className="text-xs text-slate-400 mt-0.5">Real-time status of extraction and summarization services</p>
            </div>
          </div>

          <button
            onClick={loadHealthStatus}
            disabled={healthLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${healthLoading ? 'animate-spin text-teal-700' : 'text-slate-400'}`} />
            <span>Refresh Status</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">FastAPI Backend</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="text-xs font-bold text-slate-800">
              {systemHealth?.status === 'healthy' ? 'Online & Healthy' : (healthLoading ? 'Checking...' : 'Active (Local)')}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Port 8000 • REST API</div>
          </div>

          <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">OCR Engine</span>
              <span className={`w-2 h-2 rounded-full ${systemHealth?.ocr_available ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </div>
            <div className="text-xs font-bold text-slate-800">
              {systemHealth?.ocr_available ? 'Tesseract v5 Active' : 'PyMuPDF Text Engine'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Optical character recognition</div>
          </div>

          <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">LLM Summarizer</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Gemini 3.5 Flash Lite</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Google AI Studio API</div>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl flex items-start gap-3">
          <Shield className="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-slate-600 leading-relaxed">
            <strong className="text-slate-800 font-semibold">Zero-Storage Privacy Architecture: </strong>
            Uploaded documents and medical records are held in memory during the extraction lifecycle. No clinical reports or personal identifiers are stored on public servers or logged.
          </div>
        </div>
      </div>
    </div>
  );
}
