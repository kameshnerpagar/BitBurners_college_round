"""
Second Opinion — Atomic claim extraction with character spans.

Extracts claims from the AI-generated answer, each anchored to exact
character offsets so the frontend can highlight them.
"""

from __future__ import annotations

import hashlib
import json
import logging
from typing import List

from app.core.models import ClaimSpan
from app.core.prompts import CLAIM_EXTRACTION_SYSTEM, CLAIM_EXTRACTION_USER
from app.llm.provider import llm_call

logger = logging.getLogger(__name__)


def _find_span(answer_text: str, original_text: str, hint_start: int = 0) -> tuple[int, int]:
    """
    Find exact character span of original_text in answer_text.

    Uses the LLM-provided hint_start first, then falls back to brute search.
    Returns (start, end) offsets.
    """
    # Try at the hinted position first
    if 0 <= hint_start <= len(answer_text):
        candidate = answer_text[hint_start: hint_start + len(original_text)]
        if candidate == original_text:
            return hint_start, hint_start + len(original_text)

    # Fallback: find first occurrence
    idx = answer_text.find(original_text)
    if idx != -1:
        return idx, idx + len(original_text)

    # Fuzzy fallback: case-insensitive search
    lower_answer = answer_text.lower()
    lower_orig = original_text.lower()
    idx = lower_answer.find(lower_orig)
    if idx != -1:
        return idx, idx + len(original_text)

    # Last resort: search for a substantial substring (first 40 chars)
    if len(original_text) > 40:
        partial = original_text[:40]
        idx = answer_text.find(partial)
        if idx != -1:
            # Try to extend to full match
            end = min(idx + len(original_text), len(answer_text))
            return idx, end

    # If all else fails, return 0,0 — will be flagged
    logger.warning(f"Could not locate span for: {original_text[:60]}...")
    return 0, 0


async def extract_claims(answer_text: str) -> List[ClaimSpan]:
    """
    Extract atomic claims from the AI answer with exact character spans.
    """
    cache_key = f"claims:{hashlib.sha256(answer_text.encode()).hexdigest()[:16]}"

    prompt = CLAIM_EXTRACTION_USER.format(answer_text=answer_text)

    raw_claims = await llm_call(
        prompt=prompt,
        system_prompt=CLAIM_EXTRACTION_SYSTEM,
        cache_key=cache_key,
        response_is_list=True,
    )

    if not isinstance(raw_claims, list):
        raw_claims = [raw_claims]

    claims: List[ClaimSpan] = []
    import re
    # Extract parent sentences from answer_text with character spans
    sent_pattern = re.compile(r'([^.!?\n]+(?:[.!?]+|\n+|$))', re.MULTILINE)
    parent_sentences = []
    for s_idx, match in enumerate(sent_pattern.finditer(answer_text)):
        s_text = match.group(0).strip()
        if s_text:
            parent_sentences.append((s_idx, s_text, match.start(), match.end()))

    for i, item in enumerate(raw_claims):
        if isinstance(item, dict):
            original = item.get("original_text", "")
            hint_start = item.get("span_start", 0)

            # Programmatically verify/correct the span
            actual_start, actual_end = _find_span(answer_text, original, hint_start)

            # If span found, use the actual text at that position
            if actual_start != actual_end:
                verified_original = answer_text[actual_start:actual_end]
            else:
                verified_original = original

            claim_type = item.get("claim_type", "factual")
            if claim_type not in ("factual", "compound", "vague", "non_verifiable"):
                claim_type = "factual"

            # Determine parent sentence id and text
            parent_id = None
            parent_text = None
            for s_idx, s_str, s_start, s_end in parent_sentences:
                if (s_start <= actual_start < s_end) or (actual_start >= s_start and actual_end <= s_end):
                    parent_id = s_idx
                    parent_text = s_str
                    break
            if parent_id is None and parent_sentences:
                # Fallback: check if verified_original is inside s_str
                for s_idx, s_str, _, _ in parent_sentences:
                    if verified_original.lower() in s_str.lower():
                        parent_id = s_idx
                        parent_text = s_str
                        break

            claims.append(
                ClaimSpan(
                    claim_id=i,
                    claim_text=item.get("claim_text", original),
                    original_text=verified_original,
                    span_start=actual_start,
                    span_end=actual_end,
                    claim_type=claim_type,
                    parent_sentence_id=parent_id,
                    parent_sentence_text=parent_text,
                )
            )

    return claims
