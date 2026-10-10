import React from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  HelpCircle,
  Info,
  Database,
  Play,
  CheckCircle2,
  XCircle,
  Download,
  Printer,
  Layers,
  UserCheck
} from 'lucide-react';

export default function ScoreCard({
  auditResult,
  onReRunLive,
  selectedVerdict = 'ALL',
  onSelectVerdict,
  onExportJson,
  onExportPdf,
}) {
  if (!auditResult) return null;

  const score = Math.round((auditResult.overall_reliability_score || 0) * 100);
  const verdictCounts = auditResult.verdict_counts || {};
  const totalClaims = auditResult.total_claims || (auditResult.claims || []).length || 0;
  const reasoningCount = auditResult.reasoning_issues?.length || 0;
  const safetyCount = auditResult.safety_flags?.length || 0;
  const reviewCount = (auditResult.claims || []).filter(c => c.needs_human_review).length || auditResult.human_review_items?.length || 0;

  let scoreColor = 'var(--color-supported)';
  let scoreGrade = 'Highly Reliable';
  if (score < 50) {
    scoreColor = 'var(--color-contradicted)';
    scoreGrade = 'Critical Risk';
  } else if (score < 75) {
    scoreColor = 'var(--color-unsupported)';
    scoreGrade = 'Moderate Risk';
  }

  // Ring gauge calculation
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const summaryStats = [
    {
      label: 'SUPPORTED',
      displayLabel: 'Supported',
      count: verdictCounts.SUPPORTED || 0,
      color: 'var(--color-supported)',
      bg: 'var(--color-supported-bg)',
      border: 'var(--color-supported-border)',
      icon: <CheckCircle2 size={15} />,
      desc: 'Corroborated by source text',
    },
    {
      label: 'CONTRADICTED',
      displayLabel: 'Contradicted',
      count: verdictCounts.CONTRADICTED || 0,
      color: 'var(--color-contradicted)',
      bg: 'var(--color-contradicted-bg)',
      border: 'var(--color-contradicted-border)',
      icon: <XCircle size={15} />,
      desc: 'Conflicts with source facts',
    },
    {
      label: 'UNSUPPORTED',
      displayLabel: 'Unsupported',
      count: verdictCounts.UNSUPPORTED || 0,
      color: 'var(--color-unsupported)',
      bg: 'var(--color-unsupported-bg)',
      border: 'var(--color-unsupported-border)',
      icon: <AlertTriangle size={15} />,
      desc: 'Absent from provided source',
    },
    {
      label: 'AMBIGUOUS',
      displayLabel: 'Ambiguous',
      count: verdictCounts.AMBIGUOUS || 0,
      color: 'var(--color-ambiguous)',
      bg: 'var(--color-ambiguous-bg)',
      border: 'var(--color-ambiguous-border)',
      icon: <HelpCircle size={15} />,
      desc: 'Unclear or multiple interpretations',
    },
  ];

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      {/* Top Header Row with Export Options */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        paddingBottom: '16px',
        marginBottom: '20px',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} style={{ color: 'var(--brand-accent)' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            Executive Audit Assessment
          </h3>
          <span style={{
            fontSize: '0.72rem',
            padding: '2px 8px',
            borderRadius: '10px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
          }}>
            {totalClaims} claims evaluated
          </span>
        </div>

        {/* Export Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onExportJson && (
            <button
              onClick={onExportJson}
              className="btn btn-sm"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
              }}
              title="Download structured audit findings in JSON"
            >
              <Download size={13} />
              <span>Export JSON</span>
            </button>
          )}

          {onExportPdf && (
            <button
              onClick={onExportPdf}
              className="btn btn-sm"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
              }}
              title="Print executive audit report or save as PDF"
            >
              <Printer size={13} />
              <span>Print / PDF</span>
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'center' }}>
        
        {/* Left Col: Gauge & High-level Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          
          {/* Gauge Ring */}
          <div
            style={{ position: 'relative', width: '90px', height: '90px', flexShrink: 0, cursor: 'help' }}
            title="Score derivation (/100): Calculated by weighted claim verification. Supported claims receive full score (1.0), with heavy deductions for Contradictions (0.0), Unsupported claims (0.15), Ambiguities (0.4), and deductions for reasoning inconsistencies or safety violations."
          >
            <svg width="90" height="90" viewBox="0 0 90 90" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="45" cy="45" r={radius} fill="none" stroke="var(--bg-secondary)" strokeWidth="8" />
              <circle 
                cx="45" cy="45" r={radius} fill="none" 
                stroke={scoreColor} 
                strokeWidth="8" 
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease-out' }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1 }}>
                <span style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                  {score}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                  /100
                </span>
              </div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: '700', color: scoreColor, letterSpacing: '-0.01em' }}>
                {scoreGrade}
              </span>
              
              {/* Cached / Live Indicator */}
              {auditResult.cached ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                    <Database size={10} /> Cached Offline
                  </span>
                  {onReRunLive && (
                    <button onClick={onReRunLive} className="btn btn-sm" style={{ padding: '2px 8px', fontSize: '0.65rem', color: 'var(--brand-accent)', border: '1px solid var(--brand-accent)' }}>
                      <Play size={10} /> Re-run Live
                    </button>
                  )}
                </div>
              ) : (
                <span className="badge" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'rgb(34, 197, 94)' }}>
                  <Play size={10} /> Live Audit
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '280px', margin: 0 }}>
              <strong>{totalClaims} claims audited.</strong> Index based on evidence corroboration, factual consistency, and logic soundness.
            </p>
          </div>
        </div>

        {/* Right Col: Metric Cards (Verdict Counts + Flags) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Clickable 4-Verdict Audit Summary Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {summaryStats.map((stat) => {
              const isSelected = selectedVerdict === stat.label;
              const pct = totalClaims > 0 ? Math.round((stat.count / totalClaims) * 100) : 0;

              return (
                <div
                  key={stat.label}
                  onClick={() => onSelectVerdict && onSelectVerdict(isSelected ? 'ALL' : stat.label)}
                  style={{
                    background: stat.bg,
                    border: `1px solid ${isSelected ? stat.color : stat.border}`,
                    boxShadow: isSelected ? `0 0 0 2px ${stat.color}` : 'none',
                    padding: '10px 8px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: onSelectVerdict ? 'pointer' : 'default',
                    transition: 'all 0.15s ease',
                  }}
                  title={`Click to filter: ${stat.displayLabel} (${stat.desc})`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: stat.color, marginBottom: '2px' }}>
                    {stat.icon}
                    <span style={{ fontSize: '1.25rem', fontWeight: '800', lineHeight: 1 }}>
                      {stat.count}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.62rem', color: stat.color, fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    {stat.displayLabel}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {pct}% of claims
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            {/* Logic Flaws Card */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: reasoningCount > 0 ? 'var(--color-logic-flaw-bg)' : 'var(--bg-secondary)',
              border: `1px solid ${reasoningCount > 0 ? 'var(--color-logic-flaw-border)' : 'var(--border-color)'}`,
              padding: '10px 12px', borderRadius: 'var(--radius-md)'
            }}>
              <div style={{ color: reasoningCount > 0 ? 'var(--color-logic-flaw)' : 'var(--text-muted)' }}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: reasoningCount > 0 ? 'var(--color-logic-flaw)' : 'var(--text-secondary)' }}>
                  {reasoningCount} Logic {reasoningCount === 1 ? 'Flaw' : 'Flaws'}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Reasoning gaps</div>
              </div>
            </div>

            {/* Unsafe Advice Card */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: safetyCount > 0 ? 'var(--color-contradicted-bg)' : 'var(--bg-secondary)',
              border: `1px solid ${safetyCount > 0 ? 'var(--color-contradicted-border)' : 'var(--border-color)'}`,
              padding: '10px 12px', borderRadius: 'var(--radius-md)'
            }}>
              <div style={{ color: safetyCount > 0 ? 'var(--color-contradicted)' : 'var(--text-muted)' }}>
                <AlertOctagon size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: safetyCount > 0 ? 'var(--color-contradicted)' : 'var(--text-secondary)' }}>
                  {safetyCount} Unsafe
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Harmful recommendations</div>
              </div>
            </div>

            {/* Review Required Items */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: reviewCount > 0 ? 'var(--color-ambiguous-bg)' : 'var(--bg-secondary)',
              border: `1px solid ${reviewCount > 0 ? 'var(--color-ambiguous-border)' : 'var(--border-color)'}`,
              padding: '10px 12px', borderRadius: 'var(--radius-md)'
            }}>
              <div style={{ color: reviewCount > 0 ? 'var(--color-ambiguous)' : 'var(--text-muted)' }}>
                <UserCheck size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: reviewCount > 0 ? 'var(--color-ambiguous)' : 'var(--text-secondary)' }}>
                  {reviewCount} Review
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Requires human verification</div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
      
      {/* Footer Info: Clear Calibration Disclosure */}
      <div style={{
        marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '10px',
        fontSize: '0.75rem', color: 'var(--text-muted)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Info size={14} style={{ color: 'var(--brand-accent)', flexShrink: 0 }} />
          <span>
            <strong>Calibration Notice:</strong> Certainty percentages reflect model self-assessment heuristic & citation overlap, not calibrated Bayesian probabilities of truth.
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            {auditResult.metadata?.pipeline_time_sec ? `${auditResult.metadata.pipeline_time_sec}s latency` : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
