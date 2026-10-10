"""
Second Opinion — Main audit pipeline orchestrator.

Wires together all pipeline stages:
1. Ingest source → 2. Extract claims → 3. Retrieve passages →
4. Judge claims → 5. Verify quotes → 6. Reasoning check →
7. Safety check → 8. Aggregate
"""

from __future__ import annotations

import logging
from typing import Optional

from app.core.models import AuditResult, IngestedSource
from app.core.ingest import ingest_text, ingest_pdf, ingest_image
from app.core.claims import extract_claims
from app.core.retrieval import retrieve_passages
from app.core.judge import judge_claims
from app.core.reasoning import check_reasoning
from app.core.safety import check_safety
from app.core.aggregator import aggregate

logger = logging.getLogger(__name__)


async def run_audit(
    answer_text: str,
    source_text: Optional[str] = None,
    source_file_bytes: Optional[bytes] = None,
    source_filename: Optional[str] = None,
    simulate_fake_evidence: bool = False,
) -> AuditResult:
    """
    Run the full audit pipeline.

    Args:
        answer_text: The AI-generated answer to audit.
        source_text: Raw source text (paste or .txt contents).
        source_file_bytes: Uploaded file bytes (PDF, image, or text).
        source_filename: Filename for uploads.

    Returns:
        Complete AuditResult with claims, verdicts, evidence, and scores.
    """
    # ── Step 1: Ingest source ─────────────────────────────────────────────
    import os
    if source_file_bytes and source_filename:
        ext = os.path.splitext(source_filename.lower())[1]
        if ext == ".pdf":
            source = ingest_pdf(source_file_bytes, filename=source_filename)
        elif ext in {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"}:
            source = ingest_image(source_file_bytes, filename=source_filename)
        elif ext == ".txt":
            source = ingest_text(source_file_bytes.decode("utf-8", errors="replace"), filename=source_filename)
        else:
            raise ValueError(f"Unsupported file type '{ext}'")
    elif source_text:
        source = ingest_text(source_text)
    else:
        raise ValueError("Either source_text or a valid source document must be provided.")

    logger.info(f"Ingested source: {len(source.passages)} passages, {len(source.full_text)} chars")

    # ── Step 2: Extract atomic claims with spans ──────────────────────────
    claims = await extract_claims(answer_text)
    logger.info(f"Extracted {len(claims)} claims")

    if not claims:
        return aggregate(
            answer_text=answer_text,
            source_text=source.full_text,
            source_passages=source.passages,
            verdicts=[],
            reasoning_issues=[],
            safety_flags=[],
            model_used="gemini-3.8-flash",
        )

    # ── Step 3: Retrieve candidate passages per claim ─────────────────────
    passages_by_claim = retrieve_passages(
        claims=claims,
        passages=source.passages,
        full_source_text=source.full_text,
    )

    # ── Step 4 & 5: Judge claims + verify quotes ─────────────────────────
    verdicts = await judge_claims(
        claims=claims,
        passages_by_claim=passages_by_claim,
        source_text=source.full_text,
        simulate_fake_evidence=simulate_fake_evidence,
    )
    logger.info(f"Judged {len(verdicts)} claims")

    # ── Step 6: Reasoning consistency check ───────────────────────────────
    reasoning_issues = await check_reasoning(answer_text, verdicts)
    logger.info(f"Found {len(reasoning_issues)} reasoning issues")

    # ── Step 7: Safety check ──────────────────────────────────────────────
    safety_flags = await check_safety(answer_text, source.full_text)
    logger.info(f"Found {len(safety_flags)} safety flags")

    # ── Step 8: Evidence-grounded revised answer generation ──────────────
    from app.core.corrector import generate_corrected_answer
    corrected_answer = generate_corrected_answer(
        answer_text=answer_text,
        claims=verdicts,
        source_text=source.full_text,
    )
    logger.info(f"Generated revised answer with {len(corrected_answer.changes)} tracked corrections")

    # ── Step 9: Aggregate ─────────────────────────────────────────────────
    result = aggregate(
        answer_text=answer_text,
        source_text=source.full_text,
        source_passages=source.passages,
        verdicts=verdicts,
        reasoning_issues=reasoning_issues,
        safety_flags=safety_flags,
        corrected_answer=corrected_answer,
        model_used="gemini-3.8-flash",
    )

    logger.info(
        f"Audit complete: reliability={result.overall_reliability_score:.2f}, "
        f"S={result.supported_count} C={result.contradicted_count} "
        f"U={result.unsupported_count} A={result.ambiguous_count}"
    )

    return result
