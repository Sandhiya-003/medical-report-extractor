"""
Extraction of prescription line items (drug, dosage, frequency, duration).

Approach: regex finds the structured, predictable parts of an Rx line -
dosage amounts, frequency phrasing, duration - since those follow a
handful of common patterns. The drug name itself is free text with no
fixed pattern, so instead of guessing with more regex we lean on the
scispaCy NER model to confirm which words in the line are a recognized
clinical entity.
"""

import json
import os
import re
from dotenv import load_dotenv

from extraction.ner_model import extract_entities
from extraction.section_splitter import split_into_sections, get_section

load_dotenv()

DOSAGE_RE = re.compile(r"\d+\.?\d*\s*(?:mg|mcg|g|ml|iu|units?)", re.IGNORECASE)

FREQUENCY_RE = re.compile(
    r"\d+x\s*daily|once daily|twice daily|three times daily|four times daily|"
    r"every\s+\d+\s*hours?|every\s+(?:morning|evening|night|day)|"
    r"as needed|\bbid\b|\btid\b|\bqid\b",
    re.IGNORECASE,
)

DURATION_RE = re.compile(r"for\s+\d+\s*(?:days|day|weeks|week)", re.IGNORECASE)

LEADING_NUMBERING_RE = re.compile(r"^\s*\d+[.)]\s*")


def _extract_drug_name(line: str, dosage_match) -> str:
    """
    The drug name is whatever text sits before the dosage amount, once
    list numbering ("1.") is stripped off.
    """
    before_dosage = line[:dosage_match.start()]
    before_dosage = LEADING_NUMBERING_RE.sub("", before_dosage)
    return before_dosage.strip(" -:")


def _llm_extract_prescription_info(text: str) -> list:
    """
    Advanced extraction using Gemini specialized for handwritten doctor prescriptions,
    clinical shorthand (OD, BD, TID, SOS, AC, PC, 1-0-1), and non-standard layouts.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return []

    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        prompt = (
            "Extract all prescribed medications, dosages, frequencies, and durations from this medical prescription into a JSON array.\n"
            "This document may be a handwritten doctor's prescription slip, clinical Rx order, or outpatient notes.\n\n"
            "Guidelines for clinical shorthand & doctor abbreviations:\n"
            "1. Medication Names: Recognize both brand and generic names (e.g., 'Augmentin', 'Pantocid', 'Dolo', 'Azithromycin').\n"
            "2. Shorthand Frequencies: Translate physician abbreviations into clear standard terms:\n"
            "   - OD / QD -> 'once daily'\n"
            "   - BD / BID / 1-0-1 -> 'twice daily (morning and night)'\n"
            "   - TDS / TID / 1-1-1 -> 'three times daily'\n"
            "   - QID -> 'four times daily'\n"
            "   - QHS / HS / 0-0-1 -> 'at bedtime / night'\n"
            "   - SOS / PRN -> 'as needed (SOS)'\n"
            "   - AC -> 'before meals (empty stomach)'\n"
            "   - PC -> 'after meals'\n"
            "   - STAT -> 'immediately'\n"
            "3. Dosages & Forms: Strip leading 'Tab.' or 'Cap.' into the drug form or append to dosage (e.g. '625mg', '40mg', '10 mL').\n"
            "4. Duration: Normalize time spans (e.g. 'x 5d' -> 'for 5 days', 'x 1wk' -> 'for 1 week').\n\n"
            "Each object in the JSON array must contain:\n"
            "- \"drug\": string (drug name, e.g. 'Augmentin' or 'Amoxicillin')\n"
            "- \"dosage\": string or null (e.g. '625mg', '1 tablet')\n"
            "- \"frequency\": string or null (e.g. 'twice daily after meals')\n"
            "- \"duration\": string or null (e.g. 'for 5 days')\n"
            "- \"ner_confirmed\": boolean (true)\n\n"
            "Return ONLY the valid JSON array without commentary or code fences.\n\n"
            f"Prescription Text:\n{text[:4000]}"
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
                        if not isinstance(item, dict) or not item.get("drug"):
                            continue
                        formatted.append({
                            "drug": str(item["drug"]).strip(),
                            "dosage": str(item.get("dosage") or "").strip() or None,
                            "frequency": str(item.get("frequency") or "").strip() or None,
                            "duration": str(item.get("duration") or "").strip() or None,
                            "ner_confirmed": True,
                        })
                    if formatted:
                        return formatted
            except Exception:
                continue
    except Exception:
        pass
    return []


def extract_prescription_info(text: str) -> list:
    """
    Extract prescription line items into a list of dicts:
    {"drug", "dosage", "frequency", "duration", "ner_confirmed"}
    Uses regex as fast pass and seamlessly fuses with Gemini LLM extraction for
    handwritten prescriptions and complex physician shorthand.
    """
    sections = split_into_sections(text)
    rx_text = get_section(sections, ["rx", "prescription", "medications"]) or text

    entities = extract_entities(rx_text)
    entity_texts_lower = {ent["text"].lower() for ent in entities}

    results = []
    for line in rx_text.splitlines():
        line = line.strip()
        if not line:
            continue

        dosage_match = DOSAGE_RE.search(line)
        if not dosage_match:
            continue

        drug = _extract_drug_name(line, dosage_match)
        if not drug:
            continue

        frequency_match = FREQUENCY_RE.search(line)
        duration_match = DURATION_RE.search(line)

        ner_confirmed = any(
            drug.lower() in entity_text or entity_text in drug.lower()
            for entity_text in entity_texts_lower
        )

        results.append({
            "drug": drug,
            "dosage": dosage_match.group().strip(),
            "frequency": frequency_match.group().strip() if frequency_match else None,
            "duration": duration_match.group().strip() if duration_match else None,
            "ner_confirmed": ner_confirmed,
        })

    # If regex captured items, check if LLM identifies more (common in handwritten Rx)
    if text and text.strip():
        llm_results = _llm_extract_prescription_info(text)
        if len(llm_results) > len(results):
            return llm_results
        if not results and llm_results:
            return llm_results
        
        # Merge any medications found by LLM that were missed by regex
        existing_drugs = {r["drug"].lower() for r in results}
        for item in llm_results:
            item_key = item["drug"].lower()
            if item_key not in existing_drugs and not any(item_key in d or d in item_key for d in existing_drugs):
                existing_drugs.add(item_key)
                results.append(item)

    return results

