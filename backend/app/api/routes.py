"""
Second Opinion — API routes.

Endpoints:
- POST /api/audit       — Run the full audit pipeline
- POST /api/audit/json  — Run audit pipeline with JSON payload
- GET  /api/demos       — List demo cases
- GET  /api/demo/{id}   — Get a specific demo case
- POST /api/audit/demo  — Run audit on a demo case (with instant offline benchmark fallback)
- GET  /api/config/keys — Check configured LLM keys
- POST /api/config/keys — Save LLM keys at runtime
- GET  /api/health      — Health check
"""

from __future__ import annotations

import os
import logging
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from app.core.models import AuditResult
from app.core.pipeline import run_audit
from app.demo.cases import get_demo_case, get_demo_list
from app.demo.fixtures import get_demo_fixture
from app.demo.eval import run_evaluation

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["audit"])


# ── Request / Response models ─────────────────────────────────────────────

class AuditRequest(BaseModel):
    answer_text: str
    source_text: Optional[str] = None
    simulate_fake_evidence: bool = False


class DemoAuditRequest(BaseModel):
    case_id: str
    simulate_fake_evidence: bool = False


class KeyConfigRequest(BaseModel):
    gemini_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    version: str
    gemini_configured: bool
    groq_configured: bool


def _has_any_llm_key() -> bool:
    return bool(os.getenv("GEMINI_API_KEY") or os.getenv("GROQ_API_KEY"))


# ── Endpoints ─────────────────────────────────────────────────────────────

@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="ok",
        version="1.0.0",
        gemini_configured=bool(os.getenv("GEMINI_API_KEY")),
        groq_configured=bool(os.getenv("GROQ_API_KEY")),
    )


@router.get("/config/keys")
async def get_key_status():
    """Return status of configured API keys (never returns actual secret keys)."""
    return {
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY")),
        "groq_configured": bool(os.getenv("GROQ_API_KEY")),
    }


@router.post("/config/keys")
async def save_keys(payload: KeyConfigRequest):
    """Save API keys into environment for runtime evaluation."""
    if payload.gemini_api_key is not None:
        key = payload.gemini_api_key.strip()
        if key:
            os.environ["GEMINI_API_KEY"] = key
        elif "GEMINI_API_KEY" in os.environ:
            del os.environ["GEMINI_API_KEY"]

    if payload.groq_api_key is not None:
        key = payload.groq_api_key.strip()
        if key:
            os.environ["GROQ_API_KEY"] = key
        elif "GROQ_API_KEY" in os.environ:
            del os.environ["GROQ_API_KEY"]

    # Also persist to .env
    env_lines = []
    if os.getenv("GEMINI_API_KEY"):
        env_lines.append(f"GEMINI_API_KEY={os.getenv('GEMINI_API_KEY')}")
    if os.getenv("GROQ_API_KEY"):
        env_lines.append(f"GROQ_API_KEY={os.getenv('GROQ_API_KEY')}")

    try:
        with open(".env", "w", encoding="utf-8") as f:
            f.write("\n".join(env_lines) + "\n")
    except Exception as e:
        logger.warning(f"Could not persist to .env: {e}")

    return {
        "success": True,
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY")),
        "groq_configured": bool(os.getenv("GROQ_API_KEY")),
    }


# ── Security & Limits Constants ──────────────────────────────────────────
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB limit
MAX_TEXT_LENGTH = 100_000         # 100,000 characters limit
ALLOWED_EXTENSIONS = {".txt", ".pdf", ".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"}


@router.post("/audit", response_model=AuditResult)
async def audit_answer(
    answer_text: str = Form(...),
    source_text: Optional[str] = Form(None),
    source_file: Optional[UploadFile] = File(None),
    simulate_fake_evidence: bool = Form(False),
):
    """Run the full audit pipeline for multipart form requests with strict validation."""
    clean_ans = answer_text.strip() if answer_text else ""
    if not clean_ans:
        raise HTTPException(status_code=400, detail="Answer text cannot be empty.")
    if len(clean_ans) > MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Answer text exceeds maximum limit of {MAX_TEXT_LENGTH:,} characters.",
        )

    source_file_bytes = None
    source_filename = None

    if source_file and source_file.filename:
        source_filename = source_file.filename
        _, ext = os.path.splitext(source_filename.lower())
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type '{ext}'. Supported: .txt, .pdf, and image files (.png, .jpg, .jpeg, .webp, .bmp).",
            )

        source_file_bytes = await source_file.read()
        if len(source_file_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE // (1024*1024)} MB.",
            )
        if len(source_file_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        if ext == ".txt":
            source_text = source_file_bytes.decode("utf-8", errors="replace")
            source_file_bytes = None
            source_filename = None

    clean_source = source_text.strip() if source_text else ""
    if not clean_source and not source_file_bytes:
        raise HTTPException(
            status_code=400,
            detail="Either source_text or a non-empty source_file must be provided.",
        )
    if clean_source and len(clean_source) > MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Source text exceeds maximum limit of {MAX_TEXT_LENGTH:,} characters.",
        )

    if not _has_any_llm_key():
        raise HTTPException(
            status_code=400,
            detail=(
                "No LLM API key configured. Please configure your free-tier GEMINI_API_KEY or "
                "GROQ_API_KEY using the 'API Keys' button in the navbar or in backend/.env."
            ),
        )

    try:
        result = await run_audit(
            answer_text=clean_ans,
            source_text=clean_source if clean_source else None,
            source_file_bytes=source_file_bytes,
            source_filename=source_filename,
            simulate_fake_evidence=simulate_fake_evidence,
        )
        return result
    except Exception as e:
        logger.exception("Audit failed")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/audit/json", response_model=AuditResult)
async def audit_answer_json(request: AuditRequest):
    """Run the full audit pipeline with JSON body with strict validation."""
    clean_ans = request.answer_text.strip() if request.answer_text else ""
    if not clean_ans:
        raise HTTPException(status_code=400, detail="answer_text cannot be empty.")
    if len(clean_ans) > MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"answer_text exceeds maximum limit of {MAX_TEXT_LENGTH:,} characters.",
        )

    clean_src = request.source_text.strip() if request.source_text else ""
    if not clean_src:
        raise HTTPException(status_code=400, detail="source_text cannot be empty.")
    if len(clean_src) > MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"source_text exceeds maximum limit of {MAX_TEXT_LENGTH:,} characters.",
        )

    if not _has_any_llm_key():
        raise HTTPException(
            status_code=400,
            detail=(
                "No LLM API key configured. Please configure your free-tier GEMINI_API_KEY or "
                "GROQ_API_KEY using the 'API Keys' button in the navbar or in backend/.env."
            ),
        )

    try:
        result = await run_audit(
            answer_text=clean_ans,
            source_text=clean_src,
            simulate_fake_evidence=request.simulate_fake_evidence,
        )
        return result
    except Exception as e:
        logger.exception("Audit failed")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/demos")
async def list_demos():
    """List available demo cases."""
    return get_demo_list()


@router.get("/demo/{case_id}")
async def get_demo(case_id: str):
    """Get a specific demo case."""
    case = get_demo_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Demo case '{case_id}' not found")
    return {
        "id": case["id"],
        "title": case["title"],
        "source_text": case["source_text"],
        "answer_text": case["answer_text"],
    }


@router.post("/audit/demo", response_model=AuditResult)
async def audit_demo(request: DemoAuditRequest):
    """
    Run audit on a demo case.
    If API keys are configured, executes live audit pipeline.
    If no keys are configured, returns pre-computed benchmark ground-truth fixture.
    Never silently replaces real audit failures with mock data.
    """
    case = get_demo_case(request.case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Demo case '{request.case_id}' not found")

    # If keys are configured, execute live audit pipeline
    if _has_any_llm_key():
        try:
            result = await run_audit(
                answer_text=case["answer_text"],
                source_text=case["source_text"],
                simulate_fake_evidence=request.simulate_fake_evidence,
            )
            return result
        except Exception as e:
            logger.error(f"Live demo audit failed: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Live audit failed: {str(e)}. Please check your API key and connection.",
            )

    # When no keys are configured, serve deterministic benchmark fixture
    fixture = get_demo_fixture(request.case_id)
    if fixture:
        return fixture

    raise HTTPException(status_code=500, detail=f"Could not load audit fixture for {request.case_id}")

@router.get("/audit/eval")
async def get_evaluation():
    """Run benchmark evaluation against ground truth."""
    return run_evaluation()


@router.get("/audit/eval/held-out")
async def get_held_out_evaluation():
    """Run held-out test evaluation against 3 unseen cases."""
    from app.demo.held_out_eval import run_held_out_evaluation
    return run_held_out_evaluation()
