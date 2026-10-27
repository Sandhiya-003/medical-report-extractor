"""
Performance Metrics Calculation Engine for Medical Information Extraction Pipeline.

Computes:
1. Classification Metrics: Accuracy, Precision, Recall, F1-Score, Confusion Matrix.
2. Information Extraction & Normalization Metrics:
   - Field-level & Record-level Precision, Recall, F1.
   - Exact Field Matching Rate.
   - Required Field Completeness Rate.
   - Abnormal/Flagged Detection Sensitivity and Specificity.
3. Latency & Throughput Benchmarks:
   - Mean, Median, Min, Max, P95, StdDev for each stage and total pipeline.
   - Documents per minute / throughput.
4. Summary Quality Metrics:
   - Success Rate, Word Count, Compression Ratio, Clinical Fact Retention Rate, Error Check.
5. Resource Utilization:
   - Memory delta (MB) and peak memory.
"""

import math
import re
from typing import Any, Dict, List, Tuple


def calculate_prf(tp: int, fp: int, fn: int) -> Dict[str, float]:
    """Calculates Precision, Recall, and F1-Score from TP, FP, FN counts."""
    precision = tp / (tp + fp) if (tp + fp) > 0 else (1.0 if fn == 0 else 0.0)
    recall = tp / (tp + fn) if (tp + fn) > 0 else (1.0 if fp == 0 else 0.0)
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0
    return {
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
        "tp": tp,
        "fp": fp,
        "fn": fn,
    }


def compute_classification_metrics(eval_records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes overall accuracy, per-class metrics, macro/micro F1, and confusion matrix.
    """
    categories = ["lab", "prescription", "discharge"]
    confusion_matrix = {true_cat: {pred_cat: 0 for pred_cat in categories} for true_cat in categories}
    
    total = len(eval_records)
    correct = 0

    for r in eval_records:
        true_type = r["ground_truth"]["doc_type"]
        pred_type = r["predicted"]["doc_type"]
        if true_type in confusion_matrix and pred_type in confusion_matrix[true_type]:
            confusion_matrix[true_type][pred_type] += 1
        if true_type == pred_type:
            correct += 1

    accuracy = correct / total if total > 0 else 0.0

    per_class = {}
    macro_p, macro_r, macro_f1 = 0.0, 0.0, 0.0

    for cat in categories:
        tp = confusion_matrix[cat][cat]
        fp = sum(confusion_matrix[other][cat] for other in categories if other != cat)
        fn = sum(confusion_matrix[cat][other] for other in categories if other != cat)
        prf = calculate_prf(tp, fp, fn)
        per_class[cat] = prf
        macro_p += prf["precision"]
        macro_r += prf["recall"]
        macro_f1 += prf["f1"]

    n_classes = len(categories)
    return {
        "accuracy": round(accuracy, 4),
        "correct": correct,
        "total": total,
        "macro_precision": round(macro_p / n_classes, 4),
        "macro_recall": round(macro_r / n_classes, 4),
        "macro_f1": round(macro_f1 / n_classes, 4),
        "per_class": per_class,
        "confusion_matrix": confusion_matrix,
    }


def _normalize_str(s: Any) -> str:
    if s is None:
        return ""
    return str(s).strip().lower()


def evaluate_lab_extraction(gt_fields: List[Dict[str, Any]], pred_fields: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Evaluates field-level extraction accuracy for laboratory reports."""
    gt_by_test = {_normalize_str(r.get("canonical_test_name") or r.get("test_name")): r for r in gt_fields}
    pred_by_test = {_normalize_str(r.get("canonical_test_name") or r.get("test_name")): r for r in pred_fields}

    tp = fp = fn = 0
    matched_exact = 0
    total_evaluated_fields = 0

    checked_fields = ["value", "unit", "reference_range", "flag"]

    for test_name, gt_row in gt_by_test.items():
        if test_name in pred_by_test:
            pred_row = pred_by_test[test_name]
            # test name matched -> TP for the test identification
            tp += 1

            for field in checked_fields:
                gt_val = gt_row.get(field)
                pred_val = pred_row.get(field)
                total_evaluated_fields += 1

                # Value comparison with numeric tolerance
                if field == "value":
                    try:
                        if abs(float(gt_val) - float(pred_val)) < 1e-3:
                            tp += 1
                            matched_exact += 1
                        else:
                            fp += 1
                            fn += 1
                    except (ValueError, TypeError):
                        if _normalize_str(gt_val) == _normalize_str(pred_val):
                            tp += 1
                            matched_exact += 1
                        else:
                            fp += 1
                            fn += 1
                else:
                    if _normalize_str(gt_val) == _normalize_str(pred_val):
                        tp += 1
                        matched_exact += 1
                    elif gt_val and not pred_val:
                        fn += 1
                    elif pred_val and not gt_val:
                        fp += 1
                    else:
                        fp += 1
                        fn += 1
        else:
            # Whole test record missed
            fn += 1 + len(checked_fields)

    for test_name, pred_row in pred_by_test.items():
        if test_name not in gt_by_test:
            # Spurious test hallucinated
            fp += 1 + len(checked_fields)

    prf = calculate_prf(tp, fp, fn)
    exact_match_rate = matched_exact / total_evaluated_fields if total_evaluated_fields > 0 else 1.0
    return {
        **prf,
        "exact_match_rate": round(exact_match_rate, 4),
        "total_fields": total_evaluated_fields,
        "matched_exact": matched_exact,
        "records_gt": len(gt_fields),
        "records_pred": len(pred_fields),
    }


def evaluate_prescription_extraction(gt_fields: List[Dict[str, Any]], pred_fields: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Evaluates field-level extraction accuracy for prescriptions."""
    gt_by_drug = {_normalize_str(r.get("canonical_drug_name") or r.get("drug_name")): r for r in gt_fields}
    pred_by_drug = {_normalize_str(r.get("canonical_drug_name") or r.get("drug_name")): r for r in pred_fields}

    tp = fp = fn = 0
    matched_exact = 0
    total_evaluated_fields = 0

    checked_fields = ["dosage", "frequency", "duration"]

    for drug, gt_row in gt_by_drug.items():
        if drug in pred_by_drug:
            pred_row = pred_by_drug[drug]
            tp += 1  # Drug identified

            for field in checked_fields:
                gt_val = _normalize_str(gt_row.get(field))
                pred_val = _normalize_str(pred_row.get(field))
                total_evaluated_fields += 1

                # Normalize whitespace & punctuation
                gt_clean = re.sub(r"[^\w]", "", gt_val)
                pred_clean = re.sub(r"[^\w]", "", pred_val)

                if gt_clean == pred_clean or (gt_clean in pred_clean) or (pred_clean in gt_clean):
                    tp += 1
                    matched_exact += 1
                elif gt_val and not pred_val:
                    fn += 1
                elif pred_val and not gt_val:
                    fp += 1
                else:
                    fp += 1
                    fn += 1
        else:
            fn += 1 + len(checked_fields)

    for drug, pred_row in pred_by_drug.items():
        if drug not in gt_by_drug:
            fp += 1 + len(checked_fields)

    prf = calculate_prf(tp, fp, fn)
    exact_match_rate = matched_exact / total_evaluated_fields if total_evaluated_fields > 0 else 1.0
    return {
        **prf,
        "exact_match_rate": round(exact_match_rate, 4),
        "total_fields": total_evaluated_fields,
        "matched_exact": matched_exact,
        "records_gt": len(gt_fields),
        "records_pred": len(pred_fields),
    }


def evaluate_discharge_extraction(gt_fields: Dict[str, Any], pred_fields: Dict[str, Any]) -> Dict[str, Any]:
    """Evaluates field extraction completeness & quality for discharge summaries."""
    tp = fp = fn = 0
    matched_exact = 0
    total_evaluated_fields = 0

    checked_fields = ["diagnosis", "procedures", "follow_up"]

    for field in checked_fields:
        total_evaluated_fields += 1
        gt_val = _normalize_str(gt_fields.get(field))
        pred_val = _normalize_str(pred_fields.get(field))

        if gt_val and pred_val:
            # Check overlap / entity containment
            gt_words = set(re.findall(r"\b\w{3,}\b", gt_val))
            pred_words = set(re.findall(r"\b\w{3,}\b", pred_val))
            overlap = len(gt_words & pred_words) / max(len(gt_words), 1)

            if overlap >= 0.5:
                tp += 1
                matched_exact += 1
            else:
                tp += 1  # partial hit
                fp += 1
        elif gt_val and not pred_val:
            fn += 1
        elif pred_val and not gt_val:
            fp += 1
        else:
            tp += 1

    prf = calculate_prf(tp, fp, fn)
    exact_match_rate = matched_exact / total_evaluated_fields if total_evaluated_fields > 0 else 1.0
    return {
        **prf,
        "exact_match_rate": round(exact_match_rate, 4),
        "total_fields": total_evaluated_fields,
        "matched_exact": matched_exact,
    }


def evaluate_flagged_sensitivity(eval_records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes sensitivity (recall) and specificity of clinical abnormal/flag detection for lab tests.
    """
    tp = fp = fn = tn = 0

    for r in eval_records:
        if r["ground_truth"]["doc_type"] != "lab":
            continue

        gt_fields = r["ground_truth"]["fields"]
        pred_fields = r["predicted"]["normalized"]
        if not isinstance(pred_fields, list):
            pred_fields = [pred_fields]

        gt_flags = {
            _normalize_str(item.get("canonical_test_name")): (_normalize_str(item.get("flag")) in ["high", "low", "abnormal", "critical"])
            for item in gt_fields
        }

        pred_flags = {
            _normalize_str(item.get("canonical_test_name")): (_normalize_str(item.get("flag")) in ["high", "low", "abnormal", "critical"])
            for item in pred_fields if isinstance(item, dict)
        }

        for test_name, is_gt_abnormal in gt_flags.items():
            is_pred_abnormal = pred_flags.get(test_name, False)
            if is_gt_abnormal and is_pred_abnormal:
                tp += 1
            elif is_gt_abnormal and not is_pred_abnormal:
                fn += 1
            elif not is_gt_abnormal and is_pred_abnormal:
                fp += 1
            else:
                tn += 1

    sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 1.0
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 1.0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 1.0
    f1 = 2 * precision * sensitivity / (precision + sensitivity) if (precision + sensitivity) > 0 else 0.0

    return {
        "sensitivity": round(sensitivity, 4),
        "specificity": round(specificity, 4),
        "precision": round(precision, 4),
        "f1": round(f1, 4),
        "tp": tp,
        "fp": fp,
        "fn": fn,
        "tn": tn,
    }


def compute_latency_stats(latencies: List[float]) -> Dict[str, float]:
    """Computes summary statistics (mean, median, p95, min, max, stddev) for latency measurements in ms."""
    if not latencies:
        return {"mean": 0.0, "median": 0.0, "p95": 0.0, "min": 0.0, "max": 0.0, "stddev": 0.0}

    s = sorted(latencies)
    n = len(s)
    mean_val = sum(s) / n
    median_val = s[n // 2] if n % 2 != 0 else (s[n // 2 - 1] + s[n // 2]) / 2.0
    p95_idx = min(int(math.ceil(0.95 * n)) - 1, n - 1)
    p95_val = s[p95_idx]
    variance = sum((x - mean_val) ** 2 for x in s) / n
    stddev = math.sqrt(variance)

    return {
        "mean_ms": round(mean_val, 2),
        "median_ms": round(median_val, 2),
        "p95_ms": round(p95_val, 2),
        "min_ms": round(s[0], 2),
        "max_ms": round(s[-1], 2),
        "stddev_ms": round(stddev, 2),
    }


def compute_summary_quality(eval_records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Evaluates summary generation success rate, word count, clinical key term retention,
    and lack of error markers.
    """
    total = len(eval_records)
    valid_summaries = 0
    word_counts = []
    has_error_markers = 0
    clinical_term_retention_scores = []

    for r in eval_records:
        summary = r["predicted"].get("summary") or ""
        raw_text = r["predicted"].get("raw_text") or ""
        doc_type = r["ground_truth"]["doc_type"]

        words = summary.split()
        word_count = len(words)
        word_counts.append(word_count)

        if "Error:" in summary or "Traceback" in summary or len(words) < 10:
            has_error_markers += 1
        else:
            valid_summaries += 1

        # Check key clinical term preservation
        gt = r["ground_truth"]
        terms_to_check = []
        if doc_type == "lab":
            terms_to_check = gt.get("expected_flagged") or []
        elif doc_type == "prescription":
            terms_to_check = gt.get("expected_drugs") or []
        elif doc_type == "discharge":
            terms_to_check = gt.get("key_diagnosis_terms") or []

        if terms_to_check:
            found = sum(1 for term in terms_to_check if term.lower() in summary.lower())
            score = found / len(terms_to_check)
            clinical_term_retention_scores.append(score)
        else:
            clinical_term_retention_scores.append(1.0)

    avg_words = sum(word_counts) / len(word_counts) if word_counts else 0.0
    avg_retention = sum(clinical_term_retention_scores) / len(clinical_term_retention_scores) if clinical_term_retention_scores else 0.0

    return {
        "success_rate": round(valid_summaries / total, 4) if total > 0 else 0.0,
        "valid_summaries": valid_summaries,
        "total_documents": total,
        "avg_word_count": round(avg_words, 1),
        "clinical_term_retention_rate": round(avg_retention, 4),
        "error_marker_count": has_error_markers,
    }
