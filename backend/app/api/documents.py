from fastapi import APIRouter, UploadFile, File, HTTPException
from ..services.pdf_parser import parse_pdf
from ..services.retriever import store_document
from ..schemas.audit import DocumentMetadata

router = APIRouter()

@router.post("", response_model=DocumentMetadata)
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Read file content
    content = await file.read()
    
    # Limit size to 10MB
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
        
    try:
        doc_data = parse_pdf(content)
        doc_data["metadata"]["filename"] = file.filename
        store_document(doc_data)
        
        return DocumentMetadata(**doc_data["metadata"])
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred while parsing the document")
