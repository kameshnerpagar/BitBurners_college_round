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
    medical_faq: 'Tests whether the system catches incorrect dosage information and potentially unsafe medical advice.',
    climate_stats: 'Tests the system\'s ability to find incorrect percentages and conclusions that don\'t match the source.',
    tenant_rights: 'Tests whether the system catches made-up legal references, incorrect claims, and potentially unsafe legal advice.',
    leave_policy: 'Tests how the system handles conflicting leave rules, unclear policies, and clauses that don\'t match the source.',
    fully_correct: 'A control test with correct historical facts to check whether the system avoids flagging claims that are supported by the source.',
    prompt_injection: 'Checks whether the system can ignore malicious instructions hidden in the input and continue checking claims against the source.',
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
            Preset Test Cases (With Known Errors)
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
