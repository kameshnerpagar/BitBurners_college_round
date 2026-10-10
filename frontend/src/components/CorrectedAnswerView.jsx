import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck,
  Info,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Quote,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

export default function CorrectedAnswerView({ correctedAnswer, originalAnswer }) {
  const [copied, setCopied] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [activeCitation, setActiveCitation] = useState(null);
  const [comparisonMode, setComparisonMode] = useState('split'); // 'split' | 'revised'

  if (!correctedAnswer) {
    return (
      <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        No correction draft generated for this audit.
      </div>
    );
  }

  const {
    revised_text = '',
    retained_count = 0,
    corrected_count = 0,
    qualified_count = 0,
    removed_count = 0,
    human_review_count = 0,
    reaudit_supported_count,
    reaudit_total_claims,
    citations = [],
    changes = [],
  } = correctedAnswer;

  const handleCopy = async () => {
    try {
      // Strip citation markers like [1] for pure clean clipboard copy
      const cleanProse = revised_text.replace(/\[\d+\]/g, '').replace(/\s+/g, ' ').trim();
      await navigator.clipboard.writeText(cleanProse || revised_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy revised text:', err);
    }
  };

  const getActionBadge = (action) => {
    const act = (action || '').toUpperCase();
    if (act.includes('RETAIN') || act.includes('KEPT')) {
      return {
        label: 'Kept',
        color: 'var(--color-supported)',
        bg: 'var(--color-supported-bg)',
        border: 'var(--color-supported-border)',
        icon: <CheckCircle2 size={13} />,
      };
    }
    if (act.includes('CORRECT')) {
      return {
        label: 'Corrected',
        color: 'var(--color-contradicted)',
        bg: 'var(--color-contradicted-bg)',
        border: 'var(--color-contradicted-border)',
        icon: <XCircle size={13} />,
      };
    }
    if (act.includes('QUALIF')) {
      return {
        label: 'Qualified',
        color: 'var(--color-unsupported)',
        bg: 'var(--color-unsupported-bg)',
        border: 'var(--color-unsupported-border)',
        icon: <AlertTriangle size={13} />,
      };
    }
    if (act.includes('REMOV')) {
      return {
        label: 'Removed',
        color: 'var(--text-muted)',
        bg: 'var(--bg-secondary)',
        border: 'var(--border-color)',
        icon: <XCircle size={13} />,
      };
    }
    return {
      label: 'Review',
      color: 'var(--color-ambiguous)',
      bg: 'var(--color-ambiguous-bg)',
      border: 'var(--color-ambiguous-border)',
      icon: <Info size={13} />,
    };
  };

  // Re-audit statistics
  const reauditSupported = reaudit_supported_count !== undefined && reaudit_supported_count !== null
    ? reaudit_supported_count
    : (retained_count + corrected_count);
  const reauditTotal = reaudit_total_claims !== undefined && reaudit_total_claims !== null
    ? reaudit_total_claims
    : Math.max(1, retained_count + corrected_count + qualified_count + removed_count);

  // Render revised text with interactive citation chips
  const renderInteractiveProse = (text) => {
    if (!text) return null;

    // Split text by numbered citation markers like [1], [2], etc.
    const parts = text.split(/(\[\d+\])/g);

    return parts.map((part, index) => {
      const match = part.match(/^\[(\d+)\]$/);
      if (match) {
        const citNum = parseInt(match[1], 10);
        const citData = citations.find(c => c.id === citNum) || citations[citNum - 1];
        const isSelected = activeCitation === citNum;

        return (
          <span
            key={index}
            style={{ position: 'relative', display: 'inline-block' }}
          >
            <button
              type="button"
              onClick={() => setActiveCitation(isSelected ? null : citNum)}
              title={citData ? `[${citNum}] "${citData.quote}"` : `Citation [${citNum}]`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.72rem',
                fontWeight: '700',
                color: isSelected ? '#fff' : 'var(--brand-accent)',
                background: isSelected ? 'var(--brand-accent)' : 'rgba(124, 58, 237, 0.12)',
                border: `1px solid ${isSelected ? 'var(--brand-accent)' : 'rgba(124, 58, 237, 0.35)'}`,
                borderRadius: '10px',
                padding: '1px 6px',
                margin: '0 3px',
                cursor: 'pointer',
                verticalAlign: 'super',
                lineHeight: '1.2',
                transition: 'all 0.15s ease',
              }}
            >
              [{citNum}]
            </button>

            {isSelected && citData && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginBottom: '8px',
                  width: '320px',
                  maxWidth: '85vw',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-lg)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  zIndex: 100,
                  fontSize: '0.8rem',
                  lineHeight: '1.5',
                  color: 'var(--text-primary)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--brand-accent)' }}>
                    Citation [{citNum}] • {citData.source_location || citData.citation || 'Source Document'}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveCitation(null); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    ✕
                  </button>
                </div>
                <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  "{citData.quote}"
                </div>
              </div>
            )}
          </span>
        );
      }

      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner & Metric Chips */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, var(--brand-accent), #10b981)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}>
                <Sparkles size={18} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                Evidence-Grounded Correction Draft
              </h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '660px' }}>
              Draft regenerated exclusively from verified source facts and supported assertions. Contradictions are rectified using verbatim quotes, while ungrounded statements are removed or qualified.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Re-Audited Status Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--color-supported-bg)',
              border: '1px solid var(--color-supported-border)',
              color: 'var(--color-supported)',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: '700',
            }}>
              <ShieldCheck size={15} />
              <span>Revised answer re-audited: {reauditSupported} of {reauditTotal} claims supported</span>
            </div>

            {/* View Mode Toggle: Per-Claim Split vs Revised Only */}
            <div style={{
              background: 'var(--bg-secondary)',
              padding: '3px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              gap: '2px',
              border: '1px solid var(--border-color)',
            }}>
              <button
                onClick={() => setComparisonMode('split')}
                className="btn btn-sm"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  background: comparisonMode === 'split' ? 'var(--bg-elevated)' : 'transparent',
                  color: comparisonMode === 'split' ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: comparisonMode === 'split' ? '1px solid var(--border-color)' : '1px solid transparent',
                  boxShadow: comparisonMode === 'split' ? 'var(--shadow-sm)' : 'none',
                }}
              >
                Before / After Split
              </button>
              <button
                onClick={() => setComparisonMode('revised')}
                className="btn btn-sm"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  background: comparisonMode === 'revised' ? 'var(--bg-elevated)' : 'transparent',
                  color: comparisonMode === 'revised' ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: comparisonMode === 'revised' ? '1px solid var(--border-color)' : '1px solid transparent',
                  boxShadow: comparisonMode === 'revised' ? 'var(--shadow-sm)' : 'none',
                }}
              >
                Revised Text Only
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied Prose!' : 'Copy Clean Prose'}</span>
            </button>
          </div>
        </div>

        {/* Change Stats Summary */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-color)',
        }}>
          <div style={{
            padding: '10px 14px',
            background: 'var(--color-supported-bg)',
            border: '1px solid var(--color-supported-border)',
            borderRadius: 'var(--radius-sm)',
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-supported)', fontWeight: '600' }}>
              Kept Facts
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-supported)', marginTop: '2px' }}>
              {retained_count}
            </div>
          </div>

          <div style={{
            padding: '10px 14px',
            background: 'var(--color-contradicted-bg)',
            border: '1px solid var(--color-contradicted-border)',
            borderRadius: 'var(--radius-sm)',
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-contradicted)', fontWeight: '600' }}>
              Corrected Claims
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-contradicted)', marginTop: '2px' }}>
              {corrected_count}
            </div>
          </div>

          {qualified_count > 0 && (
            <div style={{
              padding: '10px 14px',
              background: 'var(--color-unsupported-bg)',
              border: '1px solid var(--color-unsupported-border)',
              borderRadius: 'var(--radius-sm)',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-unsupported)', fontWeight: '600' }}>
                Qualified Claims
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-unsupported)', marginTop: '2px' }}>
                {qualified_count}
              </div>
            </div>
          )}

          {removed_count > 0 && (
            <div style={{
              padding: '10px 14px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                Removed Claims
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {removed_count}
              </div>
            </div>
          )}

          {human_review_count > 0 && (
            <div style={{
              padding: '10px 14px',
              background: 'var(--color-ambiguous-bg)',
              border: '1px solid var(--color-ambiguous-border)',
              borderRadius: 'var(--radius-sm)',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-ambiguous)', fontWeight: '600' }}>
                Review Required
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-ambiguous)', marginTop: '2px' }}>
                {human_review_count}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main View: Split Mode vs Clean Revised Text Only */}
      {comparisonMode === 'split' ? (
        /* Per-Claim Before / After Split with Highlighted Differences */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 4px',
          }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              Per-Claim Before & After Comparison ({changes.length})
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Side-by-side changes with highlighted evidence grounding
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {changes.map((c, idx) => {
              const badge = getActionBadge(c.action);
              const origText = c.original_text || c.original_claim || c.claim || '';
              const revText = c.revised_text || c.revised_claim || '';
              const citation = c.citation || c.source_citation || null;

              return (
                <div
                  key={c.claim_id || idx}
                  className="glass-panel"
                  style={{
                    padding: '18px 20px',
                    borderLeft: `4px solid ${badge.color}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {badge.icon}
                        {badge.label}
                      </span>
                      <span style={{
                        fontSize: '0.72rem',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-muted)',
                        padding: '2px 8px',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                      }}>
                        Claim #{c.claim_id ?? idx + 1}
                      </span>
                    </div>

                    {c.needs_human_review && (
                      <span style={{
                        fontSize: '0.7rem',
                        background: 'var(--color-ambiguous-bg)',
                        color: 'var(--color-ambiguous)',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        border: '1px solid var(--color-ambiguous-border)',
                        fontWeight: '600',
                      }}>
                        Human Review Required
                      </span>
                    )}
                  </div>

                  {/* Side-by-Side Comparison Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '14px',
                  }}>
                    {/* Before: Original Claim */}
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.04)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px 14px',
                    }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--color-contradicted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Before (Original AI Claim)
                      </div>
                      <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        "{origText}"
                      </div>
                    </div>

                    {/* After: Revised Grounded Claim */}
                    <div style={{
                      background: badge.label === 'Removed' ? 'var(--bg-secondary)' : 'rgba(34, 197, 94, 0.04)',
                      border: `1px solid ${badge.label === 'Removed' ? 'var(--border-color)' : 'rgba(34, 197, 94, 0.25)'}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px 14px',
                    }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: '700', color: badge.color, textTransform: 'uppercase', marginBottom: '6px' }}>
                        After (Grounded Resolution)
                      </div>
                      <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: '500', lineHeight: '1.6' }}>
                        {revText}
                      </div>
                    </div>
                  </div>

                  {/* Grounding Rationale & Citation */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '10px',
                  }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>Rationale: </strong>
                      {c.reason}
                    </div>
                    {citation && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '6px',
                        background: 'var(--bg-secondary)',
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        fontStyle: 'italic',
                      }}>
                        <Quote size={12} style={{ flexShrink: 0, color: 'var(--brand-accent)' }} />
                        <span><strong>Source Citation: </strong>{citation}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Clean Prose Draft View with Interactive Citations */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)', margin: 0 }}>
                Clean Correction Draft (Fluent Prose)
              </h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Click numbered citation chips to inspect verbatim ground truth quotes
              </span>
            </div>

            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '24px 28px',
              color: 'var(--text-primary)',
              fontSize: '0.95rem',
              lineHeight: '1.9',
              whiteSpace: 'pre-wrap',
              fontFamily: 'var(--font-main)',
            }}>
              {renderInteractiveProse(revised_text)}
            </div>
          </div>

          {/* Citation Reference Cards */}
          {citations && citations.length > 0 && (
            <div className="glass-panel" style={{ padding: '20px 24px' }}>
              <h5 style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Grounding Sources & Verbatim Quotes ({citations.length})
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {citations.map((cit) => (
                  <div
                    key={cit.id}
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '10px',
                      padding: '8px 12px',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.82rem',
                    }}
                  >
                    <span style={{
                      fontWeight: '800',
                      color: 'var(--brand-accent)',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      background: 'rgba(124, 58, 237, 0.1)',
                      padding: '2px 6px',
                      borderRadius: '6px',
                      border: '1px solid rgba(124, 58, 237, 0.2)',
                    }}>
                      [{cit.id}]
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', flex: 1 }}>
                      "{cit.quote}"
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {cit.source_location || cit.citation}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detailed Claim-by-Claim Modification Log */}
      {changes.length > 0 && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
            Claim Modification Log & Grounding Evidence ({changes.length})
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {changes.map((c, i) => {
              const badge = getActionBadge(c.action);
              const isExpanded = expandedRow === i;
              const origText = c.original_text || c.original_claim || c.claim || '';
              const revText = c.revised_text || c.revised_claim || '';
              const citation = c.citation || c.source_citation || null;

              return (
                <div
                  key={c.claim_id || i}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: `1px solid ${isExpanded ? 'var(--brand-accent)' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '16px 20px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    onClick={() => setExpandedRow(isExpanded ? null : i)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {badge.icon}
                          {badge.label}
                        </span>

                        <span style={{
                          fontSize: '0.72rem',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--text-muted)',
                          padding: '2px 6px',
                          background: 'var(--bg-elevated)',
                          borderRadius: 'var(--radius-sm)',
                        }}>
                          Claim #{c.claim_id ?? i + 1}
                        </span>

                        <span style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                          "{origText}"
                        </span>
                      </div>

                      {/* Revised wording preview row */}
                      {revText && (
                        <div style={{
                          fontSize: '0.82rem',
                          color: 'var(--text-secondary)',
                          marginLeft: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>
                            Revised:
                          </span>
                          <span style={{ color: badge.color, fontWeight: '500' }}>
                            {revText}
                          </span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {c.needs_human_review && (
                        <span style={{
                          fontSize: '0.7rem',
                          background: 'var(--color-ambiguous-bg)',
                          color: 'var(--color-ambiguous)',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          border: '1px solid var(--color-ambiguous-border)',
                          fontWeight: '600',
                        }}>
                          Review Required
                        </span>
                      )}
                      <button
                        type="button"
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div style={{
                      marginTop: '14px',
                      paddingTop: '14px',
                      borderTop: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      fontSize: '0.85rem',
                    }}>
                      <div>
                        <strong style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                          Original Claim Text:
                        </strong>
                        <div style={{ color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                          "{origText}"
                        </div>
                      </div>

                      {revText && (
                        <div>
                          <strong style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                            Revised Wording:
                          </strong>
                          <div style={{ color: 'var(--text-primary)', marginTop: '4px', fontWeight: '500' }}>
                            {revText}
                          </div>
                        </div>
                      )}

                      <div>
                        <strong style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                          Reasoning & Grounding:
                        </strong>
                        <div style={{ color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                          {c.reason}
                        </div>
                      </div>

                      {citation && (
                        <div style={{
                          background: 'var(--bg-elevated)',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)',
                          fontStyle: 'italic',
                        }}>
                          <strong style={{ color: 'var(--text-primary)', fontStyle: 'normal' }}>Ground Truth Citation: </strong>
                          "{citation}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
