from typing import List, Dict, Any
from rank_bm25 import BM25Plus
import re

# Temporary in-memory store for documents
DOCUMENT_STORE = {}

def store_document(doc_data: Dict[str, Any]):
    DOCUMENT_STORE[doc_data["metadata"]["document_id"]] = doc_data

def tokenize(text: str) -> List[str]:
    # Simple word tokenizer
    return re.findall(r'\b\w+\b', text.lower())

def retrieve_evidence(document_id: str, claim_text: str, top_k: int = 3) -> List[Dict[str, Any]]:
    if document_id not in DOCUMENT_STORE:
        raise ValueError(f"Document {document_id} not found in store")
        
    doc_data = DOCUMENT_STORE[document_id]
    chunks = doc_data["chunks"]
    
    if not chunks:
        return []
        
    tokenized_corpus = [tokenize(chunk["text"]) for chunk in chunks]
    bm25 = BM25Plus(tokenized_corpus)
    
    tokenized_query = tokenize(claim_text)
    doc_scores = bm25.get_scores(tokenized_query)
    
    # Get top_k indices
    top_indices = sorted(range(len(doc_scores)), key=lambda i: doc_scores[i], reverse=True)[:top_k]
    
    # Filter out chunks with zero score if needed, but BM25 handles relevance
    retrieved_chunks = [chunks[i] for i in top_indices]
    
    return retrieved_chunks
