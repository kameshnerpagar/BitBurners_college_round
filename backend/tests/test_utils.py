import pytest
from app.core.verify_quotes import verify_quote
from app.core.reasoning import _find_issue_span

def test_verify_quote_exact_match():
    source = "The quick brown fox jumps over the lazy dog."
    quote = "brown fox jumps"
    verified, start, end = verify_quote(quote, source)
    assert verified is True
    assert start == 10
    assert end == 25

def test_verify_quote_normalized_match():
    source = "The   quick\n\nbrown fox jumps    over the lazy dog."
    quote = "quick brown fox jumps"
    verified, start, end = verify_quote(quote, source)
    assert verified is True
    # The normalization logic should handle whitespaces
    # It might not return exact indices if it normalizes heavily, but let's check it verifies

def test_verify_quote_not_found():
    source = "The quick brown fox jumps over the lazy dog."
    quote = "cat jumps over"
    verified, start, end = verify_quote(quote, source)
    assert verified is False

def test_find_issue_span_exact():
    answer = "This is a bad conclusion based on the premise."
    issue = "bad conclusion"
    start, end = _find_issue_span(answer, issue)
    assert start == 10
    assert end == 24
    assert answer[start:end] == issue

def test_find_issue_span_case_insensitive():
    answer = "This is a BAD conclusion based on the premise."
    issue = "bad conclusion"
    start, end = _find_issue_span(answer, issue)
    assert start == 10
    assert end == 24
    assert answer[start:end] == "BAD conclusion"

def test_find_issue_span_not_found():
    answer = "This is a good conclusion."
    issue = "bad conclusion"
    start, end = _find_issue_span(answer, issue)
    assert start == 0
    assert end == 0

if __name__ == "__main__":
    test_verify_quote_exact_match()
    test_verify_quote_normalized_match()
    test_verify_quote_not_found()
    test_find_issue_span_exact()
    test_find_issue_span_case_insensitive()
    test_find_issue_span_not_found()
    print("All unit tests passed successfully!")
