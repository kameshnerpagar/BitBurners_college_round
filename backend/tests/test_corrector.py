"""
Second Opinion — Tests for evidence-grounded corrected answer generation.
"""

from app.core.corrector import generate_corrected_answer
from app.core.models import ClaimVerdict


def test_corrector_benchmark_cases():
    for case_id in ["medical_faq", "climate_stats", "tenant_rights", "leave_policy", "fully_correct", "prompt_injection"]:
        correction = generate_corrected_answer(
            answer_text="Dummy answer",
            claims=[],
            source_text="Dummy source",
            case_id=case_id,
        )
        assert correction is not None
        assert len(correction.revised_text) > 20
        assert len(correction.changes) > 0


def test_corrector_dynamic_generation():
    claims = [
        ClaimVerdict(
            claim_id=0,
            claim_text="The speed of sound is 343 m/s",
            original_text="The speed of sound is 343 m/s",
            span_start=0,
            span_end=29,
            verdict="SUPPORTED",
            confidence=0.95,
            explanation="Matches physics textbook.",
            evidence_passage_id="doc0:p1",
            source_location="Paragraph 1",
            evidence_quote="speed of sound in dry air at 20 °C is 343 m/s",
            evidence_verified=True,
            evidence_status="verified_verbatim",
        ),
        ClaimVerdict(
            claim_id=1,
            claim_text="Light travels at 100 km/h",
            original_text="Light travels at 100 km/h",
            span_start=31,
            span_end=56,
            verdict="CONTRADICTED",
            confidence=0.99,
            explanation="Contradicts fundamental constant.",
            evidence_passage_id="doc0:p2",
            source_location="Paragraph 2",
            evidence_quote="Light travels at approximately 299,792 km/s",
            evidence_verified=True,
            evidence_status="verified_verbatim",
        ),
        ClaimVerdict(
            claim_id=2,
            claim_text="Aliens built the particle accelerator",
            original_text="Aliens built the particle accelerator",
            span_start=58,
            span_end=95,
            verdict="UNSUPPORTED",
            confidence=0.92,
            explanation="Not mentioned in source.",
            evidence_status="insufficient_evidence",
        ),
    ]

    correction = generate_corrected_answer(
        answer_text="The speed of sound is 343 m/s. Light travels at 100 km/h. Aliens built the particle accelerator.",
        claims=claims,
        source_text="The speed of sound in dry air at 20 °C is 343 m/s. Light travels at approximately 299,792 km/s.",
    )

    assert correction.retained_count == 1
    assert correction.corrected_count == 1
    assert correction.qualified_count == 1
    assert len(correction.changes) == 3
    assert "343 m/s" in correction.revised_text
    assert "299,792 km/s" in correction.revised_text
    assert "[Source:" not in correction.revised_text
    assert len(correction.citations) > 0
    assert correction.reaudit_supported_count is not None


def test_aspirin_case_sentence_quality():
    """
    Test 6: Aspirin case sentence quality.
    Fails if the revised text contains:
    - A duplicated sentence (normalized match).
    - A sentence starting with a lowercase relative clause such as 'which can'.
    - An unresolved fragment without its subject.
    """
    import re
    from app.demo.cases import get_demo_case
    from app.demo.fixtures import get_demo_fixture

    case = get_demo_case("medical_faq")
    fixture = get_demo_fixture("medical_faq")
    assert case is not None
    assert fixture is not None

    # Test both benchmark revision and dynamic generation modes
    for mode in ["benchmark", "dynamic"]:
        c_id = "medical_faq" if mode == "benchmark" else None
        correction = generate_corrected_answer(
            answer_text=case["answer_text"],
            claims=fixture.claims,
            source_text=case["source_text"],
            case_id=c_id,
        )

        assert correction is not None
        revised = correction.revised_text
        assert len(revised) > 50

        # Strip citation chips like [1], [2] for sentence analysis
        clean_prose = re.sub(r"\[\d+\]", "", revised).strip()

        # Split into candidate sentences
        pattern = re.compile(r'([^.!?\n]+(?:[.!?]+|\n+|$))', re.MULTILINE)
        raw_sentences = [m.group(0).strip() for m in pattern.finditer(clean_prose) if len(m.group(0).strip()) > 5]

        assert len(raw_sentences) >= 3, f"Expected at least 3 sentences in revised draft for mode {mode}"

        # 1. FAIL if any sentence starts with a lowercase relative clause such as 'which can'
        for s in raw_sentences:
            assert not s.startswith("which can"), f"Sentence starts with 'which can': '{s}'"
            assert not s.startswith("which "), f"Sentence starts with relative clause 'which ': '{s}'"
            assert not re.match(r"^\s*which\s+can\b", s, re.IGNORECASE), f"Sentence starts with relative clause 'which can': '{s}'"
            assert not re.match(r"^\s*(which|that|who|whom)\b", s), f"Sentence starts with lowercase relative pronoun: '{s}'"

        # 2. FAIL if there is any duplicated sentence (normalized match)
        normalized_sentences = []
        for s in raw_sentences:
            norm = " ".join(re.sub(r"[^\w\s]", "", s).lower().split())
            if norm:
                normalized_sentences.append(norm)

        assert len(normalized_sentences) == len(set(normalized_sentences)), (
            f"Found duplicated sentence in mode {mode}: {normalized_sentences}"
        )

        # 3. Fragment resolution: liver and brain damage must be attached to subject 'Reye's syndrome'
        if "liver and brain damage" in revised:
            assert "reye's syndrome" in revised.lower()
            assert not any(s.lower().startswith("which can cause liver") for s in raw_sentences)

        # 4. Check re-audit honest message format
        assert correction.reaudit_status_message is not None
        assert "Re-audited" in correction.reaudit_status_message
        assert "supported" in correction.reaudit_status_message
