import React from 'react';
import { Upload, ArrowRight, Download, CheckCircle, AlertCircle, FileText, ChevronRight, Activity, Trash2 } from 'lucide-react';
import FormattedSummary from './FormattedSummary';
import { renderFormattedText } from '../utils/textFormatter';

export default function HomeView({
  latestReport,
  recentReports = [],
  onOpenUpload,
  onSelectReport,
  onDeleteReport,
  onNavigateToMyReports
}) {
  const isNormal = latestReport?.is_overall_normal ?? true;

  return (
    <div className="max-w-4xl mx-auto space-y-7 pb-12">
      {/* Top Welcome & Upload Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-teal-800 uppercase bg-teal-50 border border-teal-200/60 px-2.5 py-0.5 rounded-full mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse"></span>
            Patient Dashboard
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Understand your health reports, clearly and simply.
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review your extracted medical results and AI-grounded plain-language explanations.
          </p>
        </div>

        <button
          onClick={onOpenUpload}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm shadow-teal-700/20 transition-all flex-shrink-0 cursor-pointer self-start sm:self-center"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Featured Latest Report Card */}
      {latestReport ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-card p-6 sm:p-7 relative overflow-hidden transition-all hover:shadow-card-hover space-y-5">
          {/* Card Header badge & Reference */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                latestReport.id?.startsWith("rep_")
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-teal-50 text-teal-800 border border-teal-200/80'
              }`}>
                {latestReport.id?.startsWith("rep_") ? '✨ Recently Uploaded Report' : 'Latest Report'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {latestReport.filename || 'Processed & Verified'}
              </span>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Ref: {latestReport.lab_reference || '#CBC-883921'}
            </div>
          </div>

          {/* Title & Overall Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                {latestReport.title}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {latestReport.created_at} • {latestReport.provider || 'Diagnostic Clinical Facility'}
              </p>
            </div>
            <div className="flex-shrink-0">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${
                isNormal
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {isNormal ? <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                <span>{latestReport.status_badge || (isNormal ? 'Normal overall' : 'Review recommended')}</span>
              </span>
            </div>
          </div>

          {/* What your results mean */}
          <div className="bg-teal-50/50 border border-teal-100/80 rounded-xl p-4 sm:p-5 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-900">
              <span className="text-teal-600 font-bold">✦</span>
              <span>What your results mean:</span>
            </div>
            <FormattedSummary 
              text={latestReport.summary || latestReport.summary_normal_callout} 
            />
          </div>

          {/* Key Markers At A Glance */}
          {latestReport.key_markers && latestReport.key_markers.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3.5">
                Key Markers At A Glance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {latestReport.key_markers.slice(0, 3).map((marker, i) => (
                  <div key={i} className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-800">{marker.name}</span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          marker.is_normal ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-amber-800 bg-amber-50 border border-amber-200'
                        }`}>
                          {marker.status}
                        </span>
                      </div>
                      <div className="text-base font-extrabold text-slate-900 mt-1">
                        {marker.value}
                      </div>
                    </div>

                    {/* Properly Centered and Aligned Range Slider Visual */}
                    <div className="mt-3.5 relative flex items-center h-4">
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                        <div className="w-3/4 bg-emerald-400"></div>
                        <div className="w-1/4 bg-amber-400"></div>
                      </div>
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
                          marker.is_normal ? 'bg-emerald-600 left-1/2' : 'bg-amber-500 left-[85%]'
                        }`}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Card Actions */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => onNavigateToMyReports(latestReport.id)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
              >
                <span>Read Full Explanation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([latestReport.summary || latestReport.raw_text], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${latestReport.title.replace(/\s+/g, '_')}_Summary.txt`;
                  a.click();
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Download Summary</span>
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Delete "${latestReport.title}"?`)) {
                    if (onDeleteReport) onDeleteReport(latestReport.id);
                  }
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                title="Delete this report"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Source: {latestReport.filename || 'Document'}
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-card p-10 text-center space-y-4">
          <div className="w-14 h-14 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-center text-teal-700 mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">No medical records uploaded yet</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Your account is verified and ready. Upload a lab panel, prescription, or discharge summary to instantly extract, normalize, and explain clinical results.
            </p>
          </div>
          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer mx-auto"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Your First Medical Report</span>
          </button>
        </div>
      )}

      {/* Recent Reports Timeline */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-base font-bold text-slate-900">Recent Reports</h2>
          <button
            onClick={() => onNavigateToMyReports()}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1 cursor-pointer"
          >
            <span>View all reports</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentReports.length > 0 ? (
          <div className="space-y-3">
            {recentReports.map((report) => (
              <div
                key={report.id}
                onClick={() => onSelectReport(report)}
                className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-teal-300 hover:shadow-card transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 flex-shrink-0 group-hover:bg-teal-100/70 transition-colors">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-slate-900 group-hover:text-teal-900 transition-colors">
                        {report.title}
                      </h3>
                      <span className="text-[11px] text-slate-400 font-normal">
                        • {report.created_at} {report.provider ? `• ${report.provider}` : ''}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      {renderFormattedText(report.summary || 'Clinical structured measurements recorded.')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                  <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-full">
                    {report.status_badge || '✓ Optimal'}
                  </span>
                  <span className="text-xs font-semibold text-teal-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    <span>View</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50/70 border border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400">
            {latestReport ? "No prior historical records." : "No reports recorded for this account."}
          </div>
        )}
      </div>
    </div>
  );
}
