import React, { useState } from 'react';
import { Search, ArrowLeftRight, TrendingUp, Info, ChevronDown } from 'lucide-react';

export default function HealthHistoryView({ comparisonData }) {
  const [activeFilter, setActiveFilter] = useState('All Reports');
  const [searchQuery, setSearchQuery] = useState('');

  const filterTabs = ['All Reports', 'Blood Tests', 'Metabolic', 'Allergies'];

  const rows = comparisonData?.rows || [
    {
      test_name: "Hemoglobin",
      tag: "FBC",
      date_1_val: "14.0 g/dL",
      date_2_val: "14.2 g/dL",
      change: "+0.2 g/dL",
      is_increase: true,
      contextual_note: "Both within standard range",
      note_status: "normal"
    },
    {
      test_name: "White Blood Cells",
      tag: "WBC",
      date_1_val: "6.8 x10³/µL",
      date_2_val: "7.2 x10³/µL",
      change: "+0.4 x10³/µL",
      is_increase: true,
      contextual_note: "Both within standard range",
      note_status: "normal"
    },
    {
      test_name: "Platelets",
      tag: "PLT",
      date_1_val: "245 x10³/µL",
      date_2_val: "248 x10³/µL",
      change: "+3 x10³/µL",
      is_increase: true,
      contextual_note: "Steady within normal interval",
      note_status: "normal"
    },
    {
      test_name: "Eosinophils",
      tag: "DIFF",
      date_1_val: "4.8 %",
      date_2_val: "6.1 %",
      change: "+1.3 %",
      is_increase: true,
      contextual_note: "Moved slightly above typical interval (commonly related to mild allergies)",
      note_status: "attention"
    }
  ];

  const filteredRows = rows.filter(r =>
    r.test_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-7 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-teal-800 uppercase bg-teal-50 border border-teal-200/60 px-2.5 py-0.5 rounded-full mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
            Patient Longitudinal History
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Health History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Timeline of past medical reports and comparison of matching biomarkers across tests.
          </p>
        </div>

        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex-shrink-0 self-start sm:self-center cursor-pointer">
          <ArrowLeftRight className="w-4 h-4" />
          <span>Compare Selected</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by report name or test (e.g. Hemoglobin, Glucose, WBC)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-xs"
            />
          </div>

          {/* Time range dropdown */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-700 font-medium cursor-pointer shadow-xs hover:border-slate-300 w-full sm:w-auto justify-between">
            <span>All Time (2025 - 2026)</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === tab
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Comparing Reports Section */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-teal-100/70 text-teal-800 flex items-center justify-center">
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">Comparing Reports</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded">
                Verified Alignment
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Complete Blood Count (22 Oct 2026) vs Complete Blood Count (15 Aug 2026)
            </p>
          </div>

          <button className="text-xs font-semibold text-teal-700 hover:text-teal-800 self-start sm:self-center cursor-pointer">
            Change Reports ⇄
          </button>
        </div>

        {/* Disclaimer box */}
        <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-600">
          <Info className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed text-xs">
            Showing changes only for matching tests with comparable units and lab reference standards across accredited facilities.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4 font-semibold">Test Name</th>
                <th className="py-3 px-4 font-semibold">15 Aug 2026</th>
                <th className="py-3 px-4 font-semibold">22 Oct 2026</th>
                <th className="py-3 px-4 font-semibold">Recorded Change</th>
                <th className="py-3 px-4 font-semibold">Contextual Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredRows.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <span>{row.test_name}</span>
                      {row.tag && (
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {row.tag}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">{row.date_1_val}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{row.date_2_val}</td>
                  <td className="py-3.5 px-4 font-semibold">
                    <span className={row.note_status === 'attention' ? 'text-amber-700' : 'text-teal-700'}>
                      {row.change}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        row.note_status === 'attention' ? 'bg-amber-500' : 'bg-teal-600'
                      }`}></span>
                      <span>{row.contextual_note}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Longitudinal Trend Chart & Algorithmic Context */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          {/* Interactive SVG Sparkline */}
          <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs mb-3">
                <div>
                  <span className="font-bold text-slate-800 block">Hemoglobin Multi-Date Trend</span>
                  <span className="text-[10px] text-slate-400">Healthy interval: 12.0 - 15.5 g/dL</span>
                </div>
                <span className="text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded">
                  6 Tests
                </span>
              </div>

              {/* SVG Trend Graph */}
              <div className="h-28 w-full flex items-center justify-center pt-2">
                <svg viewBox="0 0 320 80" className="w-full h-full overflow-visible">
                  <line x1="0" y1="20" x2="320" y2="20" stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="1" />
                  <line x1="0" y1="65" x2="320" y2="65" stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="1" />
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0d9488" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <polygon
                    points="20,50 80,45 140,35 200,40 260,40 310,25 310,75 20,75"
                    fill="url(#trendGrad)"
                  />
                  <polyline
                    fill="none"
                    stroke="#0f766e"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="20,50 80,45 140,35 200,40 260,40 310,25"
                  />
                  <circle cx="20" cy="50" r="3" fill="#0f766e" />
                  <circle cx="80" cy="45" r="3" fill="#0f766e" />
                  <circle cx="140" cy="35" r="3" fill="#0f766e" />
                  <circle cx="200" cy="40" r="3" fill="#0f766e" />
                  <circle cx="260" cy="40" r="3" fill="#0f766e" />
                  <circle cx="310" cy="25" r="4" fill="#0d9488" stroke="#ffffff" strokeWidth="2" />
                </svg>
              </div>
            </div>

            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-2 px-1">
              <span>Mar '25</span>
              <span>Aug '25</span>
              <span>Nov '25</span>
              <span>Mar '26</span>
              <span>Aug '26</span>
              <span className="font-bold text-teal-800">Oct '26 (14.2)</span>
            </div>
          </div>

          {/* Algorithmic Context Box */}
          <div className="bg-teal-50/40 border border-teal-200/60 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900 uppercase tracking-wider mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-teal-700" />
                <span>Algorithmic Context</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-normal">
                {comparisonData?.observations ||
                  "Observations: Recorded values remained steady between these dates. Eosinophils increased slightly in the latest test. Discuss any notable changes with your doctor at your next routine checkup."}
              </p>
            </div>
            <div className="pt-3 text-[11px] text-slate-400 border-t border-teal-100/60 mt-3">
              Evaluated against accredited reference standard CLIA #05D0643921.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
