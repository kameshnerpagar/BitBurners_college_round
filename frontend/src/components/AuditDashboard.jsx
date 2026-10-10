import React, { useState, useEffect } from 'react';
import ScoreCard from './ScoreCard';
import FilterBar from './FilterBar';
import AnswerHighlighter from './AnswerHighlighter';
import SourceViewer from './SourceViewer';
import ClaimDetail from './ClaimDetail';
import CorrectedAnswerView from './CorrectedAnswerView';
import { Layers, ListChecks, Filter, Sparkles } from 'lucide-react';
import { downloadJsonFile } from '../utils/api';

export default function AuditDashboard({
  auditResult,
  sourceText,
  answerText,
  onReRunLive,
}) {
  const [dashboardTab, setDashboardTab] = useState('findings'); // 'findings' | 'corrected'
  const [selectedClaimId, setSelectedClaimId] = useState(null);
  const [selectedVerdict, setSelectedVerdict] = useState('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyHumanReview, setShowOnlyHumanReview] = useState(false);
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'list'

  if (!auditResult) return null;

  const claims = auditResult.claims || [];

  // Filter claims based on user controls (verdict, review status, severity, and search)
  const filteredClaims = claims.filter((c) => {
    if (selectedVerdict !== 'ALL' && c.verdict !== selectedVerdict) return false;
    if (selectedSeverity !== 'ALL' && c.severity !== selectedSeverity) return false;
    if (showOnlyHumanReview && !c.needs_human_review) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inClaim = (c.claim || '').toLowerCase().includes(q);
      const inExpl = (c.explanation || '').toLowerCase().includes(q);
      const inQuote = (c.evidence_quotes || []).some(eq =>
        (typeof eq === 'string' ? eq : eq.quote || '').toLowerCase().includes(q)
      );
      if (!inClaim && !inExpl && !inQuote) return false;
    }
    return true;
  });

  // Clear selection when 0 results, or keep selection valid within filtered claims
  useEffect(() => {
    if (filteredClaims.length === 0) {
      if (selectedClaimId !== null) {
        setSelectedClaimId(null);
      }
    } else if (!selectedClaimId || !filteredClaims.some((c) => c.id === selectedClaimId)) {
      setSelectedClaimId(filteredClaims[0].id);
    }
  }, [selectedVerdict, selectedSeverity, showOnlyHumanReview, searchQuery, filteredClaims.length]);

  const selectedClaim = filteredClaims.length === 0
    ? null
    : (filteredClaims.find((c) => c.id === selectedClaimId) || filteredClaims[0]);
  const selectedIndex = selectedClaim ? filteredClaims.findIndex((c) => c.id === selectedClaim.id) : -1;

  const handleNext = () => {
    if (selectedIndex >= 0 && selectedIndex < filteredClaims.length - 1) {
      setSelectedClaimId(filteredClaims[selectedIndex + 1].id);
    }
  };

  const handlePrev = () => {
    if (selectedIndex > 0) {
      setSelectedClaimId(filteredClaims[selectedIndex - 1].id);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input (like search)
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
      if (e.key === 'j' || e.key === 'J' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'k' || e.key === 'K' || e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, filteredClaims]);

  const handleExportJson = () => {
    const filename = `second-opinion-audit-${new Date().toISOString().slice(0, 10)}.json`;
    downloadJsonFile(filename, auditResult);
  };

  const handleExportPdf = () => {
    window.print();
  };

  return (
    <div>
      {/* 1. Overall Score Card */}
      <ScoreCard
        auditResult={auditResult}
        onReRunLive={onReRunLive}
        selectedVerdict={selectedVerdict}
        onSelectVerdict={setSelectedVerdict}
        onExportJson={handleExportJson}
        onExportPdf={handleExportPdf}
      />

      {/* Dashboard View Switcher */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{
          display: 'flex',
          gap: '6px',
          background: 'var(--bg-secondary)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
        }}>
          <button
            onClick={() => setDashboardTab('findings')}
            className="btn btn-sm"
            style={{
              background: dashboardTab === 'findings' ? 'var(--bg-elevated)' : 'transparent',
              color: dashboardTab === 'findings' ? 'var(--text-primary)' : 'var(--text-muted)',
              border: dashboardTab === 'findings' ? '1px solid var(--border-color)' : '1px solid transparent',
              boxShadow: dashboardTab === 'findings' ? 'var(--shadow-sm)' : 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Layers size={14} />
            <span>Audit Findings ({claims.length})</span>
          </button>

          <button
            onClick={() => setDashboardTab('corrected')}
            className="btn btn-sm"
            style={{
              background: dashboardTab === 'corrected' ? 'var(--bg-elevated)' : 'transparent',
              color: dashboardTab === 'corrected' ? 'var(--text-primary)' : 'var(--text-muted)',
              border: dashboardTab === 'corrected' ? '1px solid var(--border-color)' : '1px solid transparent',
              boxShadow: dashboardTab === 'corrected' ? 'var(--shadow-sm)' : 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={14} />
            <span>Correction Draft</span>
            {auditResult.corrected_answer && (auditResult.corrected_answer.corrected_count > 0 || auditResult.corrected_answer.qualified_count > 0) && (
              <span style={{
                fontSize: '0.68rem',
                padding: '2px 7px',
                borderRadius: '10px',
                background: 'var(--color-contradicted-bg)',
                color: 'var(--color-contradicted)',
                fontWeight: '700',
                border: '1px solid var(--color-contradicted-border)',
              }}>
                {auditResult.corrected_answer.corrected_count + auditResult.corrected_answer.qualified_count} revised
              </span>
            )}
          </button>
        </div>
      </div>

      {dashboardTab === 'corrected' ? (
        <CorrectedAnswerView
          correctedAnswer={auditResult.corrected_answer}
          originalAnswer={answerText || auditResult.answer_text}
        />
      ) : (
        <>
          {/* 2. Interactive Filters */}
          <FilterBar
            selectedVerdict={selectedVerdict}
            onSelectVerdict={setSelectedVerdict}
            selectedSeverity={selectedSeverity}
            onSelectSeverity={setSelectedSeverity}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            showOnlyHumanReview={showOnlyHumanReview}
            onToggleHumanReview={() => setShowOnlyHumanReview(!showOnlyHumanReview)}
            counts={auditResult.verdict_counts}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />

      {filteredClaims.length === 0 ? (
        <div className="glass-panel" style={{
          padding: '60px 24px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
          minHeight: '320px',
          marginBottom: '24px',
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
            <Filter size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
              No claims match the active filter
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto' }}>
              There are 0 findings matching your filter criteria. The selection has been cleared.
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedVerdict('ALL');
              setSearchQuery('');
              setShowOnlyHumanReview(false);
            }}
            className="btn btn-sm"
            style={{
              marginTop: '4px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className={`dashboard-grid ${viewMode === 'split' ? 'dashboard-grid-split' : 'dashboard-grid-list'}`}>
          {viewMode === 'split' ? (
            <>
              <div className="panel-fixed-height" style={{ minWidth: 0 }}>
                <AnswerHighlighter
                  answerText={answerText || auditResult.answer_text}
                  claims={claims}
                  selectedClaimId={selectedClaim?.id}
                  onSelectClaim={(c) => setSelectedClaimId(c.id)}
                  activeFilterVerdicts={selectedVerdict}
                  onlyHumanReview={showOnlyHumanReview}
                />
              </div>
              
              <div className="panel-fixed-height" style={{ minWidth: 0 }}>
                <SourceViewer
                  sourceText={sourceText || auditResult.source_text}
                  passages={auditResult.passages}
                  selectedClaim={selectedClaim}
                />
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              {/* Detailed Claim Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredClaims.map((c) => {
                  const isSelected = selectedClaim?.id === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedClaimId(c.id)}
                      className="glass-panel"
                      style={{
                        padding: '16px 20px',
                        cursor: 'pointer',
                        borderLeft: `4px solid var(--color-${c.verdict.toLowerCase()})`,
                        background: isSelected ? 'var(--bg-elevated)' : 'var(--bg-card)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className={`badge badge-${c.verdict.toLowerCase()}`}>
                            {c.verdict}
                          </span>
                          <span style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                            {c.claim}
                          </span>
                        </div>
                        {(() => {
                          const confVal = typeof c.confidence === 'number' ? (c.confidence > 1 ? c.confidence : c.confidence * 100) : 0;
                          const band = confVal >= 85 ? 'High' : confVal >= 60 ? 'Medium' : 'Low';
                          const pct = Math.round(confVal);
                          return (
                            <span
                              style={{ fontSize: '0.78rem', color: 'var(--text-muted)', cursor: 'help' }}
                              title={`${pct}% (heuristic, uncalibrated)`}
                            >
                              {band} Certainty
                            </span>
                          );
                        })()}
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {c.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sticky Sidebar Claim Inspector */}
          <div style={{ position: 'sticky', top: '100px' }}>
            <ClaimDetail 
              claim={selectedClaim} 
              onNext={selectedIndex < filteredClaims.length - 1 ? handleNext : null}
              onPrev={selectedIndex > 0 ? handlePrev : null}
              index={selectedIndex + 1}
              total={filteredClaims.length}
            />
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
