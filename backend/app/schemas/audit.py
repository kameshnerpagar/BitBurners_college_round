from pydantic import BaseModel, Field
from typing import List, Optional

class DocumentMetadata(BaseModel):
    document_id: str
    filename: str
    num_pages: int
    num_chunks: int

class Claim(BaseModel):
    claim_id: str
    original_text: str
    normalized_claim: Optional[str] = None
    original_start: Optional[int] = None
    original_end: Optional[int] = None
    claim_type: Optional[str] = None
    extraction_notes: Optional[str] = None

class EvidenceItem(BaseModel):
    source_id: str
    page: int
    exact_quote: str
    relationship_to_claim: str = Field(description="supports, contradicts, or context")
    short_explanation: str

class ClaimEvaluation(BaseModel):
    claim_id: str
    verdict: str = Field(description="supported, contradicted, insufficient_evidence, ambiguous")
    evidence_items: List[EvidenceItem]
    explanation: str
    uncertainty_level: str = Field(description="low, medium, high")
    reasoning_consistency_findings: Optional[str] = None
    unsafe_recommendation_warning: Optional[str] = None
    review_required: bool = False

class AuditSummary(BaseModel):
    total_claims: int
    supported_claims: int
    contradicted_claims: int
    insufficient_evidence_claims: int
    ambiguous_claims: int
    claims_requiring_review: int
    evidence_validation_failures: int
    overall_evidence_coverage: float

class AuditResult(BaseModel):
    audit_id: str
    document_id: str
    summary: AuditSummary
    claim_evaluations: List[ClaimEvaluation]

class AuditRequest(BaseModel):
    document_id: str
    answer_text: str
