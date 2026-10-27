"""
Calls the Google Gemini API to turn normalized structured data into a
plain-language patient summary.
"""

import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

from summarization.prompts import SYSTEM_PROMPT, build_summary_prompt

load_dotenv()

# Candidate models in priority order: flash-lite for high speed/throughput,
# followed by flash models as fallback if temporary capacity spikes occur.
CANDIDATE_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.8-flash",
]


def summarize_report(normalized_data, doc_type: str) -> str:
    """
    Build the prompt for `normalized_data`/`doc_type` and call Google Gemini to
    generate a plain-language summary. Returns the summary text, or a
    human-readable "Error: ..." string if the call fails for any reason
    (missing API key, network/auth failure, empty response).
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return "Error: GEMINI_API_KEY is not set. Add it to your .env file to enable summarization."

    try:
        prompt = build_summary_prompt(normalized_data, doc_type)
    except Exception as e:
        return f"Error: Failed to build summary prompt ({e})"

    try:
        client = genai.Client(api_key=api_key)
    except Exception as e:
        return f"Error: Failed to initialize Gemini client ({e})."

    last_error = None
    for model_name in CANDIDATE_MODELS:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    temperature=0.3,
                    max_output_tokens=1500,
                ),
            )
            content = response.text
            if content and content.strip():
                return content.strip()
        except Exception as e:
            last_error = e
            continue

    return f"Error: Could not reach the Gemini summarization service ({last_error})."
