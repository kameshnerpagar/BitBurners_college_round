"""
Second Opinion — Tests for character span localization.
"""

from app.core.claims import _find_span


def test_exact_span_match():
    text = "The quick brown fox jumps over the lazy dog."
    target = "brown fox"
    start, end = _find_span(text, target)
    assert (start, end) == (10, 19)
    assert text[start:end] == target


def test_span_with_accurate_hint():
    text = "Aspirin is safe. Aspirin is not safe for children under 16."
    target = "Aspirin is not safe"
    hint = 17
    start, end = _find_span(text, target, hint_start=hint)
    assert (start, end) == (17, 36)
    assert text[start:end] == target


def test_span_duplicate_phrases_with_hint():
    text = "First occurrence of error. Second occurrence of error."
    target = "occurrence of error"
    # Hint pointing to the second occurrence
    second_idx = text.rfind(target)
    start, end = _find_span(text, target, hint_start=second_idx)
    assert start == second_idx
    assert text[start:end] == target


def test_span_case_insensitive_fallback():
    text = "Renewable energy accounted for 32% of global electricity."
    target = "RENEWABLE ENERGY"
    start, end = _find_span(text, target)
    assert (start, end) == (0, 16)


def test_span_partial_fallback():
    text = "Patients with renal failure should be closely monitored during therapy."
    target = "Patients with renal failure should be closely monitored during the treatment"
    start, end = _find_span(text, target)
    assert start == 0
    assert end <= len(text)


def test_span_unicode():
    text = "L’énergie solaire et éolienne a augmenté de 15 % en 2024."
    target = "éolienne"
    start, end = _find_span(text, target)
    assert text[start:end] == target


def test_span_not_found():
    text = "Completely unrelated text."
    target = "Not appearing anywhere at all here"
    start, end = _find_span(text, target)
    assert (start, end) == (0, 0)
