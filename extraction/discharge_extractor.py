"""
Extraction of key fields from a discharge summary.

Discharge summaries are mostly free-flowing prose organized under
headings (Diagnosis, Procedures, Follow-up, ...), so regex alone can't
pull structured values the way it can for lab results. Instead this
locates the relevant sections by heading, then runs NER over the
diagnosis text to surface the specific clinical entities mentioned
(conditions), which is more useful downstream than the raw sentence.
"""

import json
import os
from dotenv import load_dotenv

from extraction.ner_model import extract_entities
from extraction.section_splitter import split_into_sections, get_section, get_section_by_keywords

load_dotenv()

DIAGNOSIS_KEYS = [
    "diagnosis", "diagnoses", "discharge_diagnosis", "discharge_diagnoses",
    "final_diagnosis", "primary_diagnosis", "reason_for_admission",
    "chief_complaint", "admitting_diagnosis", "impression",
]
PROCEDURES_KEYS = ["procedures", "procedure", "procedure_notes", "procedures_performed"]
PROCEDURES_KEYWORDS = ["procedure", "surgical", "surgery"]
FOLLOW_UP_KEYS = ["follow_up", "followup", "follow-up", "discharge_instructions", "follow_up_care", "follow_up_instructions"]
FOLLOW_UP_KEYWORDS = ["follow", "discharge_instruction", "discharge_plan"]


def _llm_extract_discharge_info(text: str) -> dict:
    """
    Fallback extraction using Gemini when section headings are not found.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {"diagnosis": None, "diagnosis_entities": [], "procedures": None, "follow_up": None}

    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        prompt = (
            "Extract key discharge summary information from this clinical text into a JSON object.\n"
            "The object must have:\n"
            "- \"diagnosis\": string or null (primary diagnosis or condition)\n"
            "- \"diagnosis_entities\": array of strings (e.g. ['Hypertension', 'Type 2 Diabetes'])\n"
            "- \"procedures\": string or null (procedures, surgeries, or scans performed)\n"
            "- \"follow_up\": string or null (follow-up directions, clinic visits, recovery instructions)\n\n"
            "Return ONLY the valid JSON object without commentary or code fences.\n\n"
            f"Discharge Text:\n{text[:4000]}"
        )
        for model in ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.8-flash"]:
            try:
                resp = client.models.generate_content(model=model, contents=prompt)
                if not resp.text:
                    continue
                clean = resp.text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
                data = json.loads(clean)
                if isinstance(data, dict):
                    return {
                        "diagnosis": data.get("diagnosis"),
                        "diagnosis_entities": data.get("diagnosis_entities") or [],
                        "procedures": data.get("procedures"),
                        "follow_up": data.get("follow_up"),
                    }
            except Exception:
                continue
    except Exception:
        pass
    return {"diagnosis": None, "diagnosis_entities": [], "procedures": None, "follow_up": None}


def extract_discharge_info(text: str) -> dict:
    """
    Extract discharge summary fields into a dict:
    {"diagnosis", "diagnosis_entities", "procedures", "follow_up"}
    """
    sections = split_into_sections(text)

    diagnosis_text = get_section(sections, DIAGNOSIS_KEYS)
    procedures_text = get_section(sections, PROCEDURES_KEYS) or get_section_by_keywords(sections, PROCEDURES_KEYWORDS)
    follow_up_text = get_section(sections, FOLLOW_UP_KEYS) or get_section_by_keywords(sections, FOLLOW_UP_KEYWORDS)

    if not diagnosis_text and text and text.strip():
        # Fallback to LLM extraction if heading-based splitter found nothing
        llm_res = _llm_extract_discharge_info(text)
        if llm_res.get("diagnosis"):
            return llm_res

    diagnosis_entities = [ent["text"] for ent in extract_entities(diagnosis_text)] if diagnosis_text else []

    return {
        "diagnosis": diagnosis_text or None,
        "diagnosis_entities": diagnosis_entities,
        "procedures": procedures_text or None,
        "follow_up": follow_up_text or None,
    }

