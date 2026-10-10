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
