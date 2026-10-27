import React, { useState, useEffect } from 'react';
import { X, Upload, AlertCircle, Loader2, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { uploadAndAnalyzeReport } from '../api';

export default function UploadModal({ isOpen, onClose, onReportAnalyzed }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);

  const steps = [
    { title: "Document Ingestion", desc: "Reading PDF stream & verifying page resolution..." },
    { title: "Classification & Layout", desc: "Identifying report format (Lab Report, Prescription, or Discharge Summary)..." },
    { title: "Biomedical Extraction", desc: "Extracting clinical entities, test markers, values, units & reference ranges..." },
    { title: "Schema Normalization", desc: "Canonicalizing test names and standardizing units (e.g. mg/dL, g/L)..." },
    { title: "Gemini Plain-Language Summary", desc: "Formulating grounded patient explanation via Google Gemini LLM..." },
  ];

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSelectedFile(null);
      setIsProcessing(false);
      setProgressStep(0);
    }
  }, [isOpen]);

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
  };

  const startAnalysis = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setProgressStep(0);

    const stepInterval = setInterval(() => {
      setProgressStep(prev => (prev < 4 ? prev + 1 : prev));
    }, 1100);

    try {
      const result = await uploadAndAnalyzeReport(selectedFile);
      clearInterval(stepInterval);
      setProgressStep(5);
      setTimeout(() => {
        setIsProcessing(false);
        onReportAnalyzed(result);
        onClose();
      }, 600);
    } catch (err) {
      clearInterval(stepInterval);
      setIsProcessing(false);
      setErrorMessage(err.message || "Failed to analyze document.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-modal max-w-lg w-full overflow-hidden border border-slate-200 animate-fadeIn">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Upload Medical Document</h2>
            <p className="text-xs text-slate-400">PDF, PNG, or JPG medical reports are analyzed securely in real time</p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {isProcessing ? (
            /* Analysis Progress View */
            <div className="py-8 text-center space-y-5">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-sm shadow-teal-700/10">
                <Sparkles className="w-7 h-7 animate-pulse text-teal-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Analyzing Your Report</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  {steps[Math.min(progressStep, 4)].desc}
                </p>
              </div>

              {/* Progress step indicators */}
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden max-w-xs mx-auto">
                <div
                  className="bg-teal-600 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(((progressStep + 1) / 5) * 100, 100)}%` }}
                ></div>
              </div>

              <div className="flex justify-center items-center gap-2 text-xs text-teal-800 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                <span>Running biomedical NLP engine...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Drag and drop zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('modal-file-upload-input').click()}
                className={`border-2 border-dashed rounded-2xl p-7 text-center transition-all cursor-pointer ${
                  dragActive
                    ? 'border-teal-500 bg-teal-50/50'
                    : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50/60'
                }`}
              >
                <input
                  id="modal-file-upload-input"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelected(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-12 h-12 mx-auto rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>

                {selectedFile ? (
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200 inline-block">
                      {selectedFile.name}
                    </span>
                    <p className="text-[11px] text-slate-400">
                      {(selectedFile.size / 1024).toFixed(1)} KB • Ready to extract
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-800">
                      Drag and drop your report here, or <span className="text-teal-700 underline">browse files</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">Supports PDF, PNG, JPG (digital or scanned)</p>
                  </div>
                )}
              </div>

              {/* Error alert */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 font-medium">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>Encrypted processing</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!selectedFile}
                    onClick={startAnalysis}
                    className={`inline-flex items-center gap-1.5 px-4.5 py-2 text-xs font-bold rounded-xl transition-all ${
                      selectedFile
                        ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-sm shadow-teal-700/20 cursor-pointer'
                        : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    }`}
                  >
                    <span>Extract & Explain</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
