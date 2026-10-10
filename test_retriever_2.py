import asyncio
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
from app.services.pdf_parser import parse_pdf
from app.services.retriever import store_document, retrieve_evidence, DOCUMENT_STORE

def test():
    with open('sample_document.pdf', 'rb') as f:
        doc_data = parse_pdf(f.read())
        doc_data["metadata"]["filename"] = "sample_document.pdf"
        store_document(doc_data)
        
    doc_id = doc_data["metadata"]["document_id"]
    
    claim = "The library launched its community learning pilot on 3 March 2025."
    chunks = retrieve_evidence(doc_id, claim)
    
    print(f"Retrieved chunks count: {len(chunks)}")
    if chunks:
        print(f"Score > 0 worked! Chunk 0: {chunks[0]['text'][:50]}")

test()
