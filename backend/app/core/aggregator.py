"""
Second Opinion — Score aggregation.

Computes the overall reliability score and categorizes findings.
"""

from __future__ import annotations

from typing import List

from app.core.models import AnswerCorrection, AuditResult, ClaimVerdict, ReasoningIssue, SafetyFlag, SourcePassage


def aggregate(
    answer_text: str,
    source_text: str,
    source_passages: List[SourcePassage],
    verdicts: List[ClaimVerdict],
    reasoning_issues: List[ReasoningIssue],
    safety_flags: List[SafetyFlag],
    corrected_answer: Optional[AnswerCorrection] = None,
    model_used: str = "",
    cached: bool = False,
) -> AuditResult:
    """
    Aggregate all pipeline outputs into the final AuditResult.

    Reliability score:
    - Each SUPPORTED claim adds 1.0
    - Each CONTRADICTED claim adds 0.0
    - Each UNSUPPORTED claim adds 0.3
    - Each AMBIGUOUS claim adds 0.5
    - Reasoning issues and safety flags reduce the score
    """
    total = len(verdicts)

    supported = sum(1 for v in verdicts if v.verdict == "SUPPORTED")
    contradicted = sum(1 for v in verdicts if v.verdict == "CONTRADICTED")
    unsupported = sum(1 for v in verdicts if v.verdict == "UNSUPPORTED")
    ambiguous = sum(1 for v in verdicts if v.verdict == "AMBIGUOUS")

    if total > 0:
        raw_score = (
            supported * 1.0
            + contradicted * 0.0
            + unsupported * 0.3
            + ambiguous * 0.5
        ) / total
    else:
        raw_score = 0.0

    # Penalties for reasoning issues and safety flags
    penalty = (
        len(reasoning_issues) * 0.05
        + len(safety_flags) * 0.1
    )
    reliability_score = max(0.0, min(1.0, raw_score - penalty))

    # Items needing human review
    human_review = [
        v.claim_id for v in verdicts if v.needs_human_review
    ]

    return AuditResult(
        answer_text=answer_text,
        source_text=source_text,
        source_passages=source_passages,
        claims=verdicts,
        reasoning_issues=reasoning_issues,
        safety_flags=safety_flags,
        corrected_answer=corrected_answer,
        overall_reliability_score=round(reliability_score, 3),
        total_claims=total,
        supported_count=supported,
        contradicted_count=contradicted,
        unsupported_count=unsupported,
        ambiguous_count=ambiguous,
        reasoning_issue_count=len(reasoning_issues),
        safety_flag_count=len(safety_flags),
        human_review_items=human_review,
        model_used=model_used,
        cached=cached,
    )
