"""
Second Opinion — BM25 passage retrieval.

For each claim, find the most relevant source passages.
Skips retrieval for short sources (< 3000 chars) — all passages are candidates.
"""

from __future__ import annotations

import re
from typing import Dict, List

from rank_bm25 import BM25Okapi

from app.core.models import ClaimSpan, SourcePassage

SHORT_SOURCE_THRESHOLD = 3000  # chars


def _tokenize(text: str) -> List[str]:
    """Simple whitespace + punctuation tokenizer."""
    return re.findall(r"\w+", text.lower())


def retrieve_passages(
    claims: List[ClaimSpan],
    passages: List[SourcePassage],
    full_source_text: str,
    top_k: int = 3,
) -> Dict[int, List[SourcePassage]]:
    """
    For each claim, return the top-k most relevant source passages.

    If the source is short, return ALL passages for every claim (no retrieval needed).

    Returns:
        Dict mapping claim_id -> list of relevant SourcePassages.
    """
    if len(full_source_text) < SHORT_SOURCE_THRESHOLD or len(passages) <= top_k:
        # Short source: every passage is a candidate for every claim
        return {claim.claim_id: list(passages) for claim in claims}

    # Build BM25 index over passages
    tokenized_passages = [_tokenize(p.text) for p in passages]
    bm25 = BM25Okapi(tokenized_passages)

    result: Dict[int, List[SourcePassage]] = {}

    for claim in claims:
        query_tokens = _tokenize(claim.claim_text)
        scores = bm25.get_scores(query_tokens)

        # Get top-k passage indices
        ranked_indices = sorted(
            range(len(scores)),
            key=lambda i: scores[i],
            reverse=True,
        )[:top_k]

        result[claim.claim_id] = [passages[i] for i in ranked_indices]

    return result
