import React, { useState } from 'react';
import { UploadCloud, Play, FileText, Check, AlertCircle, Camera, RefreshCw } from 'lucide-react';

export default function InputForm({
  initialAnswer = '',
  initialSource = '',
  onSubmit,
  isAuditing = false,
  collapsed = false,
  onEdit,
}) {
  const [answerText, setAnswerText] = useState(initialAnswer);
  const [sourceText, setSourceText] = useState(initialSource);
  const [sourceFile, setSourceFile] = useState(null);
  const [simulateFake, setSimulateFake] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Keep state in sync if initial values change from demo select
  React.useEffect(() => {
    setAnswerText(initialAnswer);
    setSourceText(initialSource);
    setSourceFile(null);
  }, [initialAnswer, initialSource]);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_TEXT_LEN = 100000; // 100,000 characters

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!answerText.trim()) {
      setErrorMsg('Please provide an AI-generated answer to audit.');
      return;
    }

    if (answerText.length > MAX_TEXT_LEN) {
      setErrorMsg(`AI answer exceeds maximum allowed length of ${MAX_TEXT_LEN.toLocaleString()} characters.`);
      return;
    }

    if (!sourceText.trim() && !sourceFile) {
      setErrorMsg('Please provide source ground-truth text or upload a source document (.txt or .pdf).');
      return;
    }

    if (sourceText.length > MAX_TEXT_LEN) {
      setErrorMsg(`Source text exceeds maximum allowed length of ${MAX_TEXT_LEN.toLocaleString()} characters.`);
      return;
    }

    const ALLOWED_EXTS = ['.txt', '.pdf', '.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff'];

    if (sourceFile) {
      const ext = '.' + sourceFile.name.split('.').pop().toLowerCase();
      if (!ALLOWED_EXTS.includes(ext)) {
        setErrorMsg('Invalid file type. Supported: text (.txt), PDF (.pdf), and clicked/scanned images (.png, .jpg, .jpeg, .webp).');
        return;
      }
      if (sourceFile.size === 0) {
        setErrorMsg('Uploaded file is empty.');
        return;
      }
      if (sourceFile.size > MAX_FILE_SIZE) {
        setErrorMsg(`File size exceeds 10MB limit (${(sourceFile.size / (1024 * 1024)).toFixed(1)}MB).`);
        return;
      }
    }

    onSubmit({
      answerText,
      sourceText: sourceFile ? '' : sourceText,
      sourceFile,
      simulateFake,
    });
  };

  if (collapsed) {
    return (
      <div className="glass-panel" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <FileText size={16} />
            <span style={{ fontSize: '0.85rem' }}><strong>Answer:</strong> {answerText.length} chars</span>
          </div>
          <div style={{ width: '1px', height: '16px', background: 'var(--border-color)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <FileText size={16} />
            <span style={{ fontSize: '0.85rem' }}><strong>Source:</strong> {sourceFile ? sourceFile.name : `${sourceText.length} chars`}</span>
          </div>
        </div>
        <button onClick={onEdit} className="btn btn-secondary btn-sm">
          Edit Inputs
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            Custom Audit Workbench
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Input the AI-generated response and the ground-truth reference material you want to verify it against.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          background: 'var(--color-contradicted-bg)',
          border: '1px solid var(--color-contradicted-border)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--color-contradicted)',
          fontSize: '0.85rem',
          marginBottom: '16px',
        }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        {/* Answer Input */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              1. AI-Generated Answer to Audit
            </label>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {answerText.length} characters
            </span>
          </div>
          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder=""
            rows={10}
            style={{
              width: '100%',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              fontFamily: 'var(--font-main)',
              lineHeight: 1.6,
              resize: 'vertical',
              outline: 'none',
            }}
          />
        </div>

        {/* Source Input */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              2. Ground-Truth Source Document
            </label>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {sourceFile ? sourceFile.name : `${sourceText.length} characters`}
            </span>
          </div>

          <textarea
            value={sourceText}
            onChange={(e) => {
              setSourceText(e.target.value);
              setSourceFile(null);
            }}
            disabled={!!sourceFile}
            placeholder=""
            rows={7}
            style={{
              width: '100%',
              background: sourceFile ? 'var(--bg-primary)' : 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              fontFamily: 'var(--font-main)',
              lineHeight: 1.6,
              resize: 'vertical',
              outline: 'none',
              marginBottom: '10px',
            }}
          />

          {/* File Upload Option */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: 'var(--bg-secondary)',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            flexWrap: 'wrap',
            gap: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Camera size={16} style={{ color: 'var(--brand-accent)' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                  {sourceFile ? `Loaded: ${sourceFile.name}` : 'Upload scanned doc, clicked photo, or file'}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Supports .pdf (incl. scanned), .jpg, .jpeg, .png, .webp, .txt (Vision OCR enabled)
                </span>
              </div>
            </div>

            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
              <span>{sourceFile ? 'Change File' : 'Browse / Click'}</span>
              <input
                type="file"
                accept=".txt,.pdf,.png,.jpg,.jpeg,.webp,.bmp"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSourceFile(e.target.files[0]);
                    setSourceText('');
                  }
                }}
              />
            </label>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            id="fake-evidence"
            checked={simulateFake}
            onChange={(e) => setSimulateFake(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          <label htmlFor="fake-evidence" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }} title="Simulate a hallucinated quote to test the verifier">
            Simulate fabricated evidence
          </label>
        </div>
        <button
          type="submit"
          disabled={isAuditing}
          className="btn btn-primary"
          style={{ minWidth: '160px' }}
        >
          {isAuditing ? (
            <>
              <RefreshCw size={16} className="spinning" style={{ display: 'inline-block' }} />
              <span>Running Audit Pipeline...</span>
            </>
          ) : (
            <>
              <Play size={16} />
              <span>Audit Document</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
