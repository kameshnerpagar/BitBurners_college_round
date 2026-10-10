"""
Second Opinion — Programmatic quote verification.

Verifies that VERBATIM quotes returned by the LLM actually exist in the source.
Uses normalized matching to tolerate minor whitespace/punctuation differences.
"""

from __future__ import annotations

import re
import unicodedata
from typing import Optional, Tuple


def _normalize(text: str) -> str:
    """
    Normalize text for fuzzy matching:
    - Unicode NFKC normalization
    - Lowercase
    - Collapse whitespace
    - Strip leading/trailing whitespace
    """
    text = unicodedata.normalize("NFKC", text)
    text = text.lower()
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _strip_punctuation(text: str) -> str:
    """Remove all punctuation for deep fuzzy matching."""
    return re.sub(r"[^\w\s]", "", text)


def verify_quote(
    quote: str,
    source_text: str,
    tolerance: float = 0.85,
) -> Tuple[bool, Optional[int], Optional[int]]:
    """
    Check if a quote appears in the source text.

    Three-tier matching:
    1. Exact substring match (after normalization)
    2. Punctuation-stripped match
    3. Sliding-window token overlap (for partial matches)

    Args:
        quote: The verbatim quote claimed by the LLM.
        source_text: The full source document text.
        tolerance: Minimum token overlap ratio for tier-3 matching.

    Returns:
        (verified, match_start, match_end) — offsets into source_text,
        or (False, None, None) if no match found.
    """
    if not quote or not source_text:
        return False, None, None

    norm_quote = _normalize(quote)
    norm_source = _normalize(source_text)

    # Tier 1: Exact normalized substring match
    idx = norm_source.find(norm_quote)
    if idx != -1:
        # Map back to approximate position in original source
        approx_start = _map_back(source_text, norm_source, idx)
        return True, approx_start, approx_start + len(quote)

    # Tier 2: Punctuation-stripped match
    stripped_quote = _strip_punctuation(norm_quote)
    stripped_source = _strip_punctuation(norm_source)
    idx = stripped_source.find(stripped_quote)
    if idx != -1:
        approx_start = _map_back_stripped(source_text, stripped_quote)
        end = approx_start + len(quote) if approx_start is not None else None
        return True, approx_start, end

    # Tier 3: Sliding window token overlap
    quote_tokens = set(norm_quote.split())
    if len(quote_tokens) < 3:
        return False, None, None

    source_words = norm_source.split()
    window_size = len(quote_tokens)

    best_overlap = 0.0
    best_pos = None

    for i in range(len(source_words) - window_size + 1):
        window_tokens = set(source_words[i: i + window_size])
        overlap = len(quote_tokens & window_tokens) / len(quote_tokens)
        if overlap > best_overlap:
            best_overlap = overlap
            best_pos = i

    if best_overlap >= tolerance and best_pos is not None:
        # Rough position mapping
        approx_start = len(" ".join(source_words[:best_pos]))
        return True, approx_start, approx_start + len(quote)

    return False, None, None


def _map_back(original: str, normalized: str, norm_idx: int) -> int:
    """Approximate mapping from normalized index to original text index."""
    # Count non-whitespace characters up to norm_idx
    norm_chars_seen = 0
    for i, ch in enumerate(original):
        if norm_chars_seen >= norm_idx:
            return i
        norm_ch = ch.lower()
        if not (ch.isspace() and (i > 0 and original[i - 1].isspace())):
            norm_chars_seen += 1
    return min(norm_idx, len(original) - 1)


def _map_back_stripped(original: str, stripped_target: str) -> Optional[int]:
    """Find approximate start position of stripped match in original."""
    stripped_orig = _strip_punctuation(_normalize(original))
    idx = stripped_orig.find(stripped_target)
    if idx == -1:
        return 0
    # Rough mapping: count character ratio
    ratio = idx / max(len(stripped_orig), 1)
    return int(ratio * len(original))
