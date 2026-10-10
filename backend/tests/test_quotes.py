"""
Second Opinion — Tests for programmatic quote verification.
"""

from app.core.verify_quotes import verify_quote


def test_exact_quote_match():
    source = (
        "Aspirin (acetylsalicylic acid) should NOT be given to children under 16 years "
        "of age unless specifically prescribed by a doctor."
    )
    quote = "should NOT be given to children under 16 years"
    verified, start, end = verify_quote(quote, source)
    assert verified is True
    assert start is not None and end is not None
    assert source[start:end].lower() == quote.lower()


def test_case_and_whitespace_insensitivity():
    source = "The recommended dose of   acetaminophen for children is 10-15 mg/kg every 4-6 hours."
    quote = "the recommended dose of acetaminophen for children is 10-15 mg/kg"
    verified, start, end = verify_quote(quote, source)
    assert verified is True
    assert start is not None and end is not None


def test_punctuation_tolerance():
    source = "In 2024, renewable energy sources accounted for 32% of global electricity production."
    quote = "In 2024 renewable energy sources accounted for 32 of global electricity production"
    verified, start, end = verify_quote(quote, source)
    assert verified is True


def test_fabricated_quote_fails():
    source = (
        "Aspirin (acetylsalicylic acid) should NOT be given to children under 16 years "
        "of age unless specifically prescribed by a doctor."
    )
    quote = "Aspirin boosts the immune system and fights off viral replication in adolescents"
    verified, start, end = verify_quote(quote, source)
    assert verified is False
    assert start is None
    assert end is None


def test_empty_quote_or_source():
    assert verify_quote("", "some text") == (False, None, None)
    assert verify_quote("some quote", "") == (False, None, None)
