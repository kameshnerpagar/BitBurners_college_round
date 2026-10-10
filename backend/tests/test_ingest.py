"""
Second Opinion — Tests for document ingestion, including plain text, PDF, and scanned/clicked image OCR.
"""

import io
import os
from dotenv import load_dotenv
load_dotenv()
from PIL import Image, ImageDraw
from app.core.ingest import ingest_text, ingest_pdf, ingest_image


def test_ingest_text():
    raw = "Paragraph 1: Policy starts.\n\nParagraph 2: Second section."
    ingested = ingest_text(raw)
    assert len(ingested.passages) == 2
    assert ingested.passages[0].text == "Paragraph 1: Policy starts."
    assert ingested.passages[1].text == "Paragraph 2: Second section."


def test_ingest_pdf_text_extraction():
    from reportlab.pdfgen import canvas
    buf = io.BytesIO()
    c = canvas.Canvas(buf)
    c.drawString(100, 750, "Sample PDF Document Header")
    c.drawString(100, 700, "Tenants are entitled to 30 days notice prior to lease termination.")
    c.save()
    pdf_bytes = buf.getvalue()

    ingested = ingest_pdf(pdf_bytes, filename="test.pdf")
    assert len(ingested.passages) > 0
    assert "Tenants are entitled to 30 days notice" in ingested.full_text


def test_ingest_image_with_vision_ocr():
    # Create synthetic scanned document image
    img = Image.new("RGB", (500, 150), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    d.text((20, 30), "Company Policy Document", fill=(0, 0, 0))
    d.text((20, 70), "All full-time staff accrue 20 vacation days annually.", fill=(0, 0, 0))

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    img_bytes = buf.getvalue()

    ingested = ingest_image(img_bytes, filename="clicked_policy.png")
    assert len(ingested.passages) > 0
    assert len(ingested.full_text) > 10
    assert "vacation" in ingested.full_text.lower() or "policy" in ingested.full_text.lower()
