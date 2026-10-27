import io
import os
import shutil

import pytesseract
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

# If Tesseract is already on PATH, pytesseract finds it with no config
# needed. Otherwise, fall back to common install locations.
if shutil.which("tesseract") is None:
    _CANDIDATES = [
        os.path.expanduser(r"~\Downloads\tesseract.exe"),
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe"),
        "/opt/homebrew/bin/tesseract",
        "/usr/local/bin/tesseract",
        "/usr/bin/tesseract",
    ]
    _found = next((p for p in _CANDIDATES if os.path.isfile(p)), None)
    if _found:
        pytesseract.pytesseract.tesseract_cmd = _found


def _is_high_quality_ocr(text: str) -> bool:
    """
    Checks if extracted OCR text has reasonable linguistic quality.
    Handwritten documents through classical Tesseract often yield high-entropy
    gibberish, symbols, or very few recognizable words.
    """
    if not text or len(text.strip()) < 15:
        return False
    words = [w for w in text.split() if len(w) > 1]
    if len(words) < 4:
        return False
    alnum_count = sum(1 for c in text if c.isalnum() or c.isspace())
    if alnum_count / max(len(text), 1) < 0.65:
        return False
    return True


def _gemini_ocr_image(image: Image.Image) -> str:
    """
    Multimodal Vision OCR using Google Gemini.
    Specialized for deciphering handwritten medical reports, doctor cursive prescriptions,
    Rx symbols, dosage instructions, and clinical shorthand.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return ""
    
    # Use unbinarized full-color RGB image if available so pen ink, shading, and cursive loops are preserved
    vision_image = getattr(image, "_raw_color_image", image)
    if vision_image.mode != "RGB":
        vision_image = vision_image.convert("RGB")

    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        prompt = (
            "You are an expert clinical medical transcriptionist and hospital pharmacist.\n"
            "Carefully examine this medical document or doctor's prescription and transcribe all text verbatim.\n\n"
            "Specialized instructions for handwritten prescriptions & clinical documents:\n"
            "1. Decipher handwritten doctor handwriting, cursive notes, prescription pads, and clinic stationery.\n"
            "2. Accurately transcribe medication names, brand names, formulations (Tab, Cap, Syp, Inj, Oint), "
            "strengths/dosages (mg, mcg, g, mL, units), frequencies, and durations.\n"
            "3. Decipher clinical Latin & doctor dosing abbreviations into clear expressions:\n"
            "   - Frequency: OD (once daily), BD/BID/1-0-1 (twice daily), TDS/TID/1-1-1 (three times daily), "
            "QID (four times daily), QHS/HS/0-0-1 (at bedtime / night), PRN/SOS (as needed / when required), "
            "STAT (immediately), AC (before meals), PC (after meals), Q4H/Q6H/Q8H (every 4/6/8 hours).\n"
            "   - Common doctor notation: '1 tab BD pc x 5d' -> '1 tablet twice daily after meals for 5 days'.\n"
            "4. If doctor handwriting is hurried or difficult, apply pharmacological context to transcribe "
            "the intended medication name and standard dosing safely.\n"
            "5. Preserve sections, headers, patient details, lab values/units if present, doctor instructions, and advice.\n"
            "6. Return the complete verbatim medical transcription without preamble or markdown code fences."
        )
        for model_name in ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.8-flash"]:
            try:
                resp = client.models.generate_content(
                    model=model_name,
                    contents=[vision_image, prompt],
                )
                if resp.text and resp.text.strip():
                    return resp.text.strip()
            except Exception:
                continue
    except Exception:
        pass
    return ""


def ocr_image(image: Image.Image) -> str:
    """
    Run OCR on a single PIL Image and return extracted text.
    Uses Google Gemini Vision for accurate transcription of handwritten notes
    and doctor prescriptions, with Tesseract fallback/check.
    """
    # 1. Attempt local Tesseract OCR if available
    tess_text = ""
    try:
        tess_text = pytesseract.image_to_string(image)
        if _is_high_quality_ocr(tess_text):
            return tess_text
    except Exception:
        pass

    # 2. Use Gemini Vision OCR (vital for handwritten prescriptions and clinical cursive)
    gemini_text = _gemini_ocr_image(image)
    if gemini_text and gemini_text.strip():
        return gemini_text

    # If Gemini was unavailable but Tesseract returned something non-empty, use it
    if tess_text and tess_text.strip():
        return tess_text

    raise RuntimeError(
        "OCR extraction failed: Tesseract is not installed locally and Gemini Vision OCR was unable to process the image. "
        "Please check GEMINI_API_KEY in your .env file or install Tesseract OCR."
    )


def ocr_pdf_pages(images: list) -> str:
    """
    Run OCR across multiple page images (from pdf_parser.extract_images_from_pdf)
    and combine into one text blob.
    """
    page_texts = [ocr_image(image) for image in images]
    return "\n---\n".join(page_texts)

