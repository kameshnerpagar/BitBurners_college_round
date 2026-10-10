import json
from typing import List, Dict, Any
from .groq_client import groq_client
from ..schemas.audit import Claim, ClaimEvaluation

async def verify_claim(claim: Claim, retrieved_evidence: List[Dict[str, Any]]) -> ClaimEvaluation:
    if not retrieved_evidence:
        return ClaimEvaluation(
            claim_id=claim.claim_id,
            verdict="insufficient_evidence",
            evidence_items=[],
            explanation="No relevant evidence could be found in the provided document.",
            uncertainty_level="low",
            review_required=True
        )

    evidence_context = ""
    for idx, chunk in enumerate(retrieved_evidence):
        evidence_context += f"--- Source ID: {chunk['source_id']} (Page {chunk['page']}) ---\n{chunk['text']}\n\n"

    prompt = f"""
    You are an expert AI auditor verifying claims against provided evidence.
    Evaluate the following claim based STRICTLY on the provided evidence passages. Do not use outside knowledge.
    
    Claim to evaluate: "{claim.normalized_claim or claim.original_text}"
    
    Evidence passages:
    {evidence_context}
    
    Provide your evaluation in JSON format with the following fields:
    - verdict: Must be one of ["supported", "contradicted", "insufficient_evidence", "ambiguous"].
      - supported: evidence directly supports/entails the claim.
      - contradicted: evidence materially conflicts with the claim.
      - insufficient_evidence: material does not establish the claim.
      - ambiguous: permits multiple materially different interpretations.
    - evidence_items: List of objects containing:
      - source_id: exact source ID from the passages used
      - page: exact page number from the passages used
      - exact_quote: an EXACT verbatim substring from the provided text. DO NOT fabricate or modify the quote.
      - relationship_to_claim: "supports", "contradicts", or "context"
      - short_explanation: brief explanation of why this quote is relevant
    - explanation: detailed explanation of your verdict.
    - uncertainty_level: "low", "medium", or "high". (High if evidence is conflicting or ambiguous)
    - reasoning_consistency_findings: Note any logical inconsistencies between the claim and the evidence.
    - unsafe_recommendation_warning: Note any potentially unsafe medical, legal, or financial recommendations in the claim.
    - review_required: boolean (true if human review is suggested due to ambiguity or danger)
    """

    messages = [
        {"role": "system", "content": "You are a precise evidence evaluator. Output only valid JSON matching the requested schema."},
        {"role": "user", "content": prompt}
    ]
    
    response_content = await groq_client._make_request(messages, response_format={"type": "json_object"})
    
    try:
        data = json.loads(response_content)
    except Exception as e:
        raise ValueError(f"Failed to parse claim evaluation response: {response_content}")

    try:
        evaluation = ClaimEvaluation(
            claim_id=claim.claim_id,
            verdict=data.get("verdict", "insufficient_evidence"),
            evidence_items=data.get("evidence_items", []),
            explanation=data.get("explanation", "No explanation provided."),
            uncertainty_level=data.get("uncertainty_level", "high"),
            reasoning_consistency_findings=data.get("reasoning_consistency_findings"),
            unsafe_recommendation_warning=data.get("unsafe_recommendation_warning"),
            review_required=data.get("review_required", True)
        )
        return evaluation
    except Exception as e:
        # Fallback for malformed output
        return ClaimEvaluation(
            claim_id=claim.claim_id,
            verdict="insufficient_evidence",
            evidence_items=[],
            explanation=f"Error parsing model output: {str(e)}",
            uncertainty_level="high",
            review_required=True
        )
