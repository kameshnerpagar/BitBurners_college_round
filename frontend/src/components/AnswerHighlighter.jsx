import React, { useState } from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';

export default function AnswerHighlighter({
  answerText,
  claims = [],
  selectedClaimId,
  onSelectClaim,
  activeFilterVerdicts = null,
  onlyHumanReview = false,
}) {
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);

  if (!answerText) return null;

  // Determine which claims are "dimmed" vs active
  const claimsWithState = claims.map((c) => {
    let isDimmed = false;
    if (activeFilterVerdicts && activeFilterVerdicts !== 'ALL' && c.verdict !== activeFilterVerdicts) {
      isDimmed = true;
    }
    if (onlyHumanReview && !c.needs_human_review) {
      isDimmed = true;
    }
    if (showOnlyErrors && (c.verdict === 'SUPPORTED' || c.verdict === 'AMBIGUOUS')) {
      isDimmed = true;
    }
    return { ...c, isDimmed };
  });

  const validClaims = claimsWithState.filter(c => c.span && c.span.start !== undefined && c.span.end !== undefined);

  // Sort claims by start character offset
  const sortedClaims = [...validClaims].sort((a, b) => a.span.start - b.span.start);

  // Segment the text into non-overlapping spans
  const segments = [];
  let currentIndex = 0;

  for (const claim of sortedClaims) {
    const start = Math.max(currentIndex, claim.span.start);
    const end = Math.min(answerText.length, claim.span.end);

    if (start > currentIndex) {
      segments.push({
        text: answerText.slice(currentIndex, start),
        isClaim: false,
      });
    }

    if (end > start) {
      segments.push({
        text: answerText.slice(start, end),
        isClaim: true,
        claim,
      });
      currentIndex = end;
    }
  }

  if (currentIndex < answerText.length) {
    segments.push({
      text: answerText.slice(currentIndex),
      isClaim: false,
    });
  }

  return (
    <div className="glass-panel" style={{ padding: '0', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-elevated)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} style={{ color: 'var(--brand-accent)' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>AI-Generated Answer</h3>
        </div>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={showOnlyErrors} 
            onChange={(e) => setShowOnlyErrors(e.target.checked)} 
            style={{ accentColor: 'var(--color-contradicted)' }}
          />
          Show only errors
        </label>
      </div>

      <div style={{
        whiteSpace: 'pre-wrap',
        lineHeight: 1.8,
        fontSize: '0.95rem',
        overflowY: 'auto',
        flex: 1,
        padding: '20px',
        color: 'var(--text-primary)',
      }}>
        {segments.map((seg, idx) => {
          if (!seg.isClaim) {
            return <span key={idx}>{seg.text}</span>;
          }

          const claim = seg.claim;
          const isSelected = selectedClaimId === claim.id;
          const verdictClass = `span-${claim.verdict}`;

          return (
            <span
              key={idx}
              onClick={() => onSelectClaim(claim)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectClaim(claim);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`Claim ${claim.id}: ${claim.verdict}. ${claim.claim}`}
              className={`highlight-span ${verdictClass} ${isSelected ? 'active' : ''} ${claim.isDimmed && !isSelected ? 'dimmed' : ''}`}
              title={`[${claim.verdict}] ${claim.claim}\nModel Certainty: ${Math.round((claim.confidence || 0) * 100)}% (Heuristic)`}
              style={{
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {seg.text}
            </span>
          );
        })}
      </div>
    </div>
  );
}
