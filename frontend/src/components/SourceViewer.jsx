import React, { useEffect, useRef } from 'react';
import { FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SourceViewer({
  sourceText,
  passages = [],
  selectedClaim,
}) {
  const highlightRef = useRef(null);

  // Auto-scroll to highlighted evidence when selectedClaim changes
  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [selectedClaim]);

  if (!sourceText) return null;

  // Determine evidence quotes to highlight from selected claim
  const evidenceQuotes = (selectedClaim?.evidence_quotes || [])
    .map(eq => typeof eq === 'string' ? eq : eq.quote)
    .filter(Boolean);
  const primaryQuote = (selectedClaim?.evidence_quote || evidenceQuotes[0] || '').trim();

  // Verdict-based styling: use claim's own verdict color, never green for contradicted
  const verdict = selectedClaim?.verdict;
  const highlightClass = verdict ? `highlight-${verdict}` : 'highlight-neutral';
  const highlightStyles = {
    SUPPORTED: {
      color: 'var(--color-supported)',
      bg: 'var(--color-supported-bg)',
      border: 'var(--color-supported)',
    },
    CONTRADICTED: {
      color: 'var(--color-contradicted)',
      bg: 'var(--color-contradicted-bg)',
      border: 'var(--color-contradicted)',
    },
    UNSUPPORTED: {
      color: 'var(--color-unsupported)',
      bg: 'var(--color-unsupported-bg)',
      border: 'var(--color-unsupported)',
    },
    AMBIGUOUS: {
      color: 'var(--color-ambiguous)',
      bg: 'var(--color-ambiguous-bg)',
      border: 'var(--color-ambiguous)',
    },
  };
  const activeHighlight = highlightStyles[verdict] || {
    color: 'var(--brand-accent)',
    bg: 'rgba(99, 102, 241, 0.15)',
    border: 'var(--brand-accent)',
  };

  // Find occurrences of the primary evidence quote in sourceText
  let renderedContent = null;
  let quoteFound = false;

  if (primaryQuote && primaryQuote.length > 3) {
    const lowerSource = sourceText.toLowerCase();
    const lowerQuote = primaryQuote.toLowerCase();
    let matchIdx = lowerSource.indexOf(lowerQuote);

    // Fallback 1: Normalized whitespace match
    if (matchIdx === -1) {
      const cleanQuote = lowerQuote.replace(/\s+/g, ' ');
      // Search for first 30 chars of the quote
      const prefix = cleanQuote.slice(0, Math.min(30, cleanQuote.length));
      matchIdx = lowerSource.indexOf(prefix);
    }

    if (matchIdx !== -1) {
      quoteFound = true;
      const matchEnd = Math.min(sourceText.length, matchIdx + primaryQuote.length);
      const before = sourceText.slice(0, matchIdx);
      const matched = sourceText.slice(matchIdx, matchEnd);
      const after = sourceText.slice(matchEnd);

      renderedContent = (
        <>
          <span>{before}</span>
          <mark
            ref={highlightRef}
            className={`evidence-highlight ${highlightClass}`}
            title={`Evidence for Claim: "${selectedClaim.claim}"`}
            style={{
              display: 'inline-block',
              padding: '2px 6px',
              borderRadius: '4px',
              background: activeHighlight.bg,
              borderBottom: `2px solid ${activeHighlight.border}`,
              color: 'var(--text-primary)',
              fontWeight: '500',
            }}
          >
            {matched}
          </mark>
          <span>{after}</span>
        </>
      );
    }
  }

  // Fallback 2: Passage highlight if quote was not directly matched
  if (!quoteFound && selectedClaim?.evidence_passage_id && passages.length > 0) {
    const matchedPassage = passages.find(p => p.passage_id === selectedClaim.evidence_passage_id);
    if (matchedPassage && matchedPassage.text) {
      const pIdx = sourceText.indexOf(matchedPassage.text);
      if (pIdx !== -1) {
        quoteFound = true;
        const before = sourceText.slice(0, pIdx);
        const matched = sourceText.slice(pIdx, pIdx + matchedPassage.text.length);
        const after = sourceText.slice(pIdx + matchedPassage.text.length);
        renderedContent = (
          <>
            <span>{before}</span>
            <mark
              ref={highlightRef}
              className={`evidence-highlight ${highlightClass}`}
              style={{
                display: 'inline-block',
                padding: '3px 6px',
                borderRadius: '4px',
                background: activeHighlight.bg,
                borderBottom: `2px solid ${activeHighlight.border}`,
                color: 'var(--text-primary)',
              }}
            >
              {matched}
            </mark>
            <span>{after}</span>
          </>
        );
      }
    }
  }

  return (
    <div className="glass-panel" style={{ padding: '0', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header with Source Location Reference */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-elevated)',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} style={{ color: 'var(--brand-accent)' }} />
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700', margin: 0 }}>Ground-Truth Source</h3>
          {selectedClaim?.source_location && (
            <span style={{
              fontSize: '0.72rem',
              fontWeight: '600',
              padding: '2px 8px',
              borderRadius: '10px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--brand-accent)',
              fontFamily: 'var(--font-mono)',
            }}>
              {selectedClaim.source_location}
            </span>
          )}
        </div>
        
        {selectedClaim && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
            {quoteFound ? (
              <span style={{ color: activeHighlight.color, display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                <CheckCircle2 size={13} /> Evidence Quote Synchronized
              </span>
            ) : (
              <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={13} /> No Direct Corroboration in Text
              </span>
            )}
          </div>
        )}
      </div>

      {/* Insufficient Evidence State Callout when claim is unsupported */}
      {selectedClaim && selectedClaim.verdict === 'UNSUPPORTED' && !quoteFound && (
        <div style={{
          background: 'var(--color-unsupported-bg)',
          borderBottom: '1px solid var(--color-unsupported-border)',
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          fontSize: '0.8rem',
          color: 'var(--color-unsupported)',
        }}>
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            <strong>Insufficient Source Evidence:</strong> The provided source document does not contain statements establishing this claim. Per auditing integrity standards, absent assertions are labeled <em>UNSUPPORTED</em> rather than falsely marked as contradicted.
          </span>
        </div>
      )}

      {/* Main Source Content */}
      <div style={{
        whiteSpace: 'pre-wrap',
        lineHeight: 1.8,
        fontSize: '0.92rem',
        overflowY: 'auto',
        flex: 1,
        padding: '20px',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-main)',
      }}>
        {renderedContent || <span>{sourceText}</span>}
      </div>
    </div>
  );
}
