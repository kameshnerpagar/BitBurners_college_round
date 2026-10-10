"""
Second Opinion — Claim judging (verdicts + evidence quoting).

Batches multiple claims per LLM call to conserve free-tier requests.
"""

from __future__ import annotations

import hashlib
import json
import logging
from typing import Dict, List

from app.core.models import ClaimSpan, ClaimVerdict, SourcePassage
from app.core.prompts import JUDGE_SYSTEM, JUDGE_USER
from app.core.verify_quotes import verify_quote
from app.llm.provider import llm_call

logger = logging.getLogger(__name__)

# Max claims per batch (conserve request limits)
BATCH_SIZE = 8

async def judge_claims(
    claims: List[ClaimSpan],
    passages_by_claim: Dict[int, List[SourcePassage]],
    source_text: str,
    simulate_fake_evidence: bool = False,
) -> List[ClaimVerdict]:
    """
    Judge each claim against the source document.

    Claims are batched to conserve free-tier API requests.
    Evidence quotes are programmatically verified after LLM returns.
    """
    all_verdicts: List[ClaimVerdict] = []

    # Process claims in batches
    for batch_start in range(0, len(claims), BATCH_SIZE):
        batch = claims[batch_start: batch_start + BATCH_SIZE]
        batch_verdicts = await _judge_batch(batch, passages_by_claim, source_text, simulate_fake_evidence)
        all_verdicts.extend(batch_verdicts)

    return all_verdicts


async def _judge_batch(
    claims: List[ClaimSpan],
    passages_by_claim: Dict[int, List[SourcePassage]],
    source_text: str,
    simulate_fake_evidence: bool = False,
) -> List[ClaimVerdict]:
    """Judge a batch of claims in a single LLM call."""

    # Build claims JSON for the prompt
    claims_data = []
    for claim in claims:
        claims_data.append({
            "claim_id": claim.claim_id,
            "claim_text": claim.claim_text,
            "original_text": claim.original_text,
        })

    # Build passages text (deduplicated across all claims in batch)
    seen_passage_ids = set()
    passages_lines = []
    for claim in claims:
        for passage in passages_by_claim.get(claim.claim_id, []):
            if passage.passage_id not in seen_passage_ids:
                seen_passage_ids.add(passage.passage_id)
                passages_lines.append(
                    f"[{passage.passage_id}]: {passage.text}"
                )

    passages_text = "\n\n".join(passages_lines) if passages_lines else "(No specific passages retrieved — use the full source document)"

    # Build cache key
    claims_hash = hashlib.sha256(
        json.dumps(claims_data, sort_keys=True).encode()
    ).hexdigest()[:12]
    source_hash = hashlib.sha256(source_text.encode()).hexdigest()[:12]
    cache_key = f"judge:{claims_hash}:{source_hash}"

    prompt = JUDGE_USER.format(
        source_text=source_text,
        passages_text=passages_text,
        claims_json=json.dumps(claims_data, indent=2),
    )

    raw_verdicts = await llm_call(
        prompt=prompt,
        system_prompt=JUDGE_SYSTEM,
        cache_key=cache_key,
        response_is_list=True,
    )

    if not isinstance(raw_verdicts, list):
        raw_verdicts = [raw_verdicts]

    # Build a lookup for our claims
    claim_lookup = {c.claim_id: c for c in claims}

    verdicts: List[ClaimVerdict] = []
    for item in raw_verdicts:
        if not isinstance(item, dict):
            continue

        claim_id = item.get("claim_id", -1)
        claim = claim_lookup.get(claim_id)
        if claim is None:
            continue

        evidence_quote = item.get("evidence_quote")
        evidence_verified = True

        # Programmatically verify the evidence quote
        if evidence_quote:
            if simulate_fake_evidence and claim_id == claims[0].claim_id:
                # Deliberately corrupt the quote to simulate a hallucination
                evidence_quote = "FABRICATED: " + evidence_quote

            verified, _, _ = verify_quote(evidence_quote, source_text)
            if not verified:
                evidence_verified = False
                logger.warning(
                    f"Claim {claim_id}: evidence quote NOT found in source — "
                    f"downgrading. Quote: {evidence_quote[:80]}..."
                )

        verdict_str = item.get("verdict", "UNSUPPORTED")
        # Validate verdict value
        if verdict_str not in ("SUPPORTED", "CONTRADICTED", "UNSUPPORTED", "AMBIGUOUS"):
            verdict_str = "UNSUPPORTED"

        error_cat = item.get("error_category", "none")
        if error_cat not in (
            "factual_error", "unsupported_claim", "logical_inconsistency",
            "unsafe_recommendation", "ambiguous", "none",
        ):
            error_cat = "none"

        confidence = float(item.get("confidence", 0.5))
        confidence = max(0.0, min(1.0, confidence))

        # Determine evidence status
        if evidence_quote:
            if evidence_verified:
                evidence_status = "verified_verbatim"
            else:
                evidence_status = "unverified_quote"
        elif verdict_str in ("UNSUPPORTED", "AMBIGUOUS"):
            evidence_status = "insufficient_evidence"
        else:
            evidence_status = "not_found"

        # If evidence wasn't verified, reduce confidence and flag
        if not evidence_verified:
            confidence = min(confidence, 0.4)
            if verdict_str == "CONTRADICTED":
                verdict_str = "AMBIGUOUS"
                error_cat = "ambiguous"

        needs_review = False
        human_review_reason = None
        
        if not evidence_verified and evidence_quote:
            needs_review = True
            human_review_reason = "Evidence quote could not be verified in source document"
        elif verdict_str == "AMBIGUOUS":
            needs_review = True
            human_review_reason = "Ambiguous claim interpretation or conflicting evidence"
        elif confidence < 0.7:
            needs_review = True
            human_review_reason = f"Low model certainty ({int(confidence*100)}%)"

        # Determine readable source location
        passage_id = item.get("evidence_passage_id")
        source_loc = item.get("source_location")
        if not source_loc and passage_id:
            # Look up passage details
            for p in passages_by_claim.get(claim.claim_id, []):
                if p.passage_id == passage_id:
                    if p.page is not None and p.page > 0:
                        source_loc = f"Page {p.page + 1}, Paragraph {p.paragraph + 1}"
                    else:
                        source_loc = f"Paragraph {p.paragraph + 1}"
                    break
            if not source_loc:
                source_loc = f"Passage [{passage_id}]"

        # Confidence explanation
        if confidence >= 0.85:
            conf_exp = "High certainty: direct verbatim confirmation or contradiction found in source."
        elif confidence >= 0.65:
            conf_exp = "Moderate certainty: grounded in context but admits minor interpretation nuances."
        else:
            conf_exp = "Low certainty: insufficient or ambiguous evidence; human review recommended."

        verdicts.append(
            ClaimVerdict(
                claim_id=claim.claim_id,
                claim_text=claim.claim_text,
                original_text=claim.original_text,
                span_start=claim.span_start,
                span_end=claim.span_end,
                verdict=verdict_str,
                claim_type=claim.claim_type,
                error_category=error_cat,
                confidence=confidence,
                confidence_explanation=conf_exp,
                explanation=item.get("explanation", ""),
                evidence_passage_id=passage_id,
                source_location=source_loc,
                evidence_quote=evidence_quote if evidence_verified else None,
                evidence_verified=evidence_verified,
                evidence_status=evidence_status,
                needs_human_review=needs_review,
                human_review_reason=human_review_reason,
                parent_sentence_id=claim.parent_sentence_id,
                parent_sentence_text=claim.parent_sentence_text,
            )
        )

    return verdicts
