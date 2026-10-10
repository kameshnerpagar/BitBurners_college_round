import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { uploadDocument, createAudit } from '../services/api';

export default function Home({ onAuditComplete }) {
  const [file, setFile] = useState(null);
  const [documentId, setDocumentId] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [status, setStatus] = useState('idle'); // idle, uploading, ready, auditing, error
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileDrop = async (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer?.files[0] || e.target.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      await handleUpload(droppedFile);
    } else {
      setErrorMsg('Please upload a valid PDF file.');
      setStatus('error');
    }
  };

  const handleUpload = async (fileToUpload) => {
    setFile(fileToUpload);
    setStatus('uploading');
    setErrorMsg('');
    try {
      const data = await uploadDocument(fileToUpload);
      setDocumentId(data.document_id);
      setStatus('ready');
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  const handleAudit = async () => {
    if (!documentId || !answerText.trim()) return;
    setStatus('auditing');
    setErrorMsg('');
    try {
      const result = await createAudit(documentId, answerText);
      onAuditComplete(result);
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-navy-900 tracking-tight">Verify every claim.</h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Upload your source material and paste the AI-generated answer. We'll extract the claims, cross-reference them against the document, and provide evidence-backed verdicts.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8">
        
        {/* Step 1: Upload */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-light text-brand-blue flex items-center justify-center font-bold text-sm">1</div>
            <h3 className="text-lg font-semibold text-navy-900">Upload Source PDF</h3>
          </div>
          
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors
              ${status === 'ready' ? 'border-green-200 bg-green-50' : 'border-slate-300 hover:border-brand-blue hover:bg-slate-50'}`}
          >
            {status === 'ready' ? (
              <div className="flex flex-col items-center gap-2 text-green-700">
                <CheckCircle2 className="w-10 h-10" />
                <span className="font-medium">{file.name}</span>
                <span className="text-sm opacity-80 text-green-600">Document successfully indexed.</span>
              </div>
            ) : status === 'uploading' ? (
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
                <span>Processing document...</span>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-3 cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-brand-light flex items-center justify-center">
                  <UploadCloud className="w-6 h-6 text-brand-blue" />
                </div>
                <div className="text-slate-600">
                  <span className="font-semibold text-brand-blue hover:underline">Click to upload</span> or drag and drop
                </div>
                <p className="text-xs text-slate-400">PDF up to 10MB</p>
                <input type="file" className="hidden" accept=".pdf" onChange={handleFileDrop} />
              </label>
            )}
          </div>
        </div>

        {/* Step 2: Input */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-light text-brand-blue flex items-center justify-center font-bold text-sm">2</div>
            <h3 className="text-lg font-semibold text-navy-900">Paste AI Answer</h3>
          </div>
          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="Paste the generated answer here..."
            className="w-full h-40 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none resize-none transition-shadow"
          />
          <div className="text-right text-xs text-slate-500">
            {answerText.length} characters
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{errorMsg}</p>
          </div>
        )}

        <button
          onClick={handleAudit}
          disabled={status === 'auditing' || !documentId || !answerText.trim()}
          className="w-full py-4 px-6 rounded-xl bg-brand-blue hover:bg-blue-700 text-white font-semibold text-lg transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
        >
          {status === 'auditing' ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Auditing Claims...
            </>
          ) : (
            'Run Evidence Audit'
          )}
        </button>
      </div>
    </div>
  );
}
