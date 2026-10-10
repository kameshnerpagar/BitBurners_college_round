import pymupdf as fitz
import io
import uuid
from typing import List, Dict, Any

def parse_pdf(file_content: bytes) -> Dict[str, Any]:
    doc_id = str(uuid.uuid4())
    try:
        doc = fitz.open(stream=file_content, filetype="pdf")
    except Exception as e:
        raise ValueError("Invalid or corrupted PDF file")

    if doc.is_encrypted:
        raise ValueError("Encrypted PDFs are not supported")

    chunks = []
    num_pages = len(doc)
    
    if num_pages == 0:
        raise ValueError("PDF is empty")

    has_text = False

    for page_num in range(num_pages):
        page = doc[page_num]
        text = page.get_text("text").strip()
        
        if text:
            has_text = True
            # Simple chunking by page for now, could be improved to overlapping chunks
            chunk_id = f"page_{page_num+1}"
            chunks.append({
                "source_id": chunk_id,
                "document_id": doc_id,
                "page": page_num + 1,
                "text": text
            })

    if not has_text:
        raise ValueError("No text could be extracted. Scanned PDFs require OCR.")

    return {
        "metadata": {
            "document_id": doc_id,
            "num_pages": num_pages,
            "num_chunks": len(chunks)
        },
        "chunks": chunks
    }
