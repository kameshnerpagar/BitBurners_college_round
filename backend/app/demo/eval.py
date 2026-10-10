import json
import os
from typing import Dict, Any

from app.demo.cases import DEMO_CASES
from app.demo.fixtures import get_demo_fixture

def run_evaluation() -> Dict[str, Any]:
    gt_path = os.path.join(os.path.dirname(__file__), "ground_truth.json")
    if not os.path.exists(gt_path):
        return {"error": "ground_truth.json not found"}
        
    with open(gt_path, "r", encoding="utf-8") as f:
        ground_truth = json.load(f)
        
    metrics = {
        "total_claims_evaluated": 0,
        "correct_verdicts": 0,
        "true_positives_contradicted": 0,
        "false_positives_contradicted": 0,
        "false_negatives_contradicted": 0,
        "true_positives_unsupported": 0,
        "false_positives_unsupported": 0,
        "false_negatives_unsupported": 0,
        "true_positives_ambiguous": 0,
        "false_positives_ambiguous": 0,
        "false_negatives_ambiguous": 0,
        "total_planted_errors": 0,
        "planted_errors_caught": 0,
        "false_positive_planted_errors": 0,
        "verdict_class_counts": {
            "SUPPORTED": 0,
            "CONTRADICTED": 0,
            "UNSUPPORTED": 0,
            "AMBIGUOUS": 0,
        },
        "case_results": []
    }
    
    for case in DEMO_CASES:
        case_id = case["id"]
        gt_claims = ground_truth.get(case_id, [])
        if not gt_claims:
            continue
            
        result = get_demo_fixture(case_id)
        if not result:
            continue
            
        case_metrics = {
            "id": case_id,
            "title": case["title"],
            "accuracy": 0,
            "caught": 0,
            "total_errors": 0,
            "false_positives": 0,
            "is_control": False,
        }
        
        # Match predicted claims to GT claims using substring matching
        predicted_claims = result.claims
        case_fp = 0
        
        for gt in gt_claims:
            metrics["total_claims_evaluated"] += 1
            expected = gt["expected_verdict"]
            metrics["verdict_class_counts"][expected] = metrics["verdict_class_counts"].get(expected, 0) + 1
            is_error = expected in ["CONTRADICTED", "UNSUPPORTED"]
            if is_error:
                metrics["total_planted_errors"] += 1
                case_metrics["total_errors"] += 1
                
            # Find matching predicted claim
            pred_verdict = None
            for p in predicted_claims:
                if gt["claim_substring"].lower() in p.original_text.lower() or \
                   gt["claim_substring"].lower() in p.claim_text.lower():
                    pred_verdict = p.verdict
                    break
                    
            if pred_verdict == expected:
                metrics["correct_verdicts"] += 1
                if is_error:
                    metrics["planted_errors_caught"] += 1
                    case_metrics["caught"] += 1
            else:
                if not is_error and pred_verdict in ["CONTRADICTED", "UNSUPPORTED"]:
                    metrics["false_positive_planted_errors"] += 1
                    case_fp += 1
                    
            # Precision / Recall stats
            if expected == "CONTRADICTED":
                if pred_verdict == "CONTRADICTED":
                    metrics["true_positives_contradicted"] += 1
                else:
                    metrics["false_negatives_contradicted"] += 1
            else:
                if pred_verdict == "CONTRADICTED":
                    metrics["false_positives_contradicted"] += 1
                    
            if expected == "UNSUPPORTED":
                if pred_verdict == "UNSUPPORTED":
                    metrics["true_positives_unsupported"] += 1
                else:
                    metrics["false_negatives_unsupported"] += 1
            else:
                if pred_verdict == "UNSUPPORTED":
                    metrics["false_positives_unsupported"] += 1

            if expected == "AMBIGUOUS":
                if pred_verdict == "AMBIGUOUS":
                    metrics["true_positives_ambiguous"] += 1
                else:
                    metrics["false_negatives_ambiguous"] += 1
            else:
                if pred_verdict == "AMBIGUOUS":
                    metrics["false_positives_ambiguous"] += 1
                    
        # Calculate case accuracy
        case_metrics["false_positives"] = case_fp
        case_metrics["is_control"] = (case_metrics["total_errors"] == 0)
        if len(gt_claims) > 0:
            case_metrics["accuracy"] = round((case_metrics["caught"] / case_metrics["total_errors"] if case_metrics["total_errors"] > 0 else 1.0) * 100)
            
        metrics["case_results"].append(case_metrics)
        
    total_eval = metrics["total_claims_evaluated"]
    # Calculate overall metrics
    if total_eval > 0:
        metrics["overall_accuracy"] = round((metrics["correct_verdicts"] / total_eval) * 100, 1)
    else:
        metrics["overall_accuracy"] = 0
        
    # Precision = TP / (TP + FP)
    # Recall = TP / (TP + FN)
    # False Positive Rate (FPR) = FP / (FP + TN)
    tpc = metrics["true_positives_contradicted"]
    fpc = metrics["false_positives_contradicted"]
    fnc = metrics["false_negatives_contradicted"]
    tnc = total_eval - (tpc + fpc + fnc)
    
    tpu = metrics["true_positives_unsupported"]
    fpu = metrics["false_positives_unsupported"]
    fnu = metrics["false_negatives_unsupported"]
    tnu = total_eval - (tpu + fpu + fnu)

    tpa = metrics["true_positives_ambiguous"]
    fpa = metrics["false_positives_ambiguous"]
    fna = metrics["false_negatives_ambiguous"]
    tna = total_eval - (tpa + fpa + fna)
    
    metrics["precision_contradicted"] = round((tpc / (tpc + fpc)) * 100, 1) if (tpc + fpc) > 0 else 0.0
    metrics["recall_contradicted"] = round((tpc / (tpc + fnc)) * 100, 1) if (tpc + fnc) > 0 else 0.0
    metrics["fpr_contradicted"] = round((fpc / (fpc + tnc)) * 100, 1) if (fpc + tnc) > 0 else 0.0
    
    metrics["precision_unsupported"] = round((tpu / (tpu + fpu)) * 100, 1) if (tpu + fpu) > 0 else 0.0
    metrics["recall_unsupported"] = round((tpu / (tpu + fnu)) * 100, 1) if (tpu + fnu) > 0 else 0.0
    metrics["fpr_unsupported"] = round((fpu / (fpu + tnu)) * 100, 1) if (fpu + tnu) > 0 else 0.0

    metrics["precision_ambiguous"] = round((tpa / (tpa + fpa)) * 100, 1) if (tpa + fpa) > 0 else 0.0
    metrics["recall_ambiguous"] = round((tpa / (tpa + fna)) * 100, 1) if (tpa + fna) > 0 else 0.0
    metrics["fpr_ambiguous"] = round((fpa / (fpa + tna)) * 100, 1) if (fpa + tna) > 0 else 0.0

    # Overall planted error FPR
    tn_errors = total_eval - metrics["total_planted_errors"]
    fp_errors = metrics["false_positive_planted_errors"]
    metrics["fpr_planted_errors"] = round((fp_errors / (fp_errors + tn_errors)) * 100, 1) if (fp_errors + tn_errors) > 0 else 0.0

    # Transparent Benchmark Metadata
    metrics["evaluation_unit"] = "Atomic claim verdict evaluated against verified ground-truth labels"
    metrics["evaluation_denominator"] = total_eval
    metrics["total_demo_cases"] = len(metrics["case_results"])
    metrics["confusion_matrix"] = {
        "CONTRADICTED": {"tp": tpc, "fp": fpc, "tn": tnc, "fn": fnc},
        "UNSUPPORTED": {"tp": tpu, "fp": fpu, "tn": tnu, "fn": fnu},
        "AMBIGUOUS": {"tp": tpa, "fp": fpa, "tn": tna, "fn": fna},
    }
    
    return metrics
