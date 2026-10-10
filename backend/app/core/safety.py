"""
Second Opinion — Unsafe recommendation detection.

Flags medical, legal, financial, and safety advice not backed by the source.
"""

from __future__ import annotations

import hashlib
import logging
from typing import List

from app.core.models import SafetyFlag
from app.core.prompts import SAFETY_SYSTEM, SAFETY_USER
from app.llm.provider import llm_call

logger = logging.getLogger(__name__)


def _find_flagged_span(answer_text: str, flagged_text: str) -> tuple[int, int]:
    """Find exact span of flagged text in answer."""
    idx = answer_text.find(flagged_text)
    if idx != -1:
        return idx, idx + len(flagged_text)
    idx = answer_text.lower().find(flagged_text.lower())
    if idx != -1:
        return idx, idx + len(flagged_text)
    return 0, 0


async def check_safety(
    answer_text: str,
    source_text: str,
) -> List[SafetyFlag]:
    """
    Detect unsafe recommendations in the AI answer that aren't backed by source.
    """
    cache_key = (
        f"safety:"
        f"{hashlib.sha256(answer_text.encode()).hexdigest()[:12]}:"
        f"{hashlib.sha256(source_text.encode()).hexdigest()[:12]}"
    )

    prompt = SAFETY_USER.format(
        answer_text=answer_text,
        source_text=source_text,
    )

    raw_flags = await llm_call(
        prompt=prompt,
        system_prompt=SAFETY_SYSTEM,
        cache_key=cache_key,
        response_is_list=True,
    )

    if not isinstance(raw_flags, list):
        return []

    flags: List[SafetyFlag] = []
    for item in raw_flags:
        if not isinstance(item, dict):
            continue

        flagged_text = item.get("flagged_text", "")
        if not flagged_text:
            continue

        domain = item.get("domain", "safety")
        if domain not in ("medical", "legal", "financial", "safety"):
            domain = "safety"

        start, end = _find_flagged_span(answer_text, flagged_text)

        flags.append(
            SafetyFlag(
                flagged_text=flagged_text,
                span_start=start,
                span_end=end,
                domain=domain,
                explanation=item.get("explanation", ""),
            )
        )

    return flags
