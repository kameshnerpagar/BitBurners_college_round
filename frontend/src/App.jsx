import React, { useState, useEffect } from 'react';
import {
  Shield,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Sliders,
  Play,
  Edit2,
} from 'lucide-react';
import DemoLoader from './components/DemoLoader';
import BenchmarkResults from './components/BenchmarkResults';
import InputForm from './components/InputForm';
import AuditDashboard from './components/AuditDashboard';
import { fetchDemos, fetchDemo, auditDemo, auditCustom, checkHealth } from './utils/api';

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [activeTab, setActiveTab] = useState('workbench'); // 'benchmarks' | 'workbench'
  const [demos, setDemos] = useState([]);
  const [activeDemoId, setActiveDemoId] = useState(null);
  const [loadingDemo, setLoadingDemo] = useState(false);

  // Current working texts (workbench only — never shared with benchmarks)
  const [answerText, setAnswerText] = useState('');
  const [sourceText, setSourceText] = useState('');

  // Workbench audit state
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Benchmark tab state (kept separate so it never pollutes workbench)
  const [demoAnswerText, setDemoAnswerText] = useState('');
  const [demoSourceText, setDemoSourceText] = useState('');
  const [demoAuditResult, setDemoAuditResult] = useState(null);
  const [demoIsAuditing, setDemoIsAuditing] = useState(false);
  const [demoErrorMsg, setDemoErrorMsg] = useState('');

  // Workbench UI state
  const [inputSubmitted, setInputSubmitted] = useState(false);
  const [pendingAns, setPendingAns] = useState('');
  const [pendingSrc, setPendingSrc] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingFake, setPendingFake] = useState(false);

  // Initialize: load demo list only (no auto-select, so workbench stays blank)
  useEffect(() => {
    async function init() {
      try {
        const demoList = await fetchDemos();
        setDemos(demoList);
      } catch (err) {
        console.error('Failed to load demos:', err);
      }
    }
    init();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Benchmark tab: select & audit a demo (uses separate demo state)
  const handleSelectDemo = async (demoId) => {
    setActiveDemoId(demoId);
    setLoadingDemo(true);
    setDemoErrorMsg('');
    try {
      const demoData = await fetchDemo(demoId);
      setDemoAnswerText(demoData.answer_text);
      setDemoSourceText(demoData.source_text);

      setDemoIsAuditing(true);
      const res = await auditDemo(demoId);
      setDemoAuditResult(res);
    } catch (err) {
      setDemoErrorMsg(err.message || 'Failed to audit benchmark case');
    } finally {
      setLoadingDemo(false);
      setDemoIsAuditing(false);
    }
  };

  const handleReRunLive = async () => {
    if (!activeDemoId) return;
    setLoadingDemo(true);
    setDemoIsAuditing(true);
    setDemoErrorMsg('');
    try {
      const res = await auditCustom({ answerText: demoAnswerText, sourceText: demoSourceText });
      setDemoAuditResult(res);
    } catch (err) {
      setDemoErrorMsg(err.message || 'Failed to re-run live audit');
    } finally {
      setLoadingDemo(false);
      setDemoIsAuditing(false);
    }
  };

  // Called when user clicks "Audit Document" — immediately runs the audit
  const handleAuditSubmit = async ({ answerText: ans, sourceText: src, sourceFile, simulateFake }) => {
    setAnswerText(ans);
    setSourceText(src);
    setPendingAns(ans);
    setPendingSrc(src);
    setPendingFile(sourceFile);
    setPendingFake(simulateFake);
    setInputSubmitted(true);
    setAuditResult(null);
    setErrorMsg('');
    setIsAuditing(true);
    try {
      const res = await auditCustom({ answerText: ans, sourceText: src, sourceFile, simulateFakeEvidence: simulateFake });
      setAuditResult(res);
    } catch (err) {
      setErrorMsg(err.message || 'Audit execution failed');
    } finally {
      setIsAuditing(false);
    }
  };

  // Re-run audit with same inputs (from results dashboard)
  const handleReRunWorkbench = async () => {
    setIsAuditing(true);
    setErrorMsg('');
    try {
      const res = await auditCustom({ answerText: pendingAns, sourceText: pendingSrc, sourceFile: pendingFile, simulateFakeEvidence: pendingFake });
      setAuditResult(res);
    } catch (err) {
      setErrorMsg(err.message || 'Audit execution failed');
    } finally {
      setIsAuditing(false);
    }
  };

  // Edit inputs: go back to blank input form
  const handleEditInput = () => {
    setInputSubmitted(false);
    setAuditResult(null);
    setErrorMsg('');
  };



  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header style={{
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-elevated)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: '1360px',
          margin: '0 auto',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Logo & Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--brand-accent), #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <Shield size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                  Second Opinion
                </h1>
                {/* <span style={{
                  fontSize: '0.68rem',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontWeight: '600',
                  border: '1px solid var(--border-color)',
                }}>
                  v1.0
                </span> */}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Evidence-Grounded AI Auditing & Fact Verification
              </p>
            </div>
          </div>

          {/* Navigation & Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Mode Switcher */}
            <div style={{
              background: 'var(--bg-secondary)',
              padding: '4px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              gap: '4px',
              border: '1px solid var(--border-color)',
            }}>
              <button
                onClick={() => setActiveTab('benchmarks')}
                className="btn btn-sm"
                style={{
                  background: activeTab === 'benchmarks' ? 'var(--bg-elevated)' : 'transparent',
                  color: activeTab === 'benchmarks' ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: activeTab === 'benchmarks' ? '1px solid var(--border-color)' : '1px solid transparent',
                  boxShadow: activeTab === 'benchmarks' ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <Sparkles size={14} />
                <span>Benchmark Demos</span>
              </button>

              <button
                onClick={() => setActiveTab('workbench')}
                className="btn btn-sm"
                style={{
                  background: activeTab === 'workbench' ? 'var(--bg-elevated)' : 'transparent',
                  color: activeTab === 'workbench' ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: activeTab === 'workbench' ? '1px solid var(--border-color)' : '1px solid transparent',
                  boxShadow: activeTab === 'workbench' ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <Sliders size={14} />
                <span>Custom Workbench</span>
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="btn btn-sm"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
              title="Toggle Theme"
            >
              <Sparkles size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main style={{ maxWidth: '1360px', margin: '0 auto', padding: '24px', width: '100%', flex: 1 }}>
        {/* Error notification banner */}
        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            padding: '12px 18px',
            background: 'var(--color-contradicted-bg)',
            border: '1px solid var(--color-contradicted-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-contradicted)',
            marginBottom: '20px',
            fontSize: '0.88rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
            {!hasAnyKey && (
              <button
                onClick={() => setShowKeyModal(true)}
                className="btn btn-sm btn-primary"
                style={{ fontSize: '0.78rem', padding: '4px 10px' }}
              >
                Set API Key
              </button>
            )}
          </div>
        )}

        {/* Tab 1: Planted-Error Benchmark Cases */}
        {activeTab === 'benchmarks' && (
          <>
            {demoErrorMsg && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 18px',
                background: 'var(--color-contradicted-bg)',
                border: '1px solid var(--color-contradicted-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-contradicted)',
                marginBottom: '20px', fontSize: '0.88rem',
              }}>
                <AlertCircle size={18} />
                <span>{demoErrorMsg}</span>
              </div>
            )}
            <BenchmarkResults />
            <DemoLoader
              demos={demos}
              activeDemoId={activeDemoId}
              onSelectDemo={handleSelectDemo}
              loadingDemo={loadingDemo}
            />
            {demoIsAuditing && (
              <div className="glass-panel pulse" style={{ padding: '36px', textAlign: 'center', marginBottom: '24px' }}>
                <RefreshCw size={28} className="spinning" style={{ color: 'var(--text-primary)', margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Executing 8-Stage Audit Pipeline...
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Ingesting source ➔ Extracting atomic claims ➔ BM25 passage matching ➔ Verifying verbatim quotes ➔ Logic &amp; Safety review
                </p>
              </div>
            )}
            {!demoIsAuditing && demoAuditResult && (
              <AuditDashboard
                auditResult={demoAuditResult}
                sourceText={demoSourceText}
                answerText={demoAnswerText}
                onReRunLive={handleReRunLive}
              />
            )}
          </>
        )}

        {/* Tab 2: Custom Audit Workbench */}
        {activeTab === 'workbench' && (
          <>
            {/* Step 1: Input Form — clicking Audit Document immediately runs the audit */}
            {!inputSubmitted ? (
              <InputForm
                initialAnswer=""
                initialSource=""
                onSubmit={handleAuditSubmit}
                isAuditing={isAuditing}
                collapsed={false}
              />
            ) : (
              /* Step 2: Collapsed input summary + Edit button */
              <div className="glass-panel" style={{
                padding: '16px 24px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <strong>Answer:</strong> {pendingAns.length} chars
                  </span>
                  <span style={{ width: '1px', height: '16px', background: 'var(--border-color)', display: 'inline-block' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <strong>Source:</strong> {pendingFile ? pendingFile.name : `${pendingSrc.length} chars`}
                  </span>
                </div>
                <button onClick={handleEditInput} className="btn btn-secondary btn-sm">
                  <Edit2 size={14} />
                  <span>Edit Inputs</span>
                </button>
              </div>
            )}

            {/* Step 3: Loading indicator while audit runs */}
            {isAuditing && (
              <div className="glass-panel pulse" style={{ padding: '36px', textAlign: 'center', marginBottom: '24px' }}>
                <RefreshCw size={28} className="spinning" style={{ color: 'var(--text-primary)', margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Executing 8-Stage Audit Pipeline...
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Ingesting source ➔ Extracting atomic claims ➔ BM25 passage matching ➔ Verifying verbatim quotes ➔ Logic &amp; Safety review
                </p>
              </div>
            )}

            {/* Step 4: Audit Results Dashboard */}
            {!isAuditing && auditResult && (
              <AuditDashboard
                auditResult={auditResult}
                sourceText={sourceText}
                answerText={answerText}
                onReRunLive={handleReRunWorkbench}
              />
            )}
          </>
        )}
      </main>



      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '24px',
        background: 'var(--bg-elevated)',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
      }}>
        <div style={{
          maxWidth: '1360px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div>
            <strong>Second Opinion</strong> — AI Hallucination & Evidence Verification System. Built for Hackathon 2026.
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>FastAPI + Gemini Flash / Groq Fallback</span>
            <span>•</span>
            <span>BM25 Retrieval</span>
            <span>•</span>
            <span>Normalized Quote Matcher</span>
            <span>•</span>
            <span>Char Span Localizer</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
