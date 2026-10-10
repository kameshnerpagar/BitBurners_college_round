import React, { useState, useEffect } from 'react';
import { fetchEvaluation, fetchHeldOutEvaluation, fetchComparisonEvaluation } from '../utils/api';
import { BarChart3, Crosshair, CheckCircle2, ShieldAlert, FlaskConical, Award, ShieldCheck, Zap, AlertTriangle, Info } from 'lucide-react';

export default function BenchmarkResults() {
  const [metrics, setMetrics] = useState(null);
  const [heldOutMetrics, setHeldOutMetrics] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadAllMetrics() {
      try {
        const [inSample, heldOut, comparison] = await Promise.all([
          fetchEvaluation().catch(() => null),
          fetchHeldOutEvaluation().catch(() => null),
          fetchComparisonEvaluation().catch(() => null),
        ]);
        setMetrics(inSample);
        setHeldOutMetrics(heldOut);
        setComparisonData(comparison);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadAllMetrics();
  }, []);

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Benchmark Results & System Comparison...</div>;
  }

  if (error || !metrics) {
    return null; // silently fail if unable to load metrics
  }

  const comparisonTable = comparisonData?.comparison_table || heldOutMetrics?.three_system_comparison?.comparison_table || [];
  const winsAndLosses = comparisonData?.wins_and_losses || heldOutMetrics?.three_system_comparison?.wins_and_losses || null;
  const confusionMatrix = heldOutMetrics?.confusion_matrix || null;
  const perClass = heldOutMetrics?.per_class || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', marginBottom: '28px' }}>

      {/* ───────────────────────────────────────────────────────────────────
          1. THREE-WAY SYSTEM COMPARISON BENCHMARK (Held-Out Test Cases)
      ────────────────────────────────────────────────────────────────────── */}
      <div className="glass-panel" style={{ padding: '26px', borderLeft: '4px solid var(--brand-accent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Award size={22} color="var(--brand-accent)" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                Trustworthy Benchmark: 3-Way System Comparison
              </h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '780px' }}>
              Evaluation across {heldOutMetrics?.dataset_size || '8 unseen held-out cases, 42 atomic claims'} never used during prompt tuning.
              {heldOutMetrics?.annotation_method || ' Ground-truth labels independently assigned by our team via verbatim text inspection.'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <span style={{
              fontSize: '0.74rem',
              padding: '3px 10px',
              borderRadius: '12px',
              background: 'rgba(124, 58, 237, 0.12)',
              border: '1px solid rgba(124, 58, 237, 0.35)',
              color: 'var(--brand-accent)',
              fontWeight: '700',
            }}>
              8 Unseen Test Cases • 42 Claims Evaluated
            </span>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Small sample; evaluated by our team; not a general accuracy claim.
            </span>
          </div>
        </div>

        {/* 3-Way Comparison Table */}
        <div style={{
          overflowX: 'auto',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          marginBottom: '20px',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: 'var(--text-secondary)' }}>
                  Evaluation Dimension
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: 'var(--text-muted)' }}>
                  (a) LLM-Only Verifier
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: 'var(--text-muted)' }}>
                  (b) BM25 + Verifier
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '800', color: 'var(--brand-accent)', background: 'rgba(124, 58, 237, 0.08)' }}>
                  (c) Full Second Opinion
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: 'var(--text-secondary)' }}>
                  Architectural Advantage
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonTable.map((row, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: idx === comparisonTable.length - 1 ? 'none' : '1px solid var(--border-color)',
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                  }}
                >
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {row.metric}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: row.llm_only.includes('FAILED') ? 'var(--color-contradicted)' : 'var(--text-secondary)' }}>
                    {row.llm_only}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: row.bm25_verifier.includes('PARTIAL') ? 'var(--color-ambiguous)' : 'var(--text-secondary)' }}>
                    {row.bm25_verifier}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: '800', color: 'var(--color-supported)', background: 'rgba(124, 58, 237, 0.05)' }}>
                    {row.full_pipeline}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {row.advantage}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Where Full Pipeline Wins vs Where It Does Not */}
        {winsAndLosses && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
            gap: '16px',
            marginBottom: '20px',
          }}>
            <div style={{
              background: 'rgba(34, 197, 94, 0.04)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 18px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-supported)', fontWeight: '700', fontSize: '0.88rem', marginBottom: '10px' }}>
                <CheckCircle2 size={16} />
                <span>Where Full Pipeline Wins</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.65' }}>
                {winsAndLosses.where_full_pipeline_wins.map((w, i) => (
                  <li key={i} style={{ marginBottom: '6px' }}>{w}</li>
                ))}
              </ul>
            </div>

            <div style={{
              background: 'rgba(239, 68, 68, 0.04)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 18px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-contradicted)', fontWeight: '700', fontSize: '0.88rem', marginBottom: '10px' }}>
                <AlertTriangle size={16} />
                <span>Where Pipeline Does Not Win & Known Failure Cases</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.65' }}>
                {[...winsAndLosses.where_full_pipeline_does_not_win, ...winsAndLosses.known_failure_cases].map((l, i) => (
                  <li key={i} style={{ marginBottom: '6px' }}>{l}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Multiclass Confusion Matrix & Per-Class F1 Table */}
        {/* {perClass && confusionMatrix && (
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '18px 20px',
            marginBottom: '20px',
          }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)', marginBottom: '14px' }}>
              Full Pipeline Multiclass Confusion Matrix & Class Metrics (N = {heldOutMetrics.total_claims_evaluated})
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              {['SUPPORTED', 'CONTRADICTED', 'UNSUPPORTED', 'AMBIGUOUS'].map((cls) => {
                const cm = perClass[cls] || {};
                const colorMap = {
                  SUPPORTED: 'var(--color-supported)',
                  CONTRADICTED: 'var(--color-contradicted)',
                  UNSUPPORTED: 'var(--color-unsupported)',
                  AMBIGUOUS: 'var(--color-ambiguous)',
                };
                return (
                  <div
                    key={cls}
                    style={{
                      padding: '10px 14px',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      borderLeft: `3px solid ${colorMap[cls]}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: '700', color: colorMap[cls] }}>{cls}</span>
                      <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>N = {cm.n}</span>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                      F1: {cm.f1}%
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Prec: {cm.precision}% • Rec: {cm.recall}% • FPR: {cm.fpr}%
                    </div>
                  </div>
                );
              })}
            </div>

            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)' }}>Actual \ Predicted</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--color-supported)' }}>Pred: SUPPORTED</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--color-contradicted)' }}>Pred: CONTRADICTED</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--color-unsupported)' }}>Pred: UNSUPPORTED</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--color-ambiguous)' }}>Pred: AMBIGUOUS</th>
                  </tr>
                </thead>
                <tbody>
                  {['SUPPORTED', 'CONTRADICTED', 'UNSUPPORTED', 'AMBIGUOUS'].map((actualCls) => (
                    <tr key={actualCls} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '8px 12px', fontWeight: '700', color: 'var(--text-secondary)' }}>{actualCls}</td>
                      {['SUPPORTED', 'CONTRADICTED', 'UNSUPPORTED', 'AMBIGUOUS'].map((predCls) => {
                        const val = confusionMatrix[actualCls]?.[predCls] ?? 0;
                        const isDiagonal = actualCls === predCls;
                        return (
                          <td
                            key={predCls}
                            style={{
                              padding: '8px 12px',
                              textAlign: 'center',
                              fontWeight: isDiagonal && val > 0 ? '700' : '400',
                              color: isDiagonal && val > 0 ? 'var(--color-supported)' : (val > 0 ? 'var(--color-contradicted)' : 'var(--text-muted)'),
                              background: isDiagonal && val > 0 ? 'rgba(34, 197, 94, 0.05)' : 'transparent',
                            }}
                          >
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )} */}

        {/* 8 Held-Out Case Breakdown */}
        {heldOutMetrics?.case_results && (
          <div>
            <h4 style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
              8 Held-Out Benchmark Cases Breakdown ({heldOutMetrics.total_claims_evaluated} claims total)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
              {heldOutMetrics.case_results.map((c) => (
                <div key={c.id} style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  fontSize: '0.82rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{c.title}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                      Domain: {c.domain} • {c.total_claims} claims
                    </div>
                  </div>
                  <span style={{ color: c.accuracy === 100 ? 'var(--color-supported)' : 'var(--color-unsupported)', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
                    {c.accuracy}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────────────
          2. IN-SAMPLE DEV BENCHMARK RESULTS (6 Standard Demo Cases)
      ────────────────────────────────────────────────────────────────────── */}
      {/* <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={20} color="var(--brand-accent)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>Development Cases Benchmark (6 Planted Error Scenarios)</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.72rem',
              padding: '2px 8px',
              borderRadius: '12px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
            }}>
              Unit: {metrics.evaluation_unit || 'Atomic claim verdicts'} (N = {metrics.evaluation_denominator || metrics.total_claims_evaluated})
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Small sample; evaluated by our team; not a general accuracy claim.
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <CheckCircle2 size={16} />
              <span style={{ fontSize: '0.85rem' }}>Claim Accuracy</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-supported)' }}>
              {metrics.overall_accuracy}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {metrics.correct_verdicts} of {metrics.total_claims_evaluated} exact matches
            </div>
          </div>

          <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <ShieldAlert size={16} />
              <span style={{ fontSize: '0.85rem' }}>Planted Errors Caught</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--brand-accent)' }}>
              {metrics.planted_errors_caught} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {metrics.total_planted_errors}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              True Positives
            </div>
          </div>

          <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <ShieldAlert size={16} />
              <span style={{ fontSize: '0.85rem' }}>False Positive Rate</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: metrics.fpr_planted_errors === 0 ? 'var(--color-supported)' : 'var(--color-contradicted)' }}>
              {metrics.fpr_planted_errors ?? 0}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              0 benign claims flagged as errors
            </div>
          </div>

          <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Crosshair size={16} />
                <span style={{ fontSize: '0.85rem' }}>CONTRADICTED</span>
              </div>
              <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', background: 'var(--bg-secondary)', padding: '1px 6px', borderRadius: '4px' }}>
                N = {metrics.verdict_class_counts?.CONTRADICTED ?? 11}
              </span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-contradicted)' }}>
              {metrics.precision_contradicted}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Recall: {metrics.recall_contradicted}% • FPR: {metrics.fpr_contradicted ?? 0}%
            </div>
          </div>

          <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Crosshair size={16} />
                <span style={{ fontSize: '0.85rem' }}>UNSUPPORTED</span>
              </div>
              <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', background: 'var(--bg-secondary)', padding: '1px 6px', borderRadius: '4px' }}>
                N = {metrics.verdict_class_counts?.UNSUPPORTED ?? 7}
              </span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-unsupported)' }}>
              {metrics.precision_unsupported}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Recall: {metrics.recall_unsupported}% • FPR: {metrics.fpr_unsupported ?? 0}%
            </div>
          </div>

          <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Crosshair size={16} />
                <span style={{ fontSize: '0.85rem' }}>AMBIGUOUS</span>
              </div>
              <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', background: 'var(--bg-secondary)', padding: '1px 6px', borderRadius: '4px' }}>
                N = {metrics.verdict_class_counts?.AMBIGUOUS ?? 2}
              </span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-ambiguous)' }}>
              {metrics.precision_ambiguous ?? 100}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Recall: {metrics.recall_ambiguous ?? 100}% • FPR: {metrics.fpr_ambiguous ?? 0}%
            </div>
          </div>
        </div>

        
        <div>
          <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
            Development Cases Breakdown
          </h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {metrics.case_results.map((c) => {
              const isControl = c.is_control || c.total_errors === 0 || c.id === 'fully_correct';
              return (
                <div key={c.id} style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px',
                  fontSize: '0.82rem'
                }}>
                  <span style={{ fontWeight: '600', marginRight: '10px' }}>{c.title}</span>
                  {isControl ? (
                    <span style={{ color: 'var(--color-supported)', fontWeight: '700' }}>
                      0 false positives
                    </span>
                  ) : (
                    <span style={{ color: c.accuracy === 100 ? 'var(--color-supported)' : 'var(--color-contradicted)', fontWeight: '700' }}>
                      {c.accuracy}% caught ({c.caught}/{c.total_errors})
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div> */}

    </div>
  );
}
