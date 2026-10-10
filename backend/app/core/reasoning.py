"""
Second Opinion — Reasoning consistency checker.

Detects conclusions in the AI answer that don't follow from the supported claims.
"""

from __future__ import annotations

import hashlib
import json
import logging
from typing import List

from app.core.models import ClaimVerdict, ReasoningIssue
from app.core.prompts import REASONING_SYSTEM, REASONING_USER
from app.llm.provider import llm_call

logger = logging.getLogger(__name__)


def _find_issue_span(answer_text: str, issue_text: str) -> tuple[int, int]:
    """Find exact span of issue text in answer."""
    idx = answer_text.find(issue_text)
    if idx != -1:
        return idx, idx + len(issue_text)
    # Case-insensitive fallback
    idx = answer_text.lower().find(issue_text.lower())
    if idx != -1:
        return idx, idx + len(issue_text)
    return 0, 0


async def check_reasoning(
    answer_text: str,
    verdicts: List[ClaimVerdict],
) -> List[ReasoningIssue]:
    """
    Check the AI answer for logical consistency issues.

    Only runs if there are supported claims to compare against.
    """
    supported = [v for v in verdicts if v.verdict == "SUPPORTED"]

    if not supported and not verdicts:
        return []

    supported_text = "\n".join(
        f"- [SUPPORTED] {v.claim_text}" for v in supported
    )
    if not supported_text:
        supported_text = "(No claims were confirmed as supported by the source.)"

    cache_key = f"reasoning:{hashlib.sha256(answer_text.encode()).hexdigest()[:16]}"

    prompt = REASONING_USER.format(
        answer_text=answer_text,
        supported_claims_text=supported_text,
    )

    raw_issues = await llm_call(
        prompt=prompt,
        system_prompt=REASONING_SYSTEM,
        cache_key=cache_key,
        response_is_list=True,
    )

    if not isinstance(raw_issues, list):
        return []

    issues: List[ReasoningIssue] = []
    for item in raw_issues:
        if not isinstance(item, dict):
            continue

        issue_text = item.get("issue_text", "")
        if not issue_text:
            continue

        start, end = _find_issue_span(answer_text, issue_text)

        issues.append(
            ReasoningIssue(
                issue_text=issue_text,
                span_start=start,
                span_end=end,
                premises=item.get("premises", []),
                explanation=item.get("explanation", ""),
            )
        )

    return issues
