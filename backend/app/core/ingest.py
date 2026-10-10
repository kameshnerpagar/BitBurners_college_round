"""
Second Opinion — Source ingestion and chunking.

Supports: raw text (paste), .txt files, .pdf files.
Produces passages with stable IDs and character offsets.
"""

from __future__ import annotations

import re
from typing import List, Optional

from app.core.models import IngestedSource, SourcePassage


def _split_paragraphs(text: str) -> List[str]:
    """Split text into paragraphs on blank lines, preserving non-empty chunks."""
    raw = re.split(r"\n\s*\n", text)
    return [p.strip() for p in raw if p.strip()]


def ingest_text(
    text: str,
    doc_id: str = "doc0",
    filename: Optional[str] = None,
) -> IngestedSource:
    """
    Chunk plain text into passages with stable IDs and char offsets.

    Each paragraph becomes a passage. IDs follow the format: doc:0:para_index.
    """
    paragraphs = _split_paragraphs(text)
    passages: List[SourcePassage] = []
    search_start = 0

    for idx, para in enumerate(paragraphs):
        # Find exact position in original text
        pos = text.find(para, search_start)
        if pos == -1:
            # Fallback: approximate position
            pos = search_start

        passages.append(
            SourcePassage(
                passage_id=f"{doc_id}:0:{idx}",
                text=para,
                char_start=pos,
                char_end=pos + len(para),
                page=0,
                paragraph=idx,
            )
        )
        search_start = pos + len(para)

    return IngestedSource(
        full_text=text,
        passages=passages,
        doc_id=doc_id,
        filename=filename,
    )


def extract_text_via_gemini_vision(file_bytes: bytes, mime_type: str = "image/png") -> str:
    """Extract legible text from scanned document or clicked photo using Gemini Vision OCR."""
    import os
    from google import genai
    from google.genai import types

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "OCR for clicked photos or scanned documents requires a Gemini API key. "
            "Please configure GEMINI_API_KEY in the navbar settings or in backend/.env."
        )

    client = genai.Client(api_key=api_key)
    part = types.Part.from_bytes(data=file_bytes, mime_type=mime_type)
    prompt = (
        "You are an expert OCR and document transcription system. "
        "Extract and transcribe ALL legible text from this scanned document or clicked photo verbatim. "
        "Preserve original paragraph breaks, headings, section titles, bullet points, numbers, and dates exactly as written. "
        "Do NOT summarize, invent text, or add commentary. "
        "Return ONLY the transcribed plain text."
    )

    models_to_try = ["gemini-flash-lite-latest", "gemini-3.8-flash"]
    last_err = None
    for model_name in models_to_try:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=[part, prompt],
            )
            if response.text and response.text.strip():
                return response.text.strip()
        except Exception as e:
            last_err = e
            continue

    raise RuntimeError(f"OCR transcription failed: {last_err}")


def ingest_image(file_bytes: bytes, filename: str = "scan.png", doc_id: str = "doc0") -> IngestedSource:
    """
    Ingest a clicked photo or scanned image document (.png, .jpg, .jpeg, .webp, .bmp, .tiff).
    Performs OCR to extract verbatim text and chunks into structured passages.
    """
    import mimetypes
    mime_type, _ = mimetypes.guess_type(filename)
    if not mime_type or not mime_type.startswith("image/"):
        mime_type = "image/png"

    extracted_text = extract_text_via_gemini_vision(file_bytes, mime_type=mime_type)
    return ingest_text(extracted_text, doc_id=doc_id, filename=filename)


def ingest_pdf(file_bytes: bytes, doc_id: str = "doc0", filename: str = "upload.pdf") -> IngestedSource:
    """
    Extract text from PDF and chunk into passages with page-level IDs.
    If the PDF is a scanned document without a selectable text layer,
    automatically falls back to Vision OCR to transcribe the pages.
    """
    from PyPDF2 import PdfReader
    import io

    reader = PdfReader(io.BytesIO(file_bytes))
    full_text_parts = []
    passages: List[SourcePassage] = []
    global_offset = 0

    for page_num, page in enumerate(reader.pages):
        page_text = page.extract_text() or ""
        if not page_text.strip():
            continue

        paragraphs = _split_paragraphs(page_text)
        search_start = 0

        for para_idx, para in enumerate(paragraphs):
            pos_in_page = page_text.find(para, search_start)
            if pos_in_page == -1:
                pos_in_page = search_start

            abs_start = global_offset + pos_in_page
            passages.append(
                SourcePassage(
                    passage_id=f"{doc_id}:{page_num}:{para_idx}",
                    text=para,
                    char_start=abs_start,
                    char_end=abs_start + len(para),
                    page=page_num,
                    paragraph=para_idx,
                )
            )
            search_start = pos_in_page + len(para)

        full_text_parts.append(page_text)
        global_offset += len(page_text) + 1  # +1 for newline between pages

    full_text = "\n".join(full_text_parts)

    # Scanned PDF check: if no or minimal selectable text extracted, perform Vision OCR
    if len(full_text.strip()) < 30:
        try:
            ocr_text = extract_text_via_gemini_vision(file_bytes, mime_type="application/pdf")
            if ocr_text and ocr_text.strip():
                return ingest_text(ocr_text, doc_id=doc_id, filename=filename)
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Scanned PDF OCR fallback failed: {e}")

    return IngestedSource(
        full_text=full_text,
        passages=passages,
        doc_id=doc_id,
        filename=filename,
    )
