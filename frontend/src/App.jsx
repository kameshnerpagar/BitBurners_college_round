import React, { useState, useEffect } from 'react';
import {
  Shield,
  CheckCircle2,
  FileCheck2,
  Cpu,
  Layers,
  Sparkles,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Sliders,
  HelpCircle,
  Key,
  X,
  Lock
} from 'lucide-react';
import DemoLoader from './components/DemoLoader';
import BenchmarkResults from './components/BenchmarkResults';
import InputForm from './components/InputForm';
import AuditDashboard from './components/AuditDashboard';
import { fetchDemos, fetchDemo, auditDemo, auditCustom, checkHealth, getKeyStatus, saveApiKeys } from './utils/api';

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [activeTab, setActiveTab] = useState('benchmarks'); // 'benchmarks' | 'workbench'
  const [demos, setDemos] = useState([]);
  const [activeDemoId, setActiveDemoId] = useState(null);
  const [loadingDemo, setLoadingDemo] = useState(false);

  // Current working texts
  const [answerText, setAnswerText] = useState('');
  const [sourceText, setSourceText] = useState('');

  // Audit state
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [backendOnline, setBackendOnline] = useState(false);

  // Key Settings Modal state
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyStatus, setKeyStatus] = useState({ gemini_configured: false, groq_configured: false });
  const [inputGeminiKey, setInputGeminiKey] = useState('');
  const [inputGroqKey, setInputGroqKey] = useState('');
  const [savingKeys, setSavingKeys] = useState(false);
  const [keySuccessMsg, setKeySuccessMsg] = useState('');

  // Initialize: test backend connection & load demo cases
  useEffect(() => {
    async function init() {
      try {
        await checkHealth();
        setBackendOnline(true);
        const keys = await getKeyStatus();
        setKeyStatus(keys);
      } catch (e) {
        setBackendOnline(false);
      }

      try {
        const demoList = await fetchDemos();
        setDemos(demoList);
        if (demoList.length > 0) {
          handleSelectDemo(demoList[0].id);
        }
      } catch (err) {
        console.error('Failed to load demos:', err);
      }
    }
    init();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleSelectDemo = async (demoId) => {
    setActiveDemoId(demoId);
    setLoadingDemo(true);
    setErrorMsg('');
    try {
      const demoData = await fetchDemo(demoId);
      setAnswerText(demoData.answer_text);
      setSourceText(demoData.source_text);

      setIsAuditing(true);
      const res = await auditDemo(demoId);
      setAuditResult(res);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to audit benchmark case');
    } finally {
      setLoadingDemo(false);
      setIsAuditing(false);
    }
  };

  const handleReRunLive = async () => {
    if (!activeDemoId) return;
    setLoadingDemo(true);
    setIsAuditing(true);
    setErrorMsg('');
    try {
      const res = await auditCustom({ answerText, sourceText });
      setAuditResult(res);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to re-run live audit');
    } finally {
      setLoadingDemo(false);
      setIsAuditing(false);
    }
  };

  const handleCustomSubmit = async ({ answerText: ans, sourceText: src, sourceFile, simulateFake }) => {
    setIsAuditing(true);
    setErrorMsg('');
    try {
      setAnswerText(ans);
      setSourceText(src);
      const res = await auditCustom({ answerText: ans, sourceText: src, sourceFile, simulateFakeEvidence: simulateFake });
      setAuditResult(res);
    } catch (err) {
      setErrorMsg(err.message || 'Audit execution failed');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleSaveKeys = async (e) => {
    e.preventDefault();
    setSavingKeys(true);
    setKeySuccessMsg('');
    try {
      const updated = await saveApiKeys({
        geminiKey: inputGeminiKey || undefined,
        groqKey: inputGroqKey || undefined,
      });
      setKeyStatus(updated);
      setKeySuccessMsg('API keys updated successfully!');
      setInputGeminiKey('');
      setInputGroqKey('');
      setTimeout(() => setKeySuccessMsg(''), 3000);
    } catch (err) {
      alert('Failed to save API keys: ' + err.message);
    } finally {
      setSavingKeys(false);
    }
  };

  const hasAnyKey = keyStatus.gemini_configured || keyStatus.groq_configured;

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
                <span style={{
                  fontSize: '0.68rem',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontWeight: '600',
                  border: '1px solid var(--border-color)',
                }}>
                  v1.0
                </span>
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

            {/* API Keys Configuration Button */}
            <button
              onClick={() => setShowKeyModal(true)}
              className="btn btn-sm"
              style={{
                background: hasAnyKey ? 'var(--color-supported-bg)' : 'var(--color-unsupported-bg)',
                borderColor: hasAnyKey ? 'var(--color-supported-border)' : 'var(--color-unsupported-border)',
                color: hasAnyKey ? 'var(--color-supported)' : 'var(--color-unsupported)',
              }}
              title="Configure Gemini or Groq API Keys"
            >
              <Key size={14} />
              <span>{hasAnyKey ? 'Keys Set' : 'Setup LLM'}</span>
            </button>

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

            {/* Backend Connectivity Indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              color: backendOnline ? 'var(--color-supported)' : 'var(--color-contradicted)',
              padding: '4px 10px',
              borderRadius: '9999px',
              background: backendOnline ? 'var(--color-supported-bg)' : 'var(--color-contradicted-bg)',
              border: `1px solid ${backendOnline ? 'var(--color-supported-border)' : 'var(--color-contradicted-border)'}`,
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: backendOnline ? 'var(--color-supported)' : 'var(--color-contradicted)',
              }} />
              <span>{backendOnline ? 'Engine Online' : 'Connecting'}</span>
            </div>
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
            <BenchmarkResults />
            <DemoLoader
              demos={demos}
              activeDemoId={activeDemoId}
              onSelectDemo={handleSelectDemo}
              loadingDemo={loadingDemo}
            />
          </>
        )}

        {/* Tab 2: Custom Audit Workbench */}
        {activeTab === 'workbench' && (
          <InputForm
            initialAnswer={answerText}
            initialSource={sourceText}
            onSubmit={handleCustomSubmit}
            isAuditing={isAuditing}
            collapsed={!!auditResult && !isAuditing}
            onEdit={() => setAuditResult(null)}
          />
        )}

        {/* Loading Indicator */}
        {isAuditing && (
          <div className="glass-panel pulse" style={{
            padding: '36px',
            textAlign: 'center',
            marginBottom: '24px',
          }}>
            <RefreshCw size={28} className="spinning" style={{ color: 'var(--text-primary)', margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              Executing 8-Stage Audit Pipeline...
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Ingesting source ➔ Extracting atomic claims ➔ BM25 passage matching ➔ Verifying verbatim quotes ➔ Logic & Safety review
            </p>
          </div>
        )}

        {/* Audit Results Dashboard */}
        {!isAuditing && auditResult && (
          <AuditDashboard
            auditResult={auditResult}
            sourceText={sourceText}
            answerText={answerText}
            onReRunLive={handleReRunLive}
          />
        )}
      </main>

      {/* Key Configuration Modal */}
      {showKeyModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px',
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '520px',
            padding: '24px',
            background: 'var(--bg-secondary)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={18} style={{ color: 'var(--brand-cyan)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>LLM API Keys (Free Tier)</h3>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
              Second Opinion uses free-tier LLMs with zero credit card required. Demo benchmarks run offline with pre-computed ground-truth fixtures, but custom audits require at least one provider key.
            </p>

            {keySuccessMsg && (
              <div style={{
                padding: '8px 12px',
                background: 'var(--color-supported-bg)',
                border: '1px solid var(--color-supported-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-supported)',
                fontSize: '0.82rem',
                marginBottom: '14px',
              }}>
                {keySuccessMsg}
              </div>
            )}

            <form onSubmit={handleSaveKeys}>
              {/* Gemini Key */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: '600' }}>
                    Google Gemini API Key (Primary Provider)
                  </label>
                  <span style={{ fontSize: '0.72rem', color: keyStatus.gemini_configured ? 'var(--color-supported)' : 'var(--text-muted)' }}>
                    {keyStatus.gemini_configured ? '● Configured' : 'Not Set'}
                  </span>
                </div>
                <input
                  type="password"
                  placeholder={keyStatus.gemini_configured ? '••••••••••••••••••••' : 'AIzaSy...'}
                  value={inputGeminiKey}
                  onChange={(e) => setInputGeminiKey(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none',
                  }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  Free key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}>Google AI Studio ↗</a>
                </span>
              </div>

              {/* Groq Key */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: '600' }}>
                    Groq API Key (Fallback Provider - Llama 3.3 70B)
                  </label>
                  <span style={{ fontSize: '0.72rem', color: keyStatus.groq_configured ? 'var(--color-supported)' : 'var(--text-muted)' }}>
                    {keyStatus.groq_configured ? '● Configured' : 'Not Set'}
                  </span>
                </div>
                <input
                  type="password"
                  placeholder={keyStatus.groq_configured ? '••••••••••••••••••••' : 'gsk_...'}
                  value={inputGroqKey}
                  onChange={(e) => setInputGroqKey(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none',
                  }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  Free key from <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}>Groq Cloud Console ↗</a>
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={savingKeys}
                  className="btn btn-primary btn-sm"
                >
                  {savingKeys ? 'Saving...' : 'Save API Keys'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
