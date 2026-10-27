"""
Regex, tabular parser, and LLM-augmented extraction of lab test results.

Targets standard lines like:
    "Hemoglobin: 13.5 g/dL (12.0-15.5 g/dL, Normal)"
as well as markdown pipe tables (| Test | Value | Unit | Range |),
tabular space-separated lines, and arbitrary real-world hospital lab report formats.
"""

import json
import os
import re
from dotenv import load_dotenv

load_dotenv()

LAB_LINE_RE = re.compile(
    r"^(?P<test>[A-Za-z][A-Za-z0-9 /()%-]*?)\s*:\s*"
    r"(?P<value>\d+\.?\d*)\s*"
    r"(?P<unit>[A-Za-zµμ/%]+)?"
    r"(?:\s*\(\s*(?P<paren>[^)]+?)\s*\))?"
    r"\s*$",
    re.MULTILINE,
)

TABULAR_LAB_RE = re.compile(
    r"^(?P<test>[A-Za-z][A-Za-z0-9 /()%-]{2,40}?)\s+"
    r"(?P<value>\d+\.?\d*)\s+"
    r"(?P<unit>[A-Za-zµμ/%]+)?\s*"
    r"(?:(?:\(|\b)(?P<range>\d+\.?\d*\s*[-–]\s*\d+\.?\d*(?:\s*[A-Za-zµμ/%]+)?)(?:\)|\b))?\s*"
    r"(?P<flag>Normal|High|Low|Abnormal|Critical)?",
    re.IGNORECASE | re.MULTILINE,
)

FLAG_WORDS = {"normal", "high", "low", "abnormal", "critical"}
RANGE_RE = re.compile(r"(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)")

NON_LAB_TEST_KEYWORDS = {
    "age", "name", "sex", "gender", "ref by", "ref", "dr", "doctor", "date",
    "location", "phone", "mobile", "pin", "bed", "room", "mrn", "patient",
    "specimen", "hospital", "clinic", "impression", "test name", "tests",
    "results", "result", "unit", "units", "reference range", "reference value",
    "reference intervals", "reference interval", "pathologist", "method", "reg",
    "uid", "sample", "reported", "collected", "differential count", "c.b.c",
    "complete blood count", "investigation", "investigations", "profile", "status",
    "interpretation", "department", "sr.no", "sr no", "s.no", "no", "flag",
    "flags", "bio. ref. interval", "biological reference interval", "page",
    "final report", "lab no", "registered", "verified by", "consultant"
}


def _is_valid_lab_test_name(name: str) -> bool:
    """Validate that a candidate test name is a genuine clinical test and not demographic metadata."""
    if not name or not isinstance(name, str):
        return False
    clean = name.strip().lower()
    if len(clean) < 2 or len(clean) > 60:
        return False
    if clean in NON_LAB_TEST_KEYWORDS:
        return False
    for kw in (
        "age", "patient", "dr.", "doctor", "date", "sample", "specimen", 
        "ref by", "referred", "hospital", "clinic", "phone", "mobile", "address",
        "reg no", "barcode", "page ", "collected", "reported", "technician"
    ):
        if clean.startswith(kw):
            return False
    # Must contain at least one letter
    if not re.search(r"[A-Za-z]", clean):
        return False
    # Should not look like a date string
    if re.match(r"^\d{1,4}[-/\.]\d{1,2}[-/\.]\d{1,4}", clean):
        return False
    return True


def _compute_flag_from_range(value: float, ref_range: str) -> str:
    if not ref_range:
        return None
    rng_m = RANGE_RE.search(ref_range)
    if rng_m:
        try:
            low_b = float(rng_m.group(1))
            high_b = float(rng_m.group(2))
            if value < low_b:
                return "Low"
            elif value > high_b:
                return "High"
            else:
                return "Normal"
        except (ValueError, TypeError):
            pass
    return None


def _parse_paren(paren: str):
    """
    A parenthesized suffix can hold a reference range, a flag word, or
    both separated by a comma (e.g. "12.0-15.5 g/dL, Normal"). Split it
    apart into (reference_range, flag).
    """
    if not paren:
        return None, None

    reference_range = None
    flag = None
    for part in paren.split(","):
        part = part.strip()
        if not part:
            continue
        if part.lower() in FLAG_WORDS:
            flag = part.capitalize()
        elif RANGE_RE.search(part):
            reference_range = part
        elif flag is None:
            flag = part
    return reference_range, flag


def _parse_pipe_tables(text: str) -> list:
    """
    Extract lab results formatted in Markdown/pipe tables commonly generated
    by Vision OCR or digital medical PDF extraction.
    Example: | Hemoglobin | 12.7 | gm% | 12 - 16 |
    """
    results = []
    lines = text.splitlines()
    for line in lines:
        if "|" not in line:
            continue
        parts = [p.strip() for p in line.split("|")]
        if line.strip().startswith("|") and len(parts) > 1:
            parts = parts[1:]
        if line.strip().endswith("|") and len(parts) > 1:
            parts = parts[:-1]

        parts = [p.strip() for p in parts]
        # Skip markdown separator rows like |---|---|
        if not parts or all(re.match(r"^:?-+:?$", p) or not p for p in parts):
            continue

        # Check if first column is an index number (e.g., 1, 2, 3)
        if parts[0].isdigit() and len(parts) >= 3 and not re.search(r"[A-Za-z]", parts[0]):
            parts = parts[1:]

        if len(parts) < 2:
            continue

        test_candidate = parts[0]
        if not _is_valid_lab_test_name(test_candidate):
            continue

        # Parse numerical result
        val_str = parts[1]
        val_match = re.search(r"[-+]?\d*\.?\d+", val_str)
        if not val_match:
            continue

        try:
            value = float(val_match.group(0))
        except (ValueError, TypeError):
            continue

        unit = None
        ref_range = None
        flag = None

        # Process additional columns (Unit, Reference Range, Flag/Status)
        rem = parts[2:]
        for col in rem:
            if not col:
                continue
            col_lower = col.lower()
            if col_lower in FLAG_WORDS:
                flag = col.capitalize()
            elif RANGE_RE.search(col) or "<" in col or ">" in col:
                if not ref_range:
                    ref_range = col
            elif not unit and re.search(r"[A-Za-z/%µμ]", col) and len(col) <= 15:
                unit = col

        # If no explicit flag is printed on the row, compute it from reference range
        if not flag and ref_range:
            flag = _compute_flag_from_range(value, ref_range)

        results.append({
            "test_name": test_candidate,
            "value": value,
            "unit": unit,
            "reference_range": ref_range,
            "flag": flag,
        })
    return results


def _llm_extract_lab_values(text: str) -> list:
    """
    Intelligent extraction fallback using Gemini when regular expressions
    find no structured lab rows in non-empty text.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return []

    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        prompt = (
            "You are an expert clinical laboratory data extraction system.\n"
            "Extract all laboratory test results, biomarkers, parameters, and measurements from this clinical text into a JSON array.\n"
            "Each object must have:\n"
            "- \"test_name\": string (test name, e.g. 'Hemoglobin', 'Total WBC Count', 'Platelet Count', 'Glucose', 'Creatinine')\n"
            "- \"value\": number/float (e.g. 13.5)\n"
            "- \"unit\": string or null (e.g. 'g/dL', '/uL', '%', 'fL', 'pg')\n"
            "- \"reference_range\": string or null (e.g. '12.0 - 15.5 g/dL')\n"
            "- \"flag\": string or null ('Normal', 'High', 'Low', 'Abnormal', 'Critical')\n\n"
            "IMPORTANT RULES:\n"
            "1. ONLY extract laboratory tests, biomarkers, and measurements.\n"
            "2. DO NOT extract patient demographics such as Age, Sex, Gender, Date, Patient Name, Doctor / Ref By, Hospital / Clinic, Phone, MRN, or Barcode.\n"
            "3. If a reference range is present, infer 'Normal', 'High', or 'Low' if not explicitly stated.\n"
            "4. Return ONLY a valid JSON array without commentary or markdown fences.\n\n"
            f"Clinical Text:\n{text[:6000]}"
        )
        for model in ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.8-flash"]:
            try:
                resp = client.models.generate_content(model=model, contents=prompt)
                if not resp.text:
                    continue
                clean = resp.text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
                data = json.loads(clean)
                if isinstance(data, list) and data:
                    formatted = []
                    for item in data:
                        if not isinstance(item, dict) or not item.get("test_name"):
                            continue
                        name = str(item["test_name"]).strip()
                        if not _is_valid_lab_test_name(name):
                            continue
                        try:
                            val = float(item.get("value"))
                        except (ValueError, TypeError):
                            continue
                        ref_range = str(item.get("reference_range") or "").strip() or None
                        flag = str(item.get("flag") or "").strip().capitalize() if item.get("flag") else None
                        if not flag and ref_range:
                            flag = _compute_flag_from_range(val, ref_range)

                        formatted.append({
                            "test_name": name,
                            "value": val,
                            "unit": str(item.get("unit") or "").strip() or None,
                            "reference_range": ref_range,
                            "flag": flag,
                        })
                    if formatted:
                        return formatted
            except Exception:
                continue
    except Exception:
        pass
    return []


def extract_lab_values(text: str) -> list:
    """
    Extract lab results into a list of dicts:
    {"test_name", "value", "unit", "reference_range", "flag"}
    """
    if not text or not text.strip():
        return []

    results = []
    seen_tests = set()

    # 1. Try markdown / pipe-delimited tables first (very common in OCR output)
    pipe_results = _parse_pipe_tables(text)
    for r in pipe_results:
        key = r["test_name"].lower()
        if key not in seen_tests:
            seen_tests.add(key)
            results.append(r)

    # 2. Try standard colon-separated pattern (e.g. "Hemoglobin: 13.5 g/dL (12.0-15.5, Normal)")
    for match in LAB_LINE_RE.finditer(text):
        test_name = match.group("test").strip()
        if not _is_valid_lab_test_name(test_name):
            continue
        key = test_name.lower()
        if key in seen_tests:
            continue

        try:
            value = float(match.group("value"))
        except (ValueError, TypeError):
            continue

        unit = (match.group("unit") or "").strip() or None
        reference_range, flag = _parse_paren(match.group("paren"))
        if not flag and reference_range:
            flag = _compute_flag_from_range(value, reference_range)

        seen_tests.add(key)
        results.append({
            "test_name": test_name,
            "value": value,
            "unit": unit,
            "reference_range": reference_range,
            "flag": flag,
        })

    # 3. Try tabular space-separated pattern
    for match in TABULAR_LAB_RE.finditer(text):
        test_name = match.group("test").strip()
        if not _is_valid_lab_test_name(test_name):
            continue
        key = test_name.lower()
        if key in seen_tests:
            continue

        try:
            value = float(match.group("value"))
        except (ValueError, TypeError):
            continue

        unit = (match.group("unit") or "").strip() or None
        ref = (match.group("range") or "").strip() or None
        flag = (match.group("flag") or "").strip().capitalize() or None
        if not flag and ref:
            flag = _compute_flag_from_range(value, ref)

        seen_tests.add(key)
        results.append({
            "test_name": test_name,
            "value": value,
            "unit": unit,
            "reference_range": ref,
            "flag": flag,
        })

    # 4. If structured matches found fewer than 2 tests on substantial text, use LLM extraction fallback
    if len(results) < 2 and len(text.strip()) > 30:
        llm_results = _llm_extract_lab_values(text)
        if len(llm_results) > len(results):
            return llm_results
        # Otherwise merge any new items found by LLM
        for r in llm_results:
            key = r["test_name"].lower()
            if key not in seen_tests:
                seen_tests.add(key)
                results.append(r)

    return results

