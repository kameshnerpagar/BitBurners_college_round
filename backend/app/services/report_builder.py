from typing import List
from ..schemas.audit import ClaimEvaluation, AuditSummary

def build_summary(evaluations: List[ClaimEvaluation], total_failures: int) -> AuditSummary:
    total = len(evaluations)
    supported = sum(1 for e in evaluations if e.verdict == "supported")
    contradicted = sum(1 for e in evaluations if e.verdict == "contradicted")
    insufficient = sum(1 for e in evaluations if e.verdict == "insufficient_evidence")
    ambiguous = sum(1 for e in evaluations if e.verdict == "ambiguous")
    review_required = sum(1 for e in evaluations if e.review_required)
    
    # Coverage: percent of claims that had at least one piece of valid evidence
    covered = sum(1 for e in evaluations if len(e.evidence_items) > 0)
    coverage = (covered / total) * 100 if total > 0 else 0.0

    return AuditSummary(
        total_claims=total,
        supported_claims=supported,
        contradicted_claims=contradicted,
        insufficient_evidence_claims=insufficient,
        ambiguous_claims=ambiguous,
        claims_requiring_review=review_required,
        evidence_validation_failures=total_failures,
        overall_evidence_coverage=round(coverage, 2)
    )
