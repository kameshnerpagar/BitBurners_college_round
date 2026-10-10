import React from 'react';
import { Stethoscope, Leaf, Scale, Play, RefreshCw, Briefcase, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function DemoLoader({
  demos = [],
  activeDemoId,
  onSelectDemo,
  loadingDemo,
}) {
  const demoIcons = {
    medical_faq: <Stethoscope size={18} style={{ color: '#f43f5e' }} />,
    climate_stats: <Leaf size={18} style={{ color: '#10b981' }} />,
    tenant_rights: <Scale size={18} style={{ color: '#8b5cf6' }} />,
    leave_policy: <Briefcase size={18} style={{ color: '#38bdf8' }} />,
    fully_correct: <CheckCircle2 size={18} style={{ color: '#22c55e' }} />,
    prompt_injection: <ShieldAlert size={18} style={{ color: '#f59e0b' }} />,
  };

  const demoSubtitles = {
    medical_faq: 'Pediatric aspirin advice with contradicted dosage and unsafe recommendation',
    climate_stats: 'Global energy statistics with contradicted percentages and bad inferences',
    tenant_rights: 'California lease summary with fabricated precedents and unsafe legal advice',
    leave_policy: 'Corporate PTO and sick leave policy with contradicted days, ambiguous rules, and fabricated clauses',
    fully_correct: 'Historical facts about Paris and the Eiffel Tower verifying control performance without hallucinations',
    prompt_injection: 'Adversarial system prompt injection attempt trying to force false SUPPORTED verdicts',
  };

  // Fallback ground-truth counts if not already present on demo object
  const gtCounts = {
    medical_faq: 5,
    climate_stats: 4,
    tenant_rights: 5,
    leave_policy: 4,
    fully_correct: 0,
    prompt_injection: 2,
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            Preset Benchmark Cases (With Planted Ground-Truth Errors)
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Select any test case below to inspect how the pipeline catches hallucinations, logical flaws, and safety risks.
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '12px',
      }}>
        {demos.map((d) => {
          const isActive = activeDemoId === d.id;
          const icon = demoIcons[d.id] || <Play size={16} />;
          const subtitle = demoSubtitles[d.id] || 'Planted error scenario';
          const errorCount = d.planted_errors_count !== undefined ? d.planted_errors_count : (gtCounts[d.id] ?? 0);

          let countLabel = `${errorCount} planted error${errorCount === 1 ? '' : 's'}`;
          if (d.id === 'fully_correct') {
            countLabel = 'Control case: 0 planted errors';
          } else if (d.id === 'prompt_injection') {
            countLabel = `Tests prompt injection defense (${errorCount} planted errors)`;
          }

          return (
            <div
              key={d.id}
              onClick={() => !loadingDemo && onSelectDemo(d.id)}
              className="glass-panel"
              style={{
                padding: '16px',
                cursor: loadingDemo ? 'wait' : 'pointer',
                borderColor: isActive ? 'var(--brand-cyan)' : 'var(--border-color)',
                background: isActive ? 'rgba(56, 189, 248, 0.08)' : 'var(--bg-card)',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {icon}
                  <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#f8fafc' }}>
                    {d.title}
                  </span>
                </div>
                {isActive && loadingDemo && (
                  <RefreshCw size={14} className="spinning" style={{ color: 'var(--brand-cyan)' }} />
                )}
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '10px' }}>
                {subtitle}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                <span style={{ color: 'var(--brand-cyan)', fontWeight: '500' }}>
                  {isActive ? 'Currently Loaded' : 'Click to Load & Audit'}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {countLabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
