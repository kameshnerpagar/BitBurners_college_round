import React, { useState } from 'react';
import Home from './pages/Home';
import AuditPage from './pages/AuditPage';

function App() {
  const [currentAudit, setCurrentAudit] = useState(null);

  const handleAuditComplete = (auditResult) => {
    setCurrentAudit(auditResult);
  };

  const handleReset = () => {
    setCurrentAudit(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleReset}>
            <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-navy-900 leading-none">Second Opinion</h1>
              <p className="text-xs text-slate-500 font-medium">EvidenceLens</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!currentAudit ? (
          <Home onAuditComplete={handleAuditComplete} />
        ) : (
          <AuditPage auditResult={currentAudit} onBack={handleReset} />
        )}
      </main>
    </div>
  );
}

export default App;
