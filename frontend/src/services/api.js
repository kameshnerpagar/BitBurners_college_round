const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const checkHealth = async () => {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) throw new Error('Backend is unavailable');
  return res.json();
};

export const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(`${API_BASE_URL}/documents`, {
    method: 'POST',
    body: formData,
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Failed to upload document');
  }
  
  return res.json();
};

export const createAudit = async (documentId, answerText) => {
  const res = await fetch(`${API_BASE_URL}/audits`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      document_id: documentId,
      answer_text: answerText,
    }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Failed to generate audit');
  }
  
  return res.json();
};
