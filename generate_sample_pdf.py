import fitz

doc = fitz.open()
page = doc.new_page()

text = """
Second Opinion — EvidenceLens Sample Document

This document provides sample information for testing the EvidenceLens AI auditing platform.

1. Supported Fact: EvidenceLens uses PyMuPDF for document parsing and text extraction.
2. Contradictable Value: The maximum allowed file size for PDF uploads is 10MB.
3. Unsupported Claim Test: (This document intentionally does not mention the creator's name).
4. Ambiguous Statement: The platform relies on modern AI models, which can process information quickly.

Please use these facts to test the claim verification engine.
"""

page.insert_text((50, 50), text, fontsize=12)
doc.save("sample_document.pdf")
doc.close()
print("sample_document.pdf created successfully.")
