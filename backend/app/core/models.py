"""
Second Opinion — Pydantic data models.

All schemas used across the audit pipeline.
"""

from __future__ import annotations

from typing import List, Literal, Optional
from pydantic import BaseModel, Field


# ── Source Ingestion ──────────────────────────────────────────────────────────

class SourcePassage(BaseModel):
    """A chunked passage from the user-provided source document."""
    passage_id: str = Field(..., description="Stable ID: doc:page:para")
    text: str
    char_start: int = Field(..., description="Start offset in full source text")
    char_end: int = Field(..., description="End offset in full source text")
    page: Optional[int] = None
    paragraph: int = 0


class IngestedSource(BaseModel):
    """Fully ingested and chunked source document."""
    full_text: str
    passages: List[SourcePassage]
    doc_id: str = "doc0"
    filename: Optional[str] = None


# ── Claim Extraction ─────────────────────────────────────────────────────────

ClaimType = Literal["factual", "compound", "vague", "non_verifiable"]


class ClaimSpan(BaseModel):
    """An atomic claim extracted from the AI-generated answer."""
    claim_id: int
    claim_text: str = Field(..., description="Atomic verifiable statement")
    original_text: str = Field(
        ..., description="Exact text from the answer this claim is derived from"
    )
    span_start: int = Field(..., description="Char offset start in answer text")
    span_end: int = Field(..., description="Char offset end in answer text")
    claim_type: ClaimType = Field("factual", description="Type of claim (factual, compound, vague, non_verifiable)")
    parent_sentence_id: Optional[int] = Field(None, description="Index of parent sentence in answer text")
    parent_sentence_text: Optional[str] = Field(None, description="Complete text of parent sentence")


# ── Verdict & Evidence ────────────────────────────────────────────────────────

VerdictType = Literal["SUPPORTED", "CONTRADICTED", "UNSUPPORTED", "AMBIGUOUS"]

EvidenceStatus = Literal["verified_verbatim", "unverified_quote", "insufficient_evidence", "not_found"]

ErrorCategory = Literal[
    "factual_error",
    "unsupported_claim",
    "logical_inconsistency",
    "unsafe_recommendation",
    "ambiguous",
    "none",
]


class ClaimVerdict(BaseModel):
    """Judgment for a single claim with full evidence traceability."""
    claim_id: int
    claim_text: str
    original_text: str
    span_start: int
    span_end: int
    verdict: VerdictType
    claim_type: ClaimType = "factual"
    error_category: ErrorCategory = "none"
    confidence: float = Field(
        ..., ge=0.0, le=1.0,
        description="Model self-assessed certainty (NOT probability of truth)",
    )
    confidence_explanation: Optional[str] = Field(
        None,
        description="Explicit definition of certainty given available evidence",
    )
    explanation: str
    evidence_passage_id: Optional[str] = Field(
        None, description="ID of the source passage used as evidence"
    )
    source_location: Optional[str] = Field(
        None, description="Human-readable location in source (e.g. Page 1, Paragraph 3)"
    )
    evidence_quote: Optional[str] = Field(
        None, description="VERBATIM quote from source passage"
    )
    evidence_verified: bool = Field(
        True,
        description="Whether the quoted evidence was programmatically found in the source",
    )
    evidence_status: EvidenceStatus = Field(
        "not_found",
        description="Detailed verification status of the evidence",
    )
    needs_human_review: bool = False
    human_review_reason: Optional[str] = None
    parent_sentence_id: Optional[int] = Field(None, description="Index of parent sentence in answer text")
    parent_sentence_text: Optional[str] = Field(None, description="Complete text of parent sentence")


# ── Reasoning & Safety ────────────────────────────────────────────────────────

class ReasoningIssue(BaseModel):
    """A conclusion in the answer that doesn't follow from supported claims."""
    issue_text: str = Field(..., description="The problematic text in the answer")
    span_start: int
    span_end: int
    premises: List[str] = Field(default_factory=list, description="The premises the conclusion relied on")
    explanation: str
    error_category: ErrorCategory = "logical_inconsistency"


class SafetyFlag(BaseModel):
    """An unsafe recommendation detected in the answer."""
    flagged_text: str
    span_start: int
    span_end: int
    domain: Literal["medical", "legal", "financial", "safety"]
    explanation: str
    error_category: ErrorCategory = "unsafe_recommendation"


# ── Corrected Answer ──────────────────────────────────────────────────────────

CorrectionAction = Literal["RETAINED", "CORRECTED", "QUALIFIED", "FLAGGED_FOR_REVIEW", "REMOVED"]


class ClaimCorrection(BaseModel):
    """Detailed adjustment made to an individual claim for the revised answer."""
    claim_id: int
    original_text: str
    revised_text: str
    action: CorrectionAction
    reason: str
    citation: Optional[str] = None
    needs_human_review: bool = False
    parent_sentence_id: Optional[int] = Field(None, description="Index of parent sentence in original answer text")
    parent_sentence_text: Optional[str] = Field(None, description="Complete original parent sentence")


class AnswerCorrection(BaseModel):
    """Structured revised answer based strictly on verified source evidence."""
    revised_text: str
    changes: List[ClaimCorrection] = Field(default_factory=list)
    retained_count: int = 0
    corrected_count: int = 0
    qualified_count: int = 0
    human_review_count: int = 0
    reaudit_supported_count: Optional[int] = None
    reaudit_total_claims: Optional[int] = None
    reaudit_issues_remaining: Optional[int] = None
    reaudit_status_message: Optional[str] = None
    citations: Optional[List[Dict[str, Any]]] = None


# ── Aggregate Result ──────────────────────────────────────────────────────────

class AuditResult(BaseModel):
    """Complete audit output returned to the frontend."""
    answer_text: str
    source_text: str
    source_passages: List[SourcePassage]

    claims: List[ClaimVerdict]
    reasoning_issues: List[ReasoningIssue] = []
    safety_flags: List[SafetyFlag] = []
    corrected_answer: Optional[AnswerCorrection] = None

    # Aggregate scores
    overall_reliability_score: float = Field(
        ..., ge=0.0, le=1.0,
        description="Weighted reliability score across all claims",
    )
    total_claims: int
    supported_count: int = 0
    contradicted_count: int = 0
    unsupported_count: int = 0
    ambiguous_count: int = 0
    reasoning_issue_count: int = 0
    safety_flag_count: int = 0

    human_review_items: List[int] = Field(
        default_factory=list,
        description="claim_ids that need human review (low confidence or ambiguous)",
    )

    model_used: str = ""
    cached: bool = False

