import re
from typing import Dict, Any, List, Tuple
from backend.app.ai.gemini_client import gemini_client
from backend.app.schemas import PrescriptionExtractedMed


def parse_prescription_text_deterministic(raw_text: str) -> Tuple[List[PrescriptionExtractedMed], float, List[str]]:
    """
    Deterministic clinical prescription parser.
    Extracts medicine names, dosages, and administration frequencies.
    Marks any incomplete or ambiguous fields as uncertain.
    """
    lines = raw_text.split("\n")
    medications: List[PrescriptionExtractedMed] = []
    uncertain_fields: List[str] = []

    # Common prescription patterns
    # e.g., "1. Tab. Metformin 500 mg - 1+0+1 (Twice daily after meals)"
    pattern = re.compile(
        r"(?:(?:Tab|Cap|Syp|Inj)\.?\s+)?([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(\d+\s*(?:mg|ml|mcg|g))?\s*[-–:]?\s*(.+)?",
        re.IGNORECASE
    )

    for line in lines:
        cleaned = line.strip()
        if not cleaned or cleaned.startswith(("PRESCRIPTION", "Hospital", "Doctor", "Date", "Patient", "Advice", "Rx:")):
            continue

        # Strip bullet points or leading numbers
        cleaned_line = re.sub(r"^\d+[\.\)]\s*", "", cleaned)

        match = pattern.match(cleaned_line)
        if match:
            name = match.group(1).strip()
            dosage = match.group(2).strip() if match.group(2) else ""
            rest = match.group(3).strip() if match.group(3) else ""

            is_uncertain = False
            uncertainty_reason = None

            if not dosage:
                is_uncertain = True
                uncertainty_reason = "Dosage not clearly specified in prescription text."
                uncertain_fields.append(f"{name}: missing dosage")
                dosage = "Unspecified Dosage"

            # Parse frequency and times
            frequency = "Once daily"
            suggested_times = ["09:00"]
            instructions = rest

            if "1+0+1" in rest or "twice" in rest.lower() or "bid" in rest.lower():
                frequency = "Twice daily"
                suggested_times = ["08:30", "20:30"]
            elif "1+1+1" in rest or "thrice" in rest.lower() or "tid" in rest.lower():
                frequency = "Three times daily"
                suggested_times = ["08:00", "14:00", "20:00"]
            elif "0+0+1" in rest or "bedtime" in rest.lower() or "night" in rest.lower():
                frequency = "Once daily (Bedtime)"
                suggested_times = ["22:00"]
            elif "1+0+0" in rest or "morning" in rest.lower():
                frequency = "Once daily (Morning)"
                suggested_times = ["09:00"]
            else:
                if not rest:
                    is_uncertain = True
                    uncertain_fields.append(f"{name}: missing frequency")
                    uncertainty_reason = "Administration frequency unclear. Please verify with doctor."

            medications.append(PrescriptionExtractedMed(
                name=name,
                dosage=dosage,
                frequency=frequency,
                instructions=instructions or "Take as directed by doctor",
                suggested_times=suggested_times,
                confidence=0.75 if is_uncertain else 0.95,
                is_uncertain=is_uncertain,
                uncertainty_reason=uncertainty_reason
            ))

    overall_confidence = 0.92 if not uncertain_fields else 0.78
    if not medications:
        overall_confidence = 0.40

    return medications, overall_confidence, uncertain_fields


async def extract_prescription_data(raw_text: str) -> Tuple[List[PrescriptionExtractedMed], float, List[str]]:
    """
    Analyzes raw OCR prescription text with Gemini or deterministic parser.
    Returns structured list of candidate medications, confidence score, and uncertain fields.
    """
    if gemini_client.is_available():
        prompt = f"""
Analyze this prescription text and extract all prescribed medicines.
Prescription text:
{raw_text}

Return JSON with exact keys:
- "medications": list of {{"name": str, "dosage": str, "frequency": str, "instructions": str, "suggested_times": list of str, "confidence": float, "is_uncertain": bool, "uncertainty_reason": str or null}}
- "overall_confidence": float (0.0 to 1.0)
- "uncertain_fields": list of str (fields that are ambiguous or require human confirmation)
"""
        try:
            res = await gemini_client.generate_response(prompt=prompt, json_mode=True)
            if res and "medications" in res:
                med_list = [PrescriptionExtractedMed(**m) for m in res.get("medications", [])]
                return med_list, float(res.get("overall_confidence", 0.9)), res.get("uncertain_fields", [])
        except Exception:
            pass

    return parse_prescription_text_deterministic(raw_text)
