import React from 'react';
import {
  Filter,
  Search,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  ShieldAlert,
  X
} from 'lucide-react';

export default function FilterBar({
  selectedVerdict = 'ALL',
  onSelectVerdict,
  selectedSeverity = 'ALL',
  onSelectSeverity,
  searchQuery,
  onSearchChange,
  showOnlyHumanReview,
  onToggleHumanReview,
  counts = {},
  severityCounts = {},
  viewMode,
  setViewMode,
}) {
  const verdicts = [
    {
      id: 'ALL',
      label: 'All Findings',
      count: (counts.SUPPORTED || 0) + (counts.CONTRADICTED || 0) + (counts.UNSUPPORTED || 0) + (counts.AMBIGUOUS || 0),
      icon: <Filter size={13} />,
    },
    {
      id: 'CONTRADICTED',
      label: 'Contradicted',
      count: counts.CONTRADICTED || 0,
      color: 'var(--color-contradicted)',
      icon: <XCircle size={13} />,
    },
    {
      id: 'UNSUPPORTED',
      label: 'Unsupported',
      count: counts.UNSUPPORTED || 0,
      color: 'var(--color-unsupported)',
      icon: <AlertTriangle size={13} />,
    },
    {
      id: 'AMBIGUOUS',
      label: 'Ambiguous',
      count: counts.AMBIGUOUS || 0,
      color: 'var(--color-ambiguous)',
      icon: <HelpCircle size={13} />,
    },
    {
      id: 'SUPPORTED',
      label: 'Supported',
      count: counts.SUPPORTED || 0,
      color: 'var(--color-supported)',
      icon: <CheckCircle2 size={13} />,
    },
  ];

  const severities = [
    { id: 'ALL', label: 'All Severities' },
    { id: 'HIGH', label: 'High Risk', color: 'var(--color-contradicted)' },
    { id: 'MEDIUM', label: 'Medium Risk', color: 'var(--color-unsupported)' },
    { id: 'LOW', label: 'Low Risk', color: 'var(--color-ambiguous)' },
  ];

  return (
    <div className="glass-panel" style={{
      padding: '12px 16px',
      marginBottom: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      {/* Top Filter Row: Verdicts & Severity & Review */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        {/* Verdict Filter Buttons */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }} role="toolbar" aria-label="Filter by verdict">
          {verdicts.map((v) => {
            const isActive = selectedVerdict === v.id;
            return (
              <button
                key={v.id}
                onClick={() => onSelectVerdict(v.id)}
                className="btn btn-sm"
                aria-pressed={isActive}
                style={{
                  background: isActive ? 'var(--bg-elevated)' : 'var(--bg-secondary)',
                  borderColor: isActive ? (v.color || 'var(--brand-accent)') : 'var(--border-color)',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? '700' : '500',
                  boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                }}
              >
                <span style={{ color: v.color || 'var(--text-muted)', display: 'inline-flex' }}>
                  {v.icon}
                </span>
                <span>{v.label}</span>
                <span style={{
                  fontSize: '0.72rem',
                  padding: '1px 7px',
                  borderRadius: 'var(--radius-sm)',
                  background: isActive ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                  color: isActive && v.color ? v.color : 'var(--text-muted)',
                  fontWeight: '600',
                }}>
                  {v.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Severity Selector & Human Review Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {onSelectSeverity && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={14} style={{ color: 'var(--text-muted)' }} />
              <select
                value={selectedSeverity}
                onChange={(e) => onSelectSeverity(e.target.value)}
                aria-label="Filter by computed severity"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  outline: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-main)',
                }}
              >
                {severities.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={onToggleHumanReview}
            className="btn btn-sm"
            aria-pressed={showOnlyHumanReview}
            style={{
              background: showOnlyHumanReview ? 'var(--color-ambiguous-bg)' : 'var(--bg-secondary)',
              borderColor: showOnlyHumanReview ? 'var(--color-ambiguous-border)' : 'var(--border-color)',
              color: showOnlyHumanReview ? 'var(--color-ambiguous)' : 'var(--text-secondary)',
              fontWeight: showOnlyHumanReview ? '700' : '500',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Filter items marked for manual human verification"
          >
            <UserCheck size={14} />
            <span>Needs Review</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Search Box & View Mode Toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        paddingTop: '8px',
        borderTop: '1px solid var(--border-color)',
      }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          flex: 1,
          maxWidth: '460px',
        }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search claims, reasoning, or evidence quotes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 30px 6px 32px',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              outline: 'none',
              fontFamily: 'var(--font-main)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute',
                right: '8px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
              }}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Layout:
          </span>
          <div style={{
            background: 'var(--bg-secondary)',
            padding: '2px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            gap: '2px',
            border: '1px solid var(--border-color)',
          }}>
            <button
              onClick={() => setViewMode('split')}
              className="btn btn-sm"
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                background: viewMode === 'split' ? 'var(--bg-elevated)' : 'transparent',
                color: viewMode === 'split' ? 'var(--text-primary)' : 'var(--text-muted)',
                border: viewMode === 'split' ? '1px solid var(--border-color)' : '1px solid transparent',
                boxShadow: viewMode === 'split' ? 'var(--shadow-sm)' : 'none',
                borderRadius: 'calc(var(--radius-sm) - 2px)',
              }}
              title="Split-Screen View (Source + AI Answer side by side)"
            >
              Split
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="btn btn-sm"
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                background: viewMode === 'list' ? 'var(--bg-elevated)' : 'transparent',
                color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-muted)',
                border: viewMode === 'list' ? '1px solid var(--border-color)' : '1px solid transparent',
                boxShadow: viewMode === 'list' ? 'var(--shadow-sm)' : 'none',
                borderRadius: 'calc(var(--radius-sm) - 2px)',
              }}
              title="Claim List View"
            >
              List
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
