import React from 'react';
import { X, Sparkles, CheckCircle } from 'lucide-react';

export default function SummaryExplainerModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-modal max-w-lg w-full overflow-hidden border border-slate-200 animate-fadeIn">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">How was this summary created?</h2>
              <p className="text-xs text-slate-400">MedLens AI clinical information extraction pipeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs text-slate-600 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-teal-50/50 border border-teal-100">
            <h3 className="font-bold text-teal-900 mb-1 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
              Multi-Stage Medical NLP Pipeline
            </h3>
            <p>
              Your uploaded document is processed through a 5-stage pipeline: optical character recognition, document classification, specialized scispaCy biomedical entity recognition, terminology canonicalization (mapping to standardized LOINC & RxNorm lexicons), and large language model translation.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                1
              </div>
              <p>
                <b className="text-slate-900">Direct Value Grounding:</b> Every summary assertion directly cross-references the numerical values and units found in the laboratory report.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                2
              </div>
              <p>
                <b className="text-slate-900">Clinical Reference Bounds:</b> "What looks normal" vs "What may need attention" flags are computed strictly against the laboratory's verified reference intervals.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                3
              </div>
              <p>
                <b className="text-slate-900">Privacy & Confidentiality:</b> No patient identifiers are stored or shared. Information is analyzed ephemeral in-memory.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
            Disclaimer: MedLens AI provides educational plain-language summaries and does not substitute professional clinical diagnosis or physician consultations.
          </div>
        </div>
      </div>
    </div>
  );
}
