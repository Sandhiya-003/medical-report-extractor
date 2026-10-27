import React from 'react';

/**
 * Parses inline markdown for bold (**text**) and italic (*text*),
 * rendering semantically styled React elements without literal asterisks.
 */
export function renderFormattedText(text) {
  if (!text) return null;

  const parts = [];
  // Match bold (**text**) or italic (*text*)
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      const inner = token.slice(2, -2);
      parts.push(
        <strong key={`b-${match.index}`} className="font-bold text-slate-900">
          {inner}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      const inner = token.slice(1, -1);
      parts.push(
        <em key={`i-${match.index}`} className="italic text-slate-800">
          {inner}
        </em>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}
