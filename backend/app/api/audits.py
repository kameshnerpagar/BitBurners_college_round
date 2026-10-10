import uuid
import asyncio
from fastapi import APIRouter, HTTPException
from ..schemas.audit import AuditRequest, AuditResult
from ..services.claim_extractor import extract_claims
from ..services.retriever import retrieve_evidence, DOCUMENT_STORE
from ..services.verifier import verify_claim
from ..services.evidence_validator import validate_evidence
from ..services.report_builder import build_summary

router = APIRouter()

# In-memory store for audits (MVP)
AUDIT_STORE = {}

@router.post("", response_model=AuditResult)
async def create_audit(request: AuditRequest):
    if request.document_id not in DOCUMENT_STORE:
        raise HTTPException(status_code=404, detail="Document not found")
        
    try:
        # Step 1: Extract claims
        claims = await extract_claims(request.answer_text)
        
        if not claims:
            # Handle empty case
            return AuditResult(
                audit_id=str(uuid.uuid4()),
                document_id=request.document_id,
                summary=build_summary([], 0),
                claim_evaluations=[]
            )

        # Step 2 & 3: Retrieve and Evaluate
        evaluations = []
        total_validation_failures = 0
        
        for idx, claim in enumerate(claims):
            if idx > 0:
                await asyncio.sleep(1.0)
            retrieved_chunks = retrieve_evidence(request.document_id, claim.normalized_claim or claim.original_text)
            evaluation = await verify_claim(claim, retrieved_chunks)
            
            # Step 4: Validate evidence statically
            evaluation, failures = validate_evidence(evaluation, request.document_id)
            total_validation_failures += failures
            
            evaluations.append(evaluation)
            
        # Step 5: Build Summary
        summary = build_summary(evaluations, total_validation_failures)
        
        audit_id = str(uuid.uuid4())
        result = AuditResult(
            audit_id=audit_id,
            document_id=request.document_id,
            summary=summary,
            claim_evaluations=evaluations
        )
        
        AUDIT_STORE[audit_id] = result
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{audit_id}", response_model=AuditResult)
async def get_audit(audit_id: str):
    if audit_id not in AUDIT_STORE:
        raise HTTPException(status_code=404, detail="Audit not found")
    return AUDIT_STORE[audit_id]
