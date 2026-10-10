import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle, HelpCircle, AlertTriangle, ChevronRight, FileText } from 'lucide-react';

export default function AuditPage({ auditResult, onBack }) {
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [filter, setFilter] = useState('all'); // all, supported, contradicted, insufficient_evidence, ambiguous, review

  const { summary, claim_evaluations } = auditResult;

  const filteredClaims = claim_evaluations.filter(claim => {
    if (filter === 'all') return true;
    if (filter === 'review') return claim.review_required;
    return claim.verdict === filter;
  });

  const getVerdictConfig = (verdict, review) => {
    if (review) return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle, label: 'Review Required' };
    switch (verdict) {
      case 'supported': return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle, label: 'Supported' };
      case 'contradicted': return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle, label: 'Contradicted' };
      case 'insufficient_evidence': return { color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', icon: HelpCircle, label: 'Insufficient Evidence' };
      case 'ambiguous': return { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', icon: HelpCircle, label: 'Ambiguous' };
      default: return { color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', icon: HelpCircle, label: 'Unknown' };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-navy-900 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" /> New Audit
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left column: Overview & List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-bold text-navy-900">{summary.total_claims}</span>
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Total Claims</span>
            </div>
            <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-bold text-green-700">{summary.supported_claims}</span>
              <span className="text-xs text-green-600 font-medium uppercase tracking-wider mt-1">Supported</span>
            </div>
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-bold text-red-700">{summary.contradicted_claims}</span>
              <span className="text-xs text-red-600 font-medium uppercase tracking-wider mt-1">Contradicted</span>
            </div>
            <div className="bg-brand-light p-4 rounded-xl border border-blue-100 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-bold text-brand-blue">{summary.overall_evidence_coverage}%</span>
              <span className="text-xs text-brand-blue font-medium uppercase tracking-wider mt-1">Coverage</span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Findings' },
              { id: 'supported', label: 'Supported' },
              { id: 'contradicted', label: 'Contradicted' },
              { id: 'insufficient_evidence', label: 'Insufficient Evidence' },
              { id: 'review', label: 'Needs Review' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  filter === f.id 
                    ? 'bg-navy-900 text-white border-navy-900' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Claims List */}
          <div className="space-y-3">
            {filteredClaims.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                <p className="text-slate-500">No claims match the selected filter.</p>
              </div>
            ) : (
              filteredClaims.map((evalData) => {
                const config = getVerdictConfig(evalData.verdict, evalData.review_required);
                const Icon = config.icon;
                const isSelected = selectedClaim?.claim_id === evalData.claim_id;
                
                return (
                  <div 
                    key={evalData.claim_id}
                    onClick={() => setSelectedClaim(evalData)}
                    className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md flex items-start gap-4 ${
                      isSelected ? 'border-brand-blue ring-1 ring-brand-blue' : 'border-slate-200'
                    }`}
                  >
                    <div className={`mt-1 flex-shrink-0 p-2 rounded-full ${config.bg} ${config.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold uppercase tracking-wider ${config.color}`}>
                          {config.label}
                        </span>
                        {evalData.review_required && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                            Review Required
                          </span>
                        )}
                      </div>
                      <p className="text-navy-900 line-clamp-2">{evalData.explanation.split('.')[0] + '.'}</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-slate-400 flex-shrink-0 mt-3 transition-transform ${isSelected ? 'rotate-90 text-brand-blue' : ''}`} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Inspector */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm sticky top-24 overflow-hidden flex flex-col max-h-[calc(100vh-8rem)]">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-navy-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-blue" />
                Evidence Inspector
              </h3>
            </div>
            
            <div className="p-5 overflow-y-auto flex-grow space-y-6">
              {!selectedClaim ? (
                <div className="text-center py-12 text-slate-400 flex flex-col items-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                    <FileText className="w-6 h-6 text-slate-300" />
                  </div>
                  <p>Select a claim to inspect evidence.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Claim</h4>
                    <p className="text-navy-900 font-medium bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {selectedClaim.explanation.split('.')[0] + '.'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verdict Explanation</h4>
                    <p className="text-slate-700 text-sm leading-relaxed">
                      {selectedClaim.explanation}
                    </p>
                  </div>

                  {selectedClaim.uncertainty_level !== 'low' && (
                    <div className="flex items-start gap-2 bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-200 text-sm">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Uncertainty ({selectedClaim.uncertainty_level}):</strong> The system indicates this verdict requires caution.
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Source Evidence</span>
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px]">
                        {selectedClaim.evidence_items.length} items
                      </span>
                    </h4>
                    
                    {selectedClaim.evidence_items.length === 0 ? (
                      <p className="text-sm text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                        No validated evidence quotes found for this claim.
                      </p>
                    ) : (
                      selectedClaim.evidence_items.map((item, idx) => (
                        <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
                          <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex justify-between items-center text-xs">
                            <span className="font-semibold text-navy-900 flex items-center gap-1">
                              <FileText className="w-3 h-3" /> Page {item.page}
                            </span>
                            <span className={`px-2 py-0.5 rounded font-medium ${
                              item.relationship_to_claim === 'supports' ? 'bg-green-100 text-green-700' :
                              item.relationship_to_claim === 'contradicts' ? 'bg-red-100 text-red-700' :
                              'bg-slate-200 text-slate-700'
                            }`}>
                              {item.relationship_to_claim}
                            </span>
                          </div>
                          <div className="p-3 bg-white space-y-2">
                            <p className="text-sm text-slate-800 font-serif leading-relaxed border-l-2 border-brand-blue pl-3 py-1">
                              "{item.exact_quote}"
                            </p>
                            <p className="text-xs text-slate-500">
                              <strong className="text-slate-700">Relevance:</strong> {item.short_explanation}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
