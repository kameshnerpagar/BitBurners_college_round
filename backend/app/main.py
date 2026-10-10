from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from .api import documents, audits, benchmarks
from .config import settings

app = FastAPI(title="Second Opinion — EvidenceLens API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    groq_configured = bool(settings.GROQ_API_KEY)
    return {
        "status": "ok",
        "groq_configured": groq_configured
    }

app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(audits.router, prefix="/api/audits", tags=["audits"])
app.include_router(benchmarks.router, prefix="/api/benchmarks", tags=["benchmarks"])
