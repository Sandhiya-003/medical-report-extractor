import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles, ArrowRight, ShieldCheck, FileCheck, Trash2, Clock, RotateCcw } from 'lucide-react';
import FormattedSummary from './FormattedSummary';
import { renderFormattedText } from '../utils/textFormatter';
import { uploadAndAnalyzeReport, analyzeBundledSample } from '../api';

export default function UploadView({ onReportAnalyzed, onDeleteReport, onNavigateToReports }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTitle, setProcessingTitle] = useState("Processing Document");
  const [progressStep, setProgressStep] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);
  const [analyzedResult, setAnalyzedResult] = useState(null);

  const steps = [
    { title: "Document Ingestion", desc: "Reading document stream & verifying page resolution..." },
    { title: "Optical Character Recognition", desc: "Transcribing clinical text, markers, and tabular data..." },
    { title: "Biomedical Extraction", desc: "Extracting clinical entities, test markers, values, units & reference ranges..." },
    { title: "Schema Normalization", desc: "Canonicalizing test names and standardizing units (e.g. mg/dL, g/L)..." },
    { title: "Gemini Plain-Language Summary", desc: "Formulating grounded patient explanation via Google Gemini LLM..." },
  ];

  // Elapsed seconds timer during processing
  useEffect(() => {
    let timer;
    if (isProcessing) {
      timer = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isProcessing]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (file) => {
    const validExtensions = ['.pdf', '.png', '.jpg', '.jpeg'];
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(ext)) {
      setErrorMessage(`Unsupported format '${ext}'. Please choose a PDF, PNG, or JPG report.`);
      return;
    }
    setSelectedFile(file);
    setErrorMessage(null);
    setAnalyzedResult(null);
  };

  const startAnalysis = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProcessingTitle(`Processing ${selectedFile.name}`);
    setErrorMessage(null);
    setProgressStep(0);
    setAnalyzedResult(null);

    const stepInterval = setInterval(() => {
      setProgressStep(prev => (prev < 4 ? prev + 1 : prev));
    }, 1500);

    try {
      const result = await uploadAndAnalyzeReport(selectedFile);
      clearInterval(stepInterval);
      setProgressStep(5);
      setIsProcessing(false);
      setAnalyzedResult(result);
      if (onReportAnalyzed) {
        onReportAnalyzed(result);
      }
    } catch (err) {
      clearInterval(stepInterval);
      setIsProcessing(false);
      setErrorMessage(err.message || "Failed to analyze document. Ensure the file contains readable medical text.");
    }
  };

  const startSampleAnalysis = async (relativePath, displayName) => {
    setIsProcessing(true);
    setProcessingTitle(`Processing Sample: ${displayName}`);
    setErrorMessage(null);
    setProgressStep(0);
    setAnalyzedResult(null);

    const stepInterval = setInterval(() => {
      setProgressStep(prev => (prev < 4 ? prev + 1 : prev));
    }, 1200);

    try {
      const result = await analyzeBundledSample(relativePath);
      clearInterval(stepInterval);
      setProgressStep(5);
      setIsProcessing(false);
      setAnalyzedResult(result);
      if (onReportAnalyzed) {
        onReportAnalyzed(result);
      }
    } catch (err) {
      clearInterval(stepInterval);
      setIsProcessing(false);
      setErrorMessage(err.message || "Failed to analyze sample document.");
    }
  };

  const handleDeleteCurrentResult = () => {
    if (!analyzedResult) return;
    if (window.confirm(`Delete "${analyzedResult.title}" from your reports?`)) {
      if (onDeleteReport) {
        onDeleteReport(analyzedResult.id);
      }
      setAnalyzedResult(null);
      setSelectedFile(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-7 pb-16">
      {/* Top Header */}
      <div className="pt-2">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-teal-800 uppercase bg-teal-50 border border-teal-200/60 px-2.5 py-0.5 rounded-full mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse"></span>
          Document Processing Engine
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Upload Medical Document
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          Select or drag-and-drop your medical report. Our pipeline classifies, normalizes, and extracts findings in real time.
        </p>
      </div>

      {/* REAL-TIME RESULT DISPLAY (Shown as soon as processing completes) */}
      {analyzedResult && !isProcessing && (
        <div className="bg-white border-2 border-teal-600 rounded-2xl p-6 sm:p-8 shadow-card space-y-6 animate-fadeIn">
          {/* Result Header & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  Real-Time Summary Ready
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Ref: {analyzedResult.lab_reference || '#VERIFIED'}
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {analyzedResult.title}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Source: <span className="font-semibold text-slate-700">{analyzedResult.filename}</span> • {analyzedResult.created_at} • {analyzedResult.provider}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
              <button
                type="button"
                onClick={() => onNavigateToReports && onNavigateToReports()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-xl shadow-sm shadow-teal-700/20 transition-all cursor-pointer"
              >
                <span>View Full Explanation</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleDeleteCurrentResult}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                title="Delete this document"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>Delete</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAnalyzedResult(null);
                  setSelectedFile(null);
                }}
                className="inline-flex items-center gap-1 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Upload Another</span>
              </button>
            </div>
          </div>

          {/* Real-Time Gemini Summary Card */}
          <div className="bg-teal-50/70 border border-teal-200/80 rounded-xl p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-900">
                <Sparkles className="w-4 h-4 text-teal-700" />
                <span>Grounded Clinical Explanation (Gemini LLM)</span>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                analyzedResult.is_overall_normal
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {analyzedResult.status_badge || (analyzedResult.is_overall_normal ? 'Normal overall' : 'Review recommended')}
              </span>
            </div>

            <div className="bg-white/70 p-4 rounded-lg border border-teal-100">
              <FormattedSummary text={analyzedResult.summary || analyzedResult.summary_normal_callout} />
            </div>

            {/* Smart Callouts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-white p-3.5 rounded-lg border border-teal-100">
                <p className="text-[11px] font-bold text-teal-800 uppercase tracking-wider mb-1">What Looks Normal</p>
                <p className="text-xs text-slate-600 leading-relaxed">{renderFormattedText(analyzedResult.summary_normal_callout || "Key evaluated markers align with expected intervals.")}</p>
              </div>
              <div className="bg-white p-3.5 rounded-lg border border-amber-100">
                <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-1">What May Need Attention</p>
                <p className="text-xs text-slate-600 leading-relaxed">{renderFormattedText(analyzedResult.summary_attention_callout || "No high-priority clinical exceptions flagged.")}</p>
              </div>
            </div>
          </div>

          {/* Extracted Biomarkers / Items */}
          {Array.isArray(analyzedResult.normalized) && analyzedResult.normalized.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Extracted Biomedical Findings ({analyzedResult.normalized.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {analyzedResult.normalized.slice(0, 6).map((item, idx) => {
                  const name = item.canonical_test_name || item.test_name || item.canonical_drug_name || item.drug_name || 'Marker';
                  const isFlagged = (item.flag || '').toLowerCase() !== 'normal' && Boolean(item.flag);
                  return (
                    <div key={idx} className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 truncate">{name}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isFlagged ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {item.flag || 'Normal'}
                        </span>
                      </div>
                      <div className="text-sm font-extrabold text-slate-900">
                        {item.value ? `${item.value} ${item.unit || ''}` : (item.dosage || 'Documented')}
                      </div>
                      {item.reference_range && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          Ref: {item.reference_range}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Upload Card (Shown when not viewing completed result) */}
      {(!analyzedResult || isProcessing) && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-card space-y-6">
          {isProcessing ? (
            /* Processing State with Live Elapsed Seconds */
            <div className="py-10 text-center space-y-6 max-w-lg mx-auto">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-md shadow-teal-700/10">
                <Sparkles className="w-8 h-8 animate-pulse text-teal-700" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {processingTitle}
                </h2>
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mt-1">
                  <Clock className="w-3.5 h-3.5 text-teal-600 animate-spin" />
                  <span>Analyzing document in real time... ({elapsedSeconds}s elapsed)</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-teal-600 h-full transition-all duration-700 rounded-full"
                  style={{ width: `${Math.min(((progressStep + 1) / 5) * 100, 100)}%` }}
                ></div>
              </div>

              {/* Current Step Description */}
              <div className="bg-teal-50/60 border border-teal-100/80 rounded-xl p-4 text-left">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-900 mb-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-700 flex-shrink-0" />
                  <span>{steps[Math.min(progressStep, 4)].title}</span>
                </div>
                <p className="text-xs text-slate-600 pl-5">
                  {steps[Math.min(progressStep, 4)].desc}
                </p>
                {elapsedSeconds > 10 && (
                  <p className="text-[11px] text-teal-700 font-medium pl-5 mt-1 animate-pulse">
                    ⚡ Querying Google Gemini AI for grounded patient summary...
                  </p>
                )}
              </div>

              <div className="text-[11px] text-slate-400">
                Powered by PyMuPDF, Tesseract / Gemini Vision OCR, scispaCy & Google Gemini 3.5
              </div>
            </div>
          ) : (
            /* Idle / File Selection State */
            <div className="space-y-6">
              {/* Drag & Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('primary-file-input').click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
                  dragActive
                    ? 'border-teal-500 bg-teal-50/50 scale-[0.99]'
                    : 'border-slate-200 hover:border-teal-400 hover:bg-slate-50/60'
                }`}
              >
                <input
                  id="primary-file-input"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelected(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center">
                  <Upload className="w-7 h-7 text-teal-700" />
                </div>

                {selectedFile ? (
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 border border-teal-200 rounded-lg text-xs font-bold text-teal-800">
                      <FileCheck className="w-4 h-4 text-teal-600" />
                      <span>{selectedFile.name}</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {((selectedFile.size || 0) / 1024).toFixed(1)} KB • Click or drop another file to replace
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <p className="text-sm font-bold text-slate-800">
                      Click to choose a medical file or drag and drop
                    </p>
                    <p className="text-xs text-slate-400">
                      Accepted formats: PDF, PNG, JPG (digital exports or scanned pages)
                    </p>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <span>Private & confidential • Direct client-to-API transmission</span>
                </div>

                <button
                  type="button"
                  disabled={!selectedFile}
                  onClick={startAnalysis}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all ${
                    selectedFile
                      ? 'bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white shadow-teal-700/20 cursor-pointer'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  }`}
                >
                  <span>Extract & Explain Report</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Quick-test Sample Reports */}
              <div className="pt-4 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    Or quick-test with verified clinical samples:
                  </span>
                  <span className="text-[11px] text-slate-400">Instant 1-click analysis</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => startSampleAnalysis("data/samples/lab/digital_lab_sample.pdf", "Lab Report")}
                    className="flex items-center gap-2 p-2.5 text-left rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-teal-50/60 hover:border-teal-300 transition-all cursor-pointer group"
                  >
                    <FileText className="w-4 h-4 text-teal-700 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">Lab Report (CBC)</p>
                      <p className="text-[10px] text-slate-400 truncate font-mono">digital_lab_sample.pdf</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => startSampleAnalysis("data/samples/prescription/prescription_sample.pdf", "Prescription")}
                    className="flex items-center gap-2 p-2.5 text-left rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-teal-50/60 hover:border-teal-300 transition-all cursor-pointer group"
                  >
                    <FileCheck className="w-4 h-4 text-teal-700 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">Prescription (Printed)</p>
                      <p className="text-[10px] text-slate-400 truncate font-mono">prescription_sample.pdf</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => startSampleAnalysis("data/samples/prescription/handwritten_rx_sample.png", "Handwritten Prescription")}
                    className="flex items-center gap-2 p-2.5 text-left rounded-xl border border-teal-200 bg-teal-50/40 hover:bg-teal-50/90 hover:border-teal-400 transition-all cursor-pointer group"
                  >
                    <Sparkles className="w-4 h-4 text-teal-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-teal-900 truncate">Handwritten Doctor Rx</p>
                      <p className="text-[10px] text-teal-600 truncate font-mono">handwritten_rx_sample.png</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => startSampleAnalysis("data/samples/discharge/digital_sample.pdf", "Discharge Summary")}
                    className="flex items-center gap-2 p-2.5 text-left rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-teal-50/60 hover:border-teal-300 transition-all cursor-pointer group"
                  >
                    <CheckCircle2 className="w-4 h-4 text-teal-700 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">Discharge Summary</p>
                      <p className="text-[10px] text-slate-400 truncate font-mono">digital_sample.pdf</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Information Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-1.5 shadow-card">
          <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-600"></span>
            1. Document Types
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Automatically detects Blood Work / Lab Panels, Prescription Scripts, and Hospital Discharge Summaries.
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-1.5 shadow-card">
          <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-600"></span>
            2. Medical Normalization
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Translates noisy abbreviations and units to verified LOINC/RxNorm canonical health terms.
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-1.5 shadow-card">
          <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-600"></span>
            3. Grounded Plain English
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Google Gemini explains the findings without making speculative clinical diagnoses.
          </p>
        </div>
      </div>
    </div>
  );
}
