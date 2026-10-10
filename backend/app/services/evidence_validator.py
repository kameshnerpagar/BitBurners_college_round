import re
from typing import Tuple
from ..schemas.audit import ClaimEvaluation
from .retriever import DOCUMENT_STORE

def normalize_text(text: str) -> str:
    # Remove extra whitespace, newlines, and punctuation to compare PDF text effectively
    text = re.sub(r'[^\w\s]', '', text)
    return re.sub(r'\s+', ' ', text).strip().lower()

def validate_evidence(evaluation: ClaimEvaluation, document_id: str) -> Tuple[ClaimEvaluation, int]:
    valid_items = []
    validation_failures = 0
    
    if document_id not in DOCUMENT_STORE:
        evaluation.verdict = "insufficient_evidence"
        evaluation.explanation = f"Validation failed: Document {document_id} not found."
        evaluation.evidence_items = []
        return evaluation, 1
        
    doc_data = DOCUMENT_STORE[document_id]
    chunks = {chunk["source_id"]: chunk for chunk in doc_data["chunks"]}
    
    for item in evaluation.evidence_items:
        # Check source exists
        if item.source_id not in chunks:
            validation_failures += 1
            continue
            
        chunk = chunks[item.source_id]
        
        # Check page matches
        if item.page != chunk["page"]:
            validation_failures += 1
            continue
            
        # Check quote is actually in the text
        norm_quote = normalize_text(item.exact_quote)
        norm_chunk = normalize_text(chunk["text"])
        
        if norm_quote not in norm_chunk:
            # Fallback: check if at least 80% of the quote's words are in the chunk
            quote_words = norm_quote.split()
            chunk_words = set(norm_chunk.split())
            if not quote_words:
                validation_failures += 1
                continue
                
            overlap = sum(1 for w in quote_words if w in chunk_words)
            if overlap / len(quote_words) < 0.8:
                validation_failures += 1
                continue
            
        valid_items.append(item)
        
    evaluation.evidence_items = valid_items
    
    if not valid_items and evaluation.verdict in ["supported", "contradicted"]:
        # If all evidence was fabricated or invalid, we must fallback
        evaluation.verdict = "insufficient_evidence"
        evaluation.explanation += " (Note: The AI provided quotes that could not be validated against the source text.)"
        evaluation.uncertainty_level = "high"
        evaluation.review_required = True
        
    return evaluation, validation_failures
