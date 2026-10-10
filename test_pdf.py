import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
from app.services.pdf_parser import parse_pdf

with open('sample_document.pdf', 'rb') as f:
    result = parse_pdf(f.read())
    print(f"Number of chunks: {len(result['chunks'])}")
    if result['chunks']:
        print(f"Chunk 0 text length: {len(result['chunks'][0]['text'])}")
        print(f"Chunk 0 preview: {result['chunks'][0]['text'][:200]}")
