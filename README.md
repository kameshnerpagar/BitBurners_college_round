# Second Opinion — EvidenceLens

An AI auditing platform that evaluates AI-generated answers against provided source material, identifies hallucinated facts, unsupported claims, and communicates uncertainty instead of blindly trusting an LLM. Built for Bit N Build International Hackathon '26.

## Features
- **Evidence-Grounded Audits:** Verifies every claim using provided document text.
- **Deterministic Validation:** Ensures all model-provided quotes actually exist in the original PDF.
- **Dynamic Summaries:** No hardcoded results or fake analytics.

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, Lucide React
- **Backend:** Python, FastAPI, Uvicorn, PyMuPDF, Groq API, BM25 Retrieval

## Setup Instructions

### Prerequisites
- Node.js & npm
- Python 3.10+
- Groq API Key

### Backend Setup
1. Open PowerShell and navigate to `backend/`.
2. Create virtual environment: `python -m venv venv`
3. Activate: `.\venv\Scripts\Activate.ps1`
4. Install requirements: `pip install -r requirements.txt`
5. Copy `.env.example` to `.env` and add your `GROQ_API_KEY`.
6. Run server: `uvicorn app.main:app --reload`

### Frontend Setup
1. Navigate to `frontend/`.
2. Install dependencies: `npm install`
3. Run development server: `npm run dev`

## Privacy & Security
- Documents are parsed strictly for text retrieval and kept in memory temporarily.
- Prompts use system boundaries to restrict the LLM to supplied evidence.
- No database storage is required for this MVP (everything is processed in memory).
- No API keys are leaked to the frontend.

## Limitations
- Scanned PDFs require OCR (not supported out-of-the-box in this MVP).
- Retrieval relies on BM25 lexical search. Highly complex semantic rewrites might be missed compared to dense embeddings.
