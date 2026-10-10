"""
Second Opinion — Evaluation script for demo cases.

Validates that demo cases are properly formed and tests the evaluation metrics logic
(precision, recall, F1) for checking detected errors against planted errors.
"""

from app.demo.cases import DEMO_CASES, get_demo_case, get_demo_list


def test_demo_cases_structure():
    assert len(DEMO_CASES) >= 3
    demo_ids = [c["id"] for c in DEMO_CASES]
    assert "medical_faq" in demo_ids
    assert "climate_stats" in demo_ids
    assert "tenant_rights" in demo_ids

    for case in DEMO_CASES:
        assert "id" in case
        assert "title" in case
        assert "source_text" in case and len(case["source_text"]) > 100
        assert "expected_errors" in case
        if case["id"] in ["medical_faq", "climate_stats", "tenant_rights"]:
            assert len(case["expected_errors"]) >= 5


def test_get_demo_helpers():
    demo_list = get_demo_list()
    assert len(demo_list) == len(DEMO_CASES)
    for item in demo_list:
        assert "id" in item
        assert "title" in item

    case = get_demo_case("medical_faq")
    assert case is not None
    assert case["id"] == "medical_faq"

    none_case = get_demo_case("non_existent_case_123")
    assert none_case is None


def compute_planted_metrics(detected_errors: list[dict], expected_errors: list[dict]):
    """
    Compute precision, recall, and F1 comparing detected error substrings with planted errors.
    """
    tp = 0
    fn = 0
    fp = 0

    # Planted errors that should be caught (i.e. expected_verdict != SUPPORTED)
    planted_bugs = [e for e in expected_errors if e.get("expected_verdict") in ("CONTRADICTED", "UNSUPPORTED", "AMBIGUOUS")]

    matched_detected = set()

    for bug in planted_bugs:
        needle = bug["claim_substring"].lower()
        found = False
        for i, det in enumerate(detected_errors):
            det_text = det.get("text", "").lower()
            if needle in det_text:
                found = True
                matched_detected.add(i)
                break
        if found:
            tp += 1
        else:
            fn += 1

    fp = len(detected_errors) - len(matched_detected)
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

    return {"precision": precision, "recall": recall, "f1": f1, "tp": tp, "fp": fp, "fn": fn}


def test_metrics_computation():
    expected = [
        {"claim_substring": "children over 12", "expected_verdict": "CONTRADICTED"},
        {"claim_substring": "5-10 mg/kg", "expected_verdict": "UNSUPPORTED"},
    ]
    detected = [
        {"text": "Aspirin is generally safe for children over 12 years old", "verdict": "CONTRADICTED"},
        {"text": "The standard dose for children is 5-10 mg/kg every 4-6 hours", "verdict": "UNSUPPORTED"},
    ]
    metrics = compute_planted_metrics(detected, expected)
    assert metrics["precision"] == 1.0
    assert metrics["recall"] == 1.0
    assert metrics["f1"] == 1.0


def test_run_evaluation_execution():
    from app.demo.eval import run_evaluation
    results = run_evaluation()
    assert "error" not in results
    assert results["total_claims_evaluated"] == 32
    assert results["evaluation_denominator"] == 32
    assert results["evaluation_unit"] == "Atomic claim verdict evaluated against verified ground-truth labels"
    assert "overall_accuracy" in results
    assert "fpr_contradicted" in results
    assert "fpr_unsupported" in results
    assert "fpr_ambiguous" in results
    assert "confusion_matrix" in results
    assert len(results["case_results"]) == 6
    assert results["planted_errors_caught"] == results["total_planted_errors"]


def test_held_out_evaluation_execution():
    from app.demo.held_out_eval import run_held_out_evaluation
    results = run_held_out_evaluation()
    assert results["total_cases"] >= 8
    assert results["total_claims_evaluated"] >= 35
    assert results["total_planted_errors"] > 0
    assert "precision_contradicted" in results
    assert "precision_unsupported" in results
    assert "confusion_matrix" in results
    assert len(results["case_results"]) >= 8


def test_three_system_comparison_execution():
    from app.demo.held_out_eval import run_three_system_benchmark
    bench = run_three_system_benchmark()
    assert "systems" in bench
    assert "llm_only" in bench["systems"]
    assert "bm25_verifier" in bench["systems"]
    assert "full_pipeline" in bench["systems"]
    # Verify fair and naive baselines are both reported
    assert "llm_fair" in bench["systems"]
    assert "llm_naive" in bench["systems"]
    assert "bm25_fair" in bench["systems"]
    assert "bm25_naive" in bench["systems"]

    # Verify provenance uses team-annotated rather than claiming human annotators
    assert "team-annotated" in bench["annotation_method"].lower()
    assert "Small sample; evaluated by our team; not a general accuracy claim." in bench["caption"]

    assert "comparison_table" in bench
    assert len(bench["comparison_table"]) >= 7

    # Verify design notes are labeled as 'Design note'
    design_note_rows = [r for r in bench["comparison_table"] if "Design note" in r["advantage"]]
    assert len(design_note_rows) >= 2

    # Verify dynamic deltas match displayed numbers
    acc_row = next(r for r in bench["comparison_table"] if "Overall Claim Accuracy (Fair Baselines)" in r["metric"])
    full_acc = float(acc_row["full_pipeline"].rstrip("%"))
    bm25_acc = float(acc_row["bm25_verifier"].rstrip("%"))
    expected_bm25_delta = round(full_acc - bm25_acc, 1)
    assert f"+{expected_bm25_delta}% over BM25" in acc_row["advantage"]

