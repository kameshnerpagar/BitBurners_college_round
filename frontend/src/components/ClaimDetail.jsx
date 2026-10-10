import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle, FileCheck, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ClaimDetail({ claim, onNext, onPrev, index, total }) {
  if (!claim) {
    return (
      <div className="glass-panel" style={{
        padding: '32px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        marginTop: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
        }}>
          <FileCheck size={24} />
        </div>
        <p style={{ fontSize: '0.875rem' }}>
          Select a highlighted claim to view its audit findings and verified evidence.
        </p>
      </div>
    );
  }

  const verdictStyles = {
    SUPPORTED: {
      badgeClass: 'badge-supported',
      icon: <CheckCircle2 size={16} />,
      color: 'var(--color-supported)',
      desc: 'This claim is directly corroborated by verified quotes in the source document.',
    },
    CONTRADICTED: {
      badgeClass: 'badge-contradicted',
      icon: <XCircle size={16} />,
      color: 'var(--color-contradicted)',
      desc: 'This claim contradicts factual statements in the source document.',
    },
    UNSUPPORTED: {
      badgeClass: 'badge-unsupported',
      icon: <AlertTriangle size={16} />,
      color: 'var(--color-unsupported)',
      desc: 'The source touches on this topic but does not back this specific assertion.',
    },
    AMBIGUOUS: {
      badgeClass: 'badge-ambiguous',
      icon: <HelpCircle size={16} />,
      color: 'var(--color-ambiguous)',
      desc: 'The source passages are either contradictory or open to multiple interpretations.',
    },
  };

  const style = verdictStyles[claim.verdict] || verdictStyles.AMBIGUOUS;
  const confidencePct = Math.round((claim.confidence || 0) * 100);

  const hasCategory = Boolean(
    claim.category &&
    claim.category.toLowerCase() !== 'none' &&
    claim.category.trim() !== ''
  );

  const formatCategory = (cat) => {
    if (!cat) return '';
    return cat.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="glass-panel" style={{
      padding: '24px',
      marginTop: '24px',
      borderLeft: `4px solid ${style.color}`,
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    }}>
      {/* Header Row: Verdict, category & type chips on left; Certainty score, ID, and Prev/Next arrows on right */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        paddingBottom: '12px',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span className={`badge ${style.badgeClass}`}>
            {style.icon}
            {claim.verdict}
          </span>
          <span style={{
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: '600',
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
          }}>
            Claim #{claim.id || 'claim'}
          </span>
          {claim.claim_type && claim.claim_type !== 'factual' && (
            <span style={{
              fontSize: '0.7rem',
              fontWeight: '600',
              padding: '2px 8px',
              borderRadius: '12px',
              background: 'rgba(234, 179, 8, 0.12)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              color: 'rgb(234, 179, 8)',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
            }}>
              {claim.claim_type.replace('_', ' ')}
            </span>
          )}
          {claim.severity && claim.severity !== 'NONE' && (
            <span style={{
              fontSize: '0.7rem',
              fontWeight: '700',
              padding: '2px 8px',
              borderRadius: '12px',
              background: claim.severity === 'HIGH' ? 'var(--color-contradicted-bg)' : claim.severity === 'MEDIUM' ? 'var(--color-unsupported-bg)' : 'var(--color-ambiguous-bg)',
              border: `1px solid ${claim.severity === 'HIGH' ? 'var(--color-contradicted-border)' : claim.severity === 'MEDIUM' ? 'var(--color-unsupported-border)' : 'var(--color-ambiguous-border)'}`,
              color: claim.severity === 'HIGH' ? 'var(--color-contradicted)' : claim.severity === 'MEDIUM' ? 'var(--color-unsupported)' : 'var(--color-ambiguous)',
              letterSpacing: '0.03em',
            }}>
              {claim.severity} SEVERITY
            </span>
          )}
          {hasCategory && (
            <span style={{
              fontSize: '0.72rem',
              fontWeight: '600',
              padding: '3px 10px',
              borderRadius: '12px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              letterSpacing: '0.02em',
              display: 'inline-flex',
              alignItems: 'center',
            }}>
              {formatCategory(claim.category)}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {(() => {
            const confVal = typeof claim.confidence === 'number' ? (claim.confidence > 1 ? claim.confidence : claim.confidence * 100) : 0;
            const band = confVal >= 85 ? 'High' : confVal >= 60 ? 'Medium' : 'Low';
            const tooltipText = `${confidencePct}% (heuristic, uncalibrated)`;
            return (
              <div
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', cursor: 'help' }}
                title={tooltipText}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: '700', color: style.color, lineHeight: 1 }}>
                    {band} Certainty
                  </span>
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px' }} title={tooltipText}>
                  (Heuristic, uncalibrated)
                </span>
                {claim.confidence_explanation && (
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', maxWidth: '180px', textAlign: 'right', lineHeight: 1.2, marginTop: '2px' }}>
                    {claim.confidence_explanation}
                  </span>
                )}
              </div>
            );
          })()}

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-secondary)', padding: '2px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <button 
              onClick={onPrev} 
              disabled={!onPrev}
              className="btn btn-sm" 
              style={{ padding: '2px', background: 'transparent', color: onPrev ? 'var(--text-primary)' : 'var(--text-muted)' }}
              title="Previous Claim (Keyboard: K or Up Arrow)"
              aria-label="Previous Claim"
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', padding: '0 4px' }}>
              {index}/{total}
            </span>
            <button 
              onClick={onNext} 
              disabled={!onNext}
              className="btn btn-sm" 
              style={{ padding: '2px', background: 'transparent', color: onNext ? 'var(--text-primary)' : 'var(--text-muted)' }}
              title="Next Claim (Keyboard: J or Down Arrow)"
              aria-label="Next Claim"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Full Width Claim Text */}
      <h4 style={{ fontSize: '1.15rem', fontWeight: '600', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0, width: '100%' }}>
        "{claim.claim}"
      </h4>

      {/* Reasoning */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
      }}>
        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
          Audit Reasoning
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
          {claim.explanation || style.desc}
        </p>
      </div>

      {/* Evidence Quotes */}
      {claim.evidence_quote ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileCheck size={16} style={{ color: 'var(--text-primary)' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Extracted Source Evidence
              </span>
            </div>
            {claim.source_location && (
              <span style={{ fontSize: '0.72rem', color: 'var(--brand-accent)', fontWeight: '600', fontFamily: 'var(--font-mono)' }}>
                📍 {claim.source_location}
              </span>
            )}
          </div>

          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <div style={{
              fontSize: '0.875rem',
              fontStyle: 'italic',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}>
              "{claim.evidence_quote}"
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '12px',
              marginTop: '4px',
              flexWrap: 'wrap',
              gap: '8px',
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {claim.evidence_passage_id ? `Source: [${claim.evidence_passage_id}]` : 'Source: Full Text'}
              </span>

              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.6875rem',
                fontStyle: 'normal',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                background: claim.evidence_verified ? 'var(--color-supported-bg)' : 'var(--color-unsupported-bg)',
                color: claim.evidence_verified ? 'var(--color-supported)' : 'var(--color-unsupported)',
                whiteSpace: 'nowrap',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
              }}>
                {claim.evidence_status === 'verified_verbatim' || (claim.evidence_verified && !claim.evidence_status) ? (
                  <><CheckCircle2 size={12} /> Verified Verbatim</>
                ) : claim.evidence_status === 'unverified_quote' || !claim.evidence_verified ? (
                  <><AlertTriangle size={12} /> Unverified Quote</>
                ) : (
                  <><AlertTriangle size={12} /> {claim.evidence_status?.replace('_', ' ')}</>
                )}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px dashed var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 16px',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <AlertTriangle size={14} />
          <span>No direct evidence quote was found in the source document for this claim.</span>
        </div>
      )}

      {/* Footer Meta */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border-color)',
        paddingTop: '16px',
        marginTop: '4px',
        gap: '8px',
      }}>
        {claim.span && (
          <span style={{ fontFamily: 'var(--font-mono)' }}>
            Offsets: [{claim.span.start}..{claim.span.end}]
          </span>
        )}

        {claim.needs_human_review && (
          <span style={{
            color: 'var(--color-ambiguous)',
            background: 'var(--color-ambiguous-bg)',
            border: '1px solid var(--color-ambiguous-border)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: '600',
          }}>
            Human Review Recommended: {claim.human_review_reason || 'Uncertain findings'}
          </span>
        )}
      </div>
    </div>
  );
}
