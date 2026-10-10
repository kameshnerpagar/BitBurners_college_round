import re
from rank_bm25 import BM25Plus

def tokenize(text: str):
    return re.findall(r'\b\w+\b', text.lower())

pdf_text = """# Greenfield Community Library — Annual Pilot Report
**Report Date:** 15 January 2026
**Reporting Period:** 1 January 2025 – 31 December 2025
## 1. Overview
The Greenfield Community Library launched its community learning pilot on 3
March 2025. The pilot was designed to provide local residents with access to
books, reading spaces, and educational activities.
## 2. Operating Hours
The library operates from Tuesday to Saturday, between 9:00 AM and 6:00 PM.
On Sundays, it operates between 10:00 AM and 2:00 PM. The library remains
closed on Mondays.
## 3. Visitor Feedback
During the pilot period, the library collected feedback from 120 visitors. Of
these respondents, 78 reported that the library's educational activities were
helpful. The remaining respondents gave mixed or neutral feedback.
These results represent the opinions of the surveyed visitors and should not
automatically be treated as representative of every resident in the
community.
## 4. Financial Information
This report does not include the library's total operating expenses, its
revenue, or a detailed cost-benefit analysis.
## 5. Community Impact
The pilot report records the library's opening date, operating schedule, and
visitor feedback. It does not contain crime statistics, comparisons of crime
rates before and after the pilot, or an evaluation of whether the library
affected neighborhood crime.
No causal conclusion about the library's effect on crime can be drawn from
the information presented in this report.
## 6. Limitations
This report describes the available pilot information. It is not a
comprehensive evaluation of the library's long-term educational, economic, or
social impact."""

claims = [
    "The library launched its community learning pilot on 3 March 2025.",
    "On Sundays, it remains open from 9:00 AM to 5:00 PM.",
    "The library's introduction also reduced neighborhood crime by 40% during the pilot period."
]

chunks = [{"text": pdf_text, "source_id": "chunk1", "page": 1}]
tokenized_corpus = [tokenize(chunk["text"]) for chunk in chunks]
bm25 = BM25Plus(tokenized_corpus)

for claim in claims:
    tokenized_query = tokenize(claim)
    doc_scores = bm25.get_scores(tokenized_query)
    print(f"Claim: {claim}")
    print(f"Scores: {doc_scores}")
    
    top_indices = sorted(range(len(doc_scores)), key=lambda i: doc_scores[i], reverse=True)[:3]
    retrieved_chunks = [chunks[i] for i in top_indices if doc_scores[i] > 0]
    print(f"Retrieved: {len(retrieved_chunks)}")
    print("---")
