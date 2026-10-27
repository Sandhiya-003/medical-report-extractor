import React from 'react';
import { renderFormattedText } from '../utils/textFormatter';

export default function FormattedSummary({ text, className = "" }) {
  if (!text) return null;

  const lines = text.split("\n");
  const blocks = [];
  let currentList = [];

  const flushList = () => {
    if (currentList.length > 0) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="space-y-1.5 my-2.5 pl-1">
          {currentList.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-2 flex-shrink-0" />
              <div className="flex-1">{renderFormattedText(item)}</div>
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }

    // Markdown Headers: ### Title or ## Title
    const headerMatch = trimmed.match(/^#{1,4}\s+(.+)$/);
    if (headerMatch) {
      flushList();
      blocks.push(
        <h4 key={`h-${lineIdx}`} className="font-bold text-slate-900 text-sm sm:text-base mt-3.5 mb-1 flex items-center gap-2">
          {renderFormattedText(headerMatch[1])}
        </h4>
      );
      return;
    }

    // Bullet items: * item, - item, • item
    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) {
      currentList.push(bulletMatch[1]);
      return;
    }

    // Numbered section or items: 1. Title or 1) Title
    const numberedMatch = trimmed.match(/^(\d+[.)])\s+(.+)$/);
    if (numberedMatch) {
      flushList();
      blocks.push(
        <div key={`num-${lineIdx}`} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800 my-2">
          <span className="font-extrabold text-teal-700 flex-shrink-0 bg-teal-50 border border-teal-200/60 rounded px-1.5 py-0.5 text-[11px] leading-tight">
            {numberedMatch[1]}
          </span>
          <div className="flex-1 leading-relaxed">
            {renderFormattedText(numberedMatch[2])}
          </div>
        </div>
      );
      return;
    }

    flushList();
    blocks.push(
      <p key={`p-${lineIdx}`} className="text-xs sm:text-sm text-slate-700 leading-relaxed my-1.5 font-normal">
        {renderFormattedText(trimmed)}
      </p>
    );
  });

  flushList();

  return <div className={`space-y-1 ${className}`}>{blocks}</div>;
}
