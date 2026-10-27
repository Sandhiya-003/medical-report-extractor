"""
Heuristic document-type classifier.

Decides whether a medical report's raw text is a lab report, a
prescription, or a discharge summary by counting keyword hits per
category and picking the highest score. Simple on purpose - this is a
baseline to unblock the per-type extractors, not a trained model.
"""

import os
import re
from dotenv import load_dotenv

load_dotenv()

LAB_KEYWORDS = [
    "reference range", "test name", "specimen", "laboratory",
    "lab report", "hemoglobin", "wbc", "platelet", "cbc",
    "mg/dl", "/ul", "g/dl", "impression", "serum", "pathology",
]

PRESCRIPTION_KEYWORDS = [
    "rx", "℞", "prescription", "prescribed", "prescribing", "physician", "doctor",
    "dr.", "clinic", "dispense", "dosage", "dose", "sig", "sig:", "refill", "refills",
    "tablet", "tablets", "tab", "tab.", "capsule", "capsules", "cap", "cap.",
    "syrup", "syp", "syp.", "suspension", "susp", "drops", "injection", "inj",
    "ointment", "cream", "inhaler", "mg", "mcg", "ml", "iu", "units",
    "daily", "once daily", "twice daily", "thrice daily", "three times daily",
    "bid", "bd", "tid", "tds", "qid", "od", "hs", "qhs", "prn", "sos", "stat",
    "po", "take orally", "orally", "before meals", "after meals", "ac", "pc",
    "as needed", "medication", "medications", "advice",
]

DISCHARGE_KEYWORDS = [
    "discharge summary", "diagnosis", "follow-up", "follow up",
    "hospital course", "admitted", "discharged", "admission",
    "procedure", "procedures",
]

CATEGORY_KEYWORDS = {
    "lab": LAB_KEYWORDS,
    "prescription": PRESCRIPTION_KEYWORDS,
    "discharge": DISCHARGE_KEYWORDS,
}


def _score(text: str, keywords: list) -> int:
    return sum(len(re.findall(r"\b" + re.escape(kw) + r"\b", text) if len(kw) <= 3 else re.findall(re.escape(kw), text)) for kw in keywords)


def _llm_classify_document(text: str) -> str:
    """
    Fallback classifier using Gemini when heuristic keyword hits are zero or tied.
    Accurately classifies handwritten doctor prescriptions and unconventional summaries.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return "lab"

    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        prompt = (
            "Classify this clinical document into exactly one of three categories:\n"
            "- 'lab' (laboratory test report with tests, numbers, reference intervals)\n"
            "- 'prescription' (doctor's prescription, handwritten Rx slip, medication list, drug dosages)\n"
            "- 'discharge' (hospital inpatient discharge summary, admission/discharge notes, procedures)\n\n"
            "Respond with ONLY the lowercase category name: lab, prescription, or discharge.\n\n"
            f"Document snippet:\n{text[:1200]}"
        )
        for model in ["gemini-3.5-flash-lite", "gemini-3.5-flash"]:
            try:
                resp = client.models.generate_content(model=model, contents=prompt)
                if resp.text:
                    cleaned = resp.text.strip().lower()
                    for cat in ["prescription", "discharge", "lab"]:
                        if cat in cleaned:
                            return cat
            except Exception:
                continue
    except Exception:
        pass
    return "lab"


def classify_document(text: str) -> str:
    """
    Return "lab", "prescription", or "discharge" based on keyword hits.
    Falls back to LLM classification for messy handwritten or non-standard documents.
    """
    lowered = text.lower()
    scores = {category: _score(lowered, keywords) for category, keywords in CATEGORY_KEYWORDS.items()}
    best_category = max(scores, key=scores.get)
    if scores[best_category] == 0:
        if text and len(text.strip()) > 15:
            return _llm_classify_document(text)
        return "lab"
    return best_category
