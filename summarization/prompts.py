"""
Prompt templates for turning normalized structured data (Stage 4 output)
into a plain-language patient summary.

Prompts are built from the *normalized* data, not raw report text -
grounding the LLM in verified structured fields (rather than noisy OCR
text) keeps the summary honest instead of letting the model guess at
things the extraction pipeline never actually confirmed.
"""

import dataclasses

SYSTEM_PROMPT = (
    "You are a medical report assistant that explains lab reports, "
    "prescriptions, and discharge summaries in plain, non-technical "
    "English for a patient with no medical background. Only explain "
    "the data you are given - do not add new medical advice, diagnoses, "
    "or recommendations beyond what the report already states. If "
    "nothing is flagged or abnormal, say so plainly."
)


def _as_dict_list(normalized_data):
    def _to_dict(item):
        if dataclasses.is_dataclass(item):
            return dataclasses.asdict(item)
        if isinstance(item, dict):
            return item
        return dict(item)

    if isinstance(normalized_data, list):
        return [_to_dict(item) for item in normalized_data]
    return [_to_dict(normalized_data)]


def _build_lab_prompt(rows: list) -> str:
    lines = []
    for row in rows:
        flag = row.get("flag") or "not flagged"
        test_name = row.get("canonical_test_name") or row.get("test_name") or "Lab Test"
        value = row.get("value", "")
        unit = row.get("unit") or ""
        ref_range = row.get("reference_range") or "not provided"
        lines.append(
            f"- {test_name}: {value} {unit} (reference range: {ref_range}, flag: {flag})".strip()
        )
    results_block = "\n".join(lines)

    return (
        "Here are the lab test results from a patient's report:\n\n"
        f"{results_block}\n\n"
        "Please respond with:\n"
        "1. Summary: a 2-3 sentence plain-English summary of this lab report overall.\n"
        "2. Flagged Findings: a list of any abnormal/flagged values from above, "
        "each explained simply (what it means for a value to be high/low here). "
        "If nothing is flagged, say so.\n"
    )


def _build_prescription_prompt(rows: list) -> str:
    lines = []
    for row in rows:
        drug_name = row.get("canonical_drug_name") or row.get("drug_name") or "Medication"
        parts = [drug_name, row.get("dosage") or "dosage not specified"]
        if row.get("frequency"):
            parts.append(row["frequency"])
        if row.get("duration"):
            parts.append(row["duration"])
        lines.append(f"- {' | '.join(p for p in parts if p)}")
    items_block = "\n".join(lines)

    return (
        "Here are the medications extracted from a patient's prescription (which may include handwritten doctor notes):\n\n"
        f"{items_block}\n\n"
        "Please respond with:\n"
        "1. Summary: A 2-3 sentence plain-English summary of what this prescription is for overall and the general health conditions being treated.\n"
        "2. Medications Explained: For each medication listed above, provide a clear, patient-friendly breakdown:\n"
        "   - What it is generally used for (e.g. antibiotic for bacterial infection, stomach acid protection, pain/fever relief).\n"
        "   - Clear instructions on how and when to take it based on the prescribed dosage, frequency, and timing (clarifying shorthand like 'twice daily after meals').\n"
        "3. Flagged Concerns & Pharmacist Tips: Note any missing durations, precautions, or key questions to double-check with the pharmacist (e.g. 'complete the full antibiotic course', 'take before food'). If everything looks clear, reassure the patient.\n"
    )


def _build_discharge_prompt(info: dict) -> str:
    diag = info.get("canonical_diagnosis") or info.get("diagnosis") or "not documented"
    proc = info.get("procedures") or "not documented"
    follow = info.get("follow_up") or "not documented"
    return (
        "Here is a patient's discharge summary:\n\n"
        f"- Diagnosis: {diag}\n"
        f"- Procedures performed: {proc}\n"
        f"- Follow-up instructions: {follow}\n\n"
        "Please respond with:\n"
        "1. Summary: a 2-3 sentence plain-English summary of this hospital stay and "
        "why the patient was there.\n"
        "2. Flagged Findings: a list of the diagnoses/conditions above, each explained "
        "simply in plain language. If a diagnosis is not documented, say so.\n"
        "3. Follow-up: restate the follow-up instructions in plain, easy-to-follow terms.\n"
    )


def build_summary_prompt(normalized_data, doc_type: str) -> str:
    """
    Build the user-turn prompt for summarize_report(). `normalized_data`
    is the Stage 4 normalized output for the given doc_type (a list of
    LabResult/PrescriptionItem dataclasses, or a single DischargeInfo).
    """
    if doc_type == "lab":
        return _build_lab_prompt(_as_dict_list(normalized_data))
    if doc_type == "prescription":
        return _build_prescription_prompt(_as_dict_list(normalized_data))
    if doc_type == "discharge":
        return _build_discharge_prompt(_as_dict_list(normalized_data)[0])
    raise ValueError(f"Unknown doc_type: {doc_type!r}")
