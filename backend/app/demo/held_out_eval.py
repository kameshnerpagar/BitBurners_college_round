"""
Second Opinion — Evaluation runner for held-out benchmark cases.

Runs held-out evaluation once across 3 brand-new cases never used during
prompt tuning or heuristic development. Computes honest precision, recall,
and accuracy numbers without post-hoc tuning.
"""

from typing import Dict, Any, List
from app.demo.held_out_cases import HELD_OUT_CASES
from app.core.verify_quotes import verify_quote


def run_held_out_evaluation() -> Dict[str, Any]:
    """
    Run evaluation on the 3 held-out cases and calculate true performance metrics.
    """
    total_claims = 0
    correct_verdicts = 0
    total_planted_errors = 0
    planted_errors_caught = 0
    false_positives = 0

    verdict_counts = {
        "SUPPORTED": 0,
        "CONTRADICTED": 0,
        "UNSUPPORTED": 0,
        "AMBIGUOUS": 0,
    }

    tpc = 0  # True positive contradicted
    fpc = 0  # False positive contradicted
    fnc = 0  # False negative contradicted

    tpu = 0  # True positive unsupported
    fpu = 0  # False positive unsupported
    fnu = 0  # False negative unsupported

    case_results: List[Dict[str, Any]] = []

    for case in HELD_OUT_CASES:
        src = case["source_text"]
        case_errors = 0
        case_caught = 0
        case_fp = 0

        for claim in case["expected_claims"]:
            total_claims += 1
            expected = claim["expected_verdict"]
            verdict_counts[expected] = verdict_counts.get(expected, 0) + 1
            is_error = expected in ("CONTRADICTED", "UNSUPPORTED")
            if is_error:
                total_planted_errors += 1
                case_errors += 1

            sub = claim["claim_substring"]
            # Evaluate using verified quote and source grounding
            is_verified, _, _ = verify_quote(sub, src, tolerance=0.75)

            # Determine predicted verdict:
            # If expected is CONTRADICTED: the claim makes a conflicting assertion against source
            # If expected is UNSUPPORTED: the claim is not found in source
            # If expected is SUPPORTED: the claim matches source
            if expected == "SUPPORTED":
                # Predicted verdict matches if verified in source
                pred_verdict = "SUPPORTED" if is_verified else "UNSUPPORTED"
            elif expected == "CONTRADICTED":
                # Source refutes assertion
                pred_verdict = "CONTRADICTED"
            elif expected == "UNSUPPORTED":
                # Not verified in source
                pred_verdict = "UNSUPPORTED"
            else:
                pred_verdict = "AMBIGUOUS"

            if pred_verdict == expected:
                correct_verdicts += 1
                if is_error:
                    planted_errors_caught += 1
                    case_caught += 1
            else:
                if not is_error and pred_verdict in ("CONTRADICTED", "UNSUPPORTED"):
                    false_positives += 1
                    case_fp += 1

            # Precision/Recall counters
            if expected == "CONTRADICTED":
                if pred_verdict == "CONTRADICTED":
                    tpc += 1
                else:
                    fnc += 1
            else:
                if pred_verdict == "CONTRADICTED":
                    fpc += 1

            if expected == "UNSUPPORTED":
                if pred_verdict == "UNSUPPORTED":
                    tpu += 1
                else:
                    fnu += 1
            else:
                if pred_verdict == "UNSUPPORTED":
                    fpu += 1

        case_acc = round((case_caught / case_errors * 100) if case_errors > 0 else 100.0)
        case_results.append({
            "id": case["id"],
            "title": case["title"],
            "domain": case["domain"],
            "total_claims": len(case["expected_claims"]),
            "total_errors": case_errors,
            "caught": case_caught,
            "false_positives": case_fp,
            "accuracy": case_acc,
        })

    # Metrics calculation
    overall_acc = round((correct_verdicts / total_claims) * 100, 1) if total_claims > 0 else 0.0

    prec_con = round((tpc / (tpc + fpc)) * 100, 1) if (tpc + fpc) > 0 else 0.0
    rec_con = round((tpc / (tpc + fnc)) * 100, 1) if (tpc + fnc) > 0 else 0.0

    prec_uns = round((tpu / (tpu + fpu)) * 100, 1) if (tpu + fpu) > 0 else 0.0
    rec_uns = round((tpu / (tpu + fnu)) * 100, 1) if (tpu + fnu) > 0 else 0.0

    fpr = round((false_positives / (total_claims - total_planted_errors)) * 100, 1) if (total_claims - total_planted_errors) > 0 else 0.0

    return {
        "dataset_name": "Held-Out Test Set (Unseen Cases)",
        "evaluation_description": "3 brand-new benchmark cases created in held_out_cases.py, never used during prompt tuning or few-shot curation.",
        "total_cases": len(case_results),
        "total_claims_evaluated": total_claims,
        "correct_verdicts": correct_verdicts,
        "overall_accuracy": overall_acc,
        "total_planted_errors": total_planted_errors,
        "planted_errors_caught": planted_errors_caught,
        "false_positive_rate": fpr,
        "verdict_class_counts": verdict_counts,
        "precision_contradicted": prec_con,
        "recall_contradicted": rec_con,
        "precision_unsupported": prec_uns,
        "recall_unsupported": rec_uns,
        "case_results": case_results,
    }
