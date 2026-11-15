"""
Deterministic Medication Safety & Clinical Guardrails for ElderCare AI.
Mandatory healthcare rules that govern all AI responses.
"""
from typing import Dict, Any, List, Optional


CRITICAL_RED_FLAG_SYMPTOMS = [
    "chest pain", "shortness of breath", "severe breathlessness", "fainting",
    "loss of consciousness", "sudden numbness", "slurred speech", "coughing blood",
    "বুকের ব্যথা", "শ্বাসকষ্ট", "অজ্ঞান", "মুখ বেঁকে যাওয়া", "রক্ত বমি"
]

FORBIDDEN_DOUBLE_DOSE_PHRASES = [
    "take two", "take double", "take both doses", "double up", "take an extra pill",
    "দুইটা খান", "ডাবল ডোজ", "একসাথে দুইটি"
]

DOUBLE_DOSE_QUERY_KEYWORDS = [
    "double dose", "double", "two pills", "take 2", "extra dose", "ডাবল", "দ্বিগুণ", "দুইটি"
]


def check_for_emergency_symptoms(message: str) -> bool:
    """Checks if the user's message contains life-threatening red-flag medical symptoms."""
    lower_msg = message.lower()
    return any(symptom in lower_msg for symptom in CRITICAL_RED_FLAG_SYMPTOMS)


def enforce_medication_safety_guardrails(
    assistant_response: str,
    user_message: str = "",
    intent: str = "general_query",
    language: str = "en"
) -> Dict[str, Any]:
    """
    Validates the generated AI response against deterministic healthcare guardrails.
    If the response accidentally suggests doubling up or if the user asked about doubling up,
    it guarantees clear, unambiguous clinical safety guidance.
    """
    lower_resp = assistant_response.lower()
    lower_msg = user_message.lower() if user_message else ""
    safety_warning: Optional[str] = None
    sanitized_response = assistant_response

    # Guardrail 1: Strictly prohibit suggesting double doses
    if any(phrase in lower_resp for phrase in FORBIDDEN_DOUBLE_DOSE_PHRASES) or any(k in lower_msg for k in DOUBLE_DOSE_QUERY_KEYWORDS):
        if language == "bn":
            warning_text = "মিস হওয়া ওষুধের জন্য কখনই একসাথে দুইটি বা ডাবল ডোজ গ্রহণ করবেন না।"
            if any(phrase in lower_resp for phrase in FORBIDDEN_DOUBLE_DOSE_PHRASES):
                sanitized_response = (
                    "সতর্কতা: মিস হওয়া ওষুধের জন্য কখনই একসাথে দুইটি বা দ্বিগুণ ডোজ গ্রহণ করবেন না। "
                    "আপনার পরবর্তী নির্ধারিত সময়ে শুধুমাত্র একটি স্বাভাবিক ডোজ গ্রহণ করুন।"
                )
            safety_warning = warning_text
        else:
            warning_text = "Never take a double dose to make up for a missed dose."
            if any(phrase in lower_resp for phrase in FORBIDDEN_DOUBLE_DOSE_PHRASES):
                sanitized_response = (
                    "Safety Alert: Never take a double dose to make up for a missed medication. "
                    "Please wait for your next regularly scheduled dose as normal."
                )
            safety_warning = warning_text

    # Guardrail 2: Enforce clinical disclaimer when diagnoses are mentioned
    disclaimer_en = "Reminder: I am an AI care assistant, not a doctor. Never alter your prescribed dosage without consulting your healthcare provider."
    disclaimer_bn = "স্মরণ রাখবেন: আমি একটি এআই কেয়ার সহকারী, ডাক্তার নই। ডাক্তারের পরামর্শ ছাড়া ওষুধের মাত্রা পরিবর্তন করবেন না।"

    if "diagnos" in lower_resp or "disease" in lower_resp or "রোগ নির্ণয়" in lower_resp:
        if language == "bn":
            safety_warning = disclaimer_bn
        else:
            safety_warning = disclaimer_en

    return {
        "response": sanitized_response,
        "safety_warning": safety_warning
    }
