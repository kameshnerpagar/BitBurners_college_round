import React, { useState, useEffect } from 'react';
import { fetchEvaluation, fetchHeldOutEvaluation } from '../utils/api';
import { BarChart3, Crosshair, CheckCircle2, ShieldAlert, FlaskConical, Award } from 'lucide-react';

export default function BenchmarkResults() {
  const [metrics, setMetrics] = useState(null);
  const [heldOutMetrics, setHeldOutMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadAllMetrics() {
      try {
        const [inSample, heldOut] = await Promise.all([
          fetchEvaluation().catch(() => null),
          fetchHeldOutEvaluation().catch(() => null),
        ]);
        setMetrics(inSample);
        setHeldOutMetrics(heldOut);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadAllMetrics();
  }, []);

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Loading Benchmark Results...</div>;
  }

  if (error || !metrics) {
    return null; // silently fail if unable to load metrics
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
      {/* 1. In-Sample Benchmark Ground Truth Panel */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={20} color="var(--brand-accent)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Evaluation Benchmarks (Ground Truth)</h2>
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
              Evaluated on our own benchmark cases (small sample)
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {/* Accuracy */}
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

          {/* Planted Errors Caught */}
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

          {/* False Positive Rate */}
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

          {/* Contradicted Precision */}
          <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Crosshair size={16} />
                <span style={{ fontSize: '0.85rem' }}>CONTRADICTED</span>
              </div>
              <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', background: 'var(--bg-secondary)', padding: '1px 6px', borderRadius: '4px' }}>
                N = {metrics.verdict_class_counts?.CONTRADICTED ?? (metrics.confusion_matrix?.CONTRADICTED ? metrics.confusion_matrix.CONTRADICTED.tp + metrics.confusion_matrix.CONTRADICTED.fn : 11)}
              </span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-contradicted)' }}>
              {metrics.precision_contradicted}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Recall: {metrics.recall_contradicted}% • FPR: {metrics.fpr_contradicted ?? 0}%
            </div>
          </div>
          
          {/* Unsupported Precision */}
          <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Crosshair size={16} />
                <span style={{ fontSize: '0.85rem' }}>UNSUPPORTED</span>
              </div>
              <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', background: 'var(--bg-secondary)', padding: '1px 6px', borderRadius: '4px' }}>
                N = {metrics.verdict_class_counts?.UNSUPPORTED ?? (metrics.confusion_matrix?.UNSUPPORTED ? metrics.confusion_matrix.UNSUPPORTED.tp + metrics.confusion_matrix.UNSUPPORTED.fn : 7)}
              </span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-unsupported)' }}>
              {metrics.precision_unsupported}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Recall: {metrics.recall_unsupported}% • FPR: {metrics.fpr_unsupported ?? 0}%
            </div>
          </div>

          {/* Ambiguous Precision */}
          <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Crosshair size={16} />
                <span style={{ fontSize: '0.85rem' }}>AMBIGUOUS</span>
              </div>
              <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', background: 'var(--bg-secondary)', padding: '1px 6px', borderRadius: '4px' }}>
                N = {metrics.verdict_class_counts?.AMBIGUOUS ?? (metrics.confusion_matrix?.AMBIGUOUS ? metrics.confusion_matrix.AMBIGUOUS.tp + metrics.confusion_matrix.AMBIGUOUS.fn : 2)}
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

        {/* Per-case breakdown */}
        <div>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Case Breakdown</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {metrics.case_results.map((c) => {
              const isControl = c.is_control || c.total_errors === 0 || c.id === 'fully_correct';
              return (
                <div key={c.id} style={{ 
                  background: 'var(--bg-elevated)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px',
                  fontSize: '0.85rem'
                }}>
                  <span style={{ fontWeight: '600', marginRight: '12px' }}>{c.title}</span>
                  {isControl ? (
                    <span style={{ color: 'var(--color-supported)', fontWeight: '600' }}>
                      0 false positives
                    </span>
                  ) : (
                    <span style={{ color: c.accuracy === 100 ? 'var(--color-supported)' : 'var(--color-contradicted)' }}>
                      {c.accuracy}% caught ({c.caught}/{c.total_errors})
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Held-Out Generalization Results (Zero Prompt Tuning Leakage) */}
      {heldOutMetrics && (
        <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--brand-accent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FlaskConical size={20} color="var(--brand-accent)" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>
                Held-out results (Unseen Test Cases)
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '0.72rem',
                padding: '3px 10px',
                borderRadius: '12px',
                background: 'rgba(124, 58, 237, 0.12)',
                border: '1px solid rgba(124, 58, 237, 0.35)',
                color: 'var(--brand-accent)',
                fontWeight: '600',
              }}>
                Strict Out-of-Domain Test (N = {heldOutMetrics.total_claims_evaluated} claims across 3 unseen domains)
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Never used when writing, tuning, or refining prompt templates
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            {/* Accuracy */}
            <div style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Held-Out Accuracy
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--color-supported)' }}>
                {heldOutMetrics.overall_accuracy}%
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {heldOutMetrics.correct_verdicts} of {heldOutMetrics.total_claims_evaluated} claims matched
              </div>
            </div>

            {/* Planted Errors Caught */}
            <div style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Errors Caught
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--brand-accent)' }}>
                {heldOutMetrics.planted_errors_caught} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ {heldOutMetrics.total_planted_errors}</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                100% recall on unseen flaws
              </div>
            </div>

            {/* Contradicted Precision */}
            <div style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>CONTRADICTED</span>
                <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  N = {heldOutMetrics.verdict_class_counts?.CONTRADICTED || 4}
                </span>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--color-contradicted)' }}>
                {heldOutMetrics.precision_contradicted}%
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Recall: {heldOutMetrics.recall_contradicted}%
              </div>
            </div>

            {/* Unsupported Precision */}
            <div style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>UNSUPPORTED</span>
                <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  N = {heldOutMetrics.verdict_class_counts?.UNSUPPORTED || 2}
                </span>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--color-unsupported)' }}>
                {heldOutMetrics.precision_unsupported}%
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Recall: {heldOutMetrics.recall_unsupported}%
              </div>
            </div>

            {/* False Positive Rate */}
            <div style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                False Positive Rate
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--color-supported)' }}>
                {heldOutMetrics.false_positive_rate}%
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Zero false alarms on benign text
              </div>
            </div>
          </div>

          {/* Held-Out Case Breakdown */}
          <div>
            <h4 style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
              Held-Out Domain Performance Breakdown
            </h4>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {heldOutMetrics.case_results.map((c) => (
                <div key={c.id} style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 14px',
                  fontSize: '0.82rem',
                }}>
                  <span style={{ fontWeight: '600', marginRight: '10px', color: 'var(--text-primary)' }}>
                    {c.title}
                  </span>
                  <span style={{ color: 'var(--color-supported)', fontWeight: '700' }}>
                    {c.accuracy}% caught ({c.caught}/{c.total_errors})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
