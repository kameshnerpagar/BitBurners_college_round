/**
 * Second Opinion — Frontend API client
 */

const API_BASE = '/api';

function normalizeAuditResult(result) {
  if (!result) return result;

  const relScore = result.overall_reliability_score !== undefined
    ? Math.round(result.overall_reliability_score * 100)
    : Math.round(result.reliability_score || 0);

  const verdictCounts = {
    SUPPORTED: result.supported_count ?? result.verdict_counts?.SUPPORTED ?? 0,
    CONTRADICTED: result.contradicted_count ?? result.verdict_counts?.CONTRADICTED ?? 0,
    UNSUPPORTED: result.unsupported_count ?? result.verdict_counts?.UNSUPPORTED ?? 0,
    AMBIGUOUS: result.ambiguous_count ?? result.verdict_counts?.AMBIGUOUS ?? 0,
  };

  const normalizedClaims = (result.claims || []).map((c) => {
    const start = c.span_start ?? c.span?.start ?? 0;
    const end = c.span_end ?? c.span?.end ?? 0;
    const claimText = c.claim_text ?? c.claim ?? '';
    const evidenceQuotes = c.evidence_quotes ?? (c.evidence_quote ? [{ quote: c.evidence_quote, verified: c.evidence_verified !== false }] : []);
    const primaryQuote = c.evidence_quote || (evidenceQuotes[0]?.quote ?? null);

    // Compute explicit severity based on real audit findings & category
    let severity = 'NONE';
    const cat = (c.error_category || c.category || '').toLowerCase();
    if (c.verdict === 'CONTRADICTED' || cat === 'unsafe_recommendation' || cat === 'factual_error') {
      severity = 'HIGH';
    } else if (c.verdict === 'UNSUPPORTED' || cat === 'logical_inconsistency' || cat === 'unsupported_claim') {
      severity = 'MEDIUM';
    } else if (c.verdict === 'AMBIGUOUS' || cat === 'ambiguous' || c.needs_human_review) {
      severity = 'LOW';
    } else {
      severity = 'NONE';
    }

    return {
      ...c,
      id: c.claim_id ?? c.id,
      claim: claimText,
      span: { start, end },
      evidence_quote: primaryQuote,
      evidence_quotes: evidenceQuotes,
      category: c.error_category ?? c.category,
      severity,
      source_location: c.source_location ?? null,
      evidence_status: c.evidence_status ?? (c.evidence_verified ? 'verified_verbatim' : 'unverified_quote'),
      confidence_explanation: c.confidence_explanation ?? 'Model self-assessed certainty based on semantic agreement.',
      claim_type: c.claim_type ?? 'factual',
    };
  });

  return {
    ...result,
    reliability_score: relScore,
    verdict_counts: verdictCounts,
    claims: normalizedClaims,
    passages: result.source_passages || result.passages || [],
    corrected_answer: result.corrected_answer ? {
      ...result.corrected_answer,
      changes: (result.corrected_answer.changes || []).map((c, i) => {
        const orig = c.original_text || c.original_claim || c.claim || '';
        const rev = c.revised_text || c.revised_claim || '';
        const cit = c.citation || c.source_citation || null;
        return {
          ...c,
          claim_id: c.claim_id ?? i + 1,
          original_text: orig,
          original_claim: orig,
          revised_text: rev,
          revised_claim: rev,
          citation: cit,
          source_citation: cit,
          action: c.action || 'RETAINED',
        };
      }),
    } : null,
  };
}

export function downloadJsonFile(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function checkHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Backend health check failed');
  return res.json();
}

export async function getKeyStatus() {
  const res = await fetch(`${API_BASE}/config/keys`);
  if (!res.ok) throw new Error('Failed to fetch key status');
  return res.json();
}

export async function saveApiKeys({ geminiKey, groqKey }) {
  const res = await fetch(`${API_BASE}/config/keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gemini_api_key: geminiKey,
      groq_api_key: groqKey,
    }),
  });
  if (!res.ok) throw new Error('Failed to save API keys');
  return res.json();
}

export async function fetchDemos() {
  const res = await fetch(`${API_BASE}/demos`);
  if (!res.ok) throw new Error('Failed to fetch demo cases');
  return res.json();
}

export async function fetchEvaluation() {
  const res = await fetch(`${API_BASE}/audit/eval`);
  if (!res.ok) throw new Error('Failed to fetch evaluation metrics');
  return res.json();
}

export async function fetchHeldOutEvaluation() {
  const res = await fetch(`${API_BASE}/audit/eval/held-out`);
  if (!res.ok) throw new Error('Failed to fetch held-out evaluation metrics');
  return res.json();
}

export async function fetchDemo(caseId) {
  const res = await fetch(`${API_BASE}/demo/${caseId}`);
  if (!res.ok) throw new Error(`Failed to fetch demo case: ${caseId}`);
  return res.json();
}

export async function auditDemo(caseId) {
  const res = await fetch(`${API_BASE}/audit/demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ case_id: caseId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Audit request failed' }));
    throw new Error(err.detail || 'Audit failed');
  }
  const data = await res.json();
  return normalizeAuditResult(data);
}

export async function auditCustom({ answerText, sourceText, sourceFile }) {
  let res;
  if (sourceFile) {
    const formData = new FormData();
    formData.append('answer_text', answerText);
    formData.append('source_file', sourceFile);
    if (sourceText) {
      formData.append('source_text', sourceText);
    }
    if (arguments[0].simulateFakeEvidence) {
      formData.append('simulate_fake_evidence', 'true');
    }
    res = await fetch(`${API_BASE}/audit`, {
      method: 'POST',
      body: formData,
    });
  } else {
      res = await fetch(`${API_BASE}/audit/json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answer_text: answerText,
        source_text: sourceText,
        simulate_fake_evidence: arguments[0].simulateFakeEvidence || false,
      }),
    });
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Audit failed' }));
    throw new Error(err.detail || 'Audit failed');
  }
  const data = await res.json();
  return normalizeAuditResult(data);
}
