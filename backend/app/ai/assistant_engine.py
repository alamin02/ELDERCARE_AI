import datetime
import re
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models import (
    ElderlyProfile,
    Medication,
    MedicationLog,
    HealthRecord,
    EmergencyContact,
    CaregiverRelationship,
    Conversation
)
from backend.app.schemas import (
    ChatQueryResponse,
    StructuredMedicationItem
)
from backend.app.services.medication_service import (
    get_today_medication_schedule,
    find_next_medication
)
from backend.app.services.emergency_service import trigger_emergency_sos
from backend.app.ai.gemini_client import gemini_client
from backend.app.ai.safety_rules import (
    check_for_emergency_symptoms,
    enforce_medication_safety_guardrails
)


def detect_language(text: str, default: str = "en") -> str:
    """Detects whether user prompt contains Bengali script."""
    # Bengali Unicode range: \u0980-\u09FF
    if re.search(r"[\u0980-\u09FF]", text):
        return "bn"
    return default


def assemble_patient_context(elderly_id: int, db: Session) -> Dict[str, Any]:
    """Retrieves all authorized clinical and adherence context for the patient."""
    profile = db.query(ElderlyProfile).filter(ElderlyProfile.id == elderly_id).first()
    if not profile:
        return {}

    today_schedule = get_today_medication_schedule(elderly_id, db)
    next_med = find_next_medication(today_schedule)

    # Latest Vitals
    bp_rec = db.query(HealthRecord).filter(
        HealthRecord.elderly_id == elderly_id,
        HealthRecord.record_type == "blood_pressure"
    ).order_by(HealthRecord.recorded_at.desc()).first()

    glucose_rec = db.query(HealthRecord).filter(
        HealthRecord.elderly_id == elderly_id,
        HealthRecord.record_type == "blood_glucose"
    ).order_by(HealthRecord.recorded_at.desc()).first()

    weight_rec = db.query(HealthRecord).filter(
        HealthRecord.elderly_id == elderly_id,
        HealthRecord.record_type == "weight"
    ).order_by(HealthRecord.recorded_at.desc()).first()

    # Contacts
    contacts = db.query(EmergencyContact).filter(EmergencyContact.elderly_id == elderly_id).all()

    # Caregivers
    caregiver_links = db.query(CaregiverRelationship).filter(
        CaregiverRelationship.elderly_id == elderly_id,
        CaregiverRelationship.is_active == True
    ).all()

    return {
        "patient_name": profile.user.full_name,
        "date_of_birth": str(profile.date_of_birth),
        "blood_group": profile.blood_group,
        "allergies_conditions": profile.emergency_medical_notes,
        "today_schedule": [
            {
                "name": item.name,
                "dosage": item.dosage,
                "scheduled_time": item.scheduled_time,
                "status": item.status,
                "instructions": item.instructions
            }
            for item in today_schedule
        ],
        "next_medication": {
            "name": next_med.name,
            "dosage": next_med.dosage,
            "scheduled_time": next_med.scheduled_time,
            "instructions": next_med.instructions
        } if next_med else None,
        "latest_bp": f"{int(bp_rec.value_primary)}/{int(bp_rec.value_secondary or 0)} mmHg" if bp_rec else None,
        "latest_glucose": f"{glucose_rec.value_primary} {glucose_rec.unit}" if glucose_rec else None,
        "latest_weight": f"{weight_rec.value_primary} kg" if weight_rec else None,
        "caregivers": [link.caregiver.full_name for link in caregiver_links if link.caregiver],
        "emergency_contacts": [c.name for c in contacts]
    }


def execute_deterministic_fallback(
    message: str,
    context: Dict[str, Any],
    lang: str = "en"
) -> Dict[str, Any]:
    """
    Intelligent, deterministic healthcare reasoning engine.
    Used when Gemini API key is absent or unreachable.
    Executes context retrieval and adheres to all deterministic clinical safety rules.
    """
    lowered = message.lower()
    patient_name = context.get("patient_name", "Friend")
    schedule = context.get("today_schedule", [])
    next_med = context.get("next_medication")
    caregivers = context.get("caregivers", [])

    # Intent 1: Critical Red Flag Medical Symptoms
    if check_for_emergency_symptoms(message):
        if lang == "bn":
            return {
                "intent": "emergency",
                "response": f"সতর্কতা: আপনার উল্লেখিত লক্ষণগুলি বিপজ্জনক হতে পারে। অনুগ্রহ করে এখনই জরুরি চিকিৎসকের সাথে যোগাযোগ করুন অথবা নিকটস্থ হাসপাতালে যান। আমরা আপনার কেয়ারগিভারকে অবগত করার প্রস্তুতি নিচ্ছি।",
                "relevant_medications": [],
                "recommended_action": "অবিলম্বে জরুরি সহায়তা কল করুন (৯৯৯) এবং শান্ত থাকুন।",
                "requires_caregiver": True,
                "safety_warning": "গুরুতর উপসর্গের জন্য তাৎক্ষণিক জরুরি চিকিৎসা সেবা প্রয়োজন।",
                "language": "bn",
                "ai_provider": "deterministic_fallback"
            }
        else:
            return {
                "intent": "emergency",
                "response": f"URGENT: The symptoms you described may require immediate medical attention. Please contact emergency services (e.g. 999 or 911) or your primary physician right away.",
                "relevant_medications": [],
                "recommended_action": "Call emergency services immediately and rest in a safe position.",
                "requires_caregiver": True,
                "safety_warning": "Critical medical symptoms detected. Do not delay emergency assistance.",
                "language": "en",
                "ai_provider": "deterministic_fallback"
            }

    # Intent 2: "I forgot to take my medicine" / "Can I double up?" (Prioritized for medication safety!)
    if any(q in lowered for q in ["forgot", "ভুলে", "skip", "double", "ডাবল", "two pills"]):
        if lang == "bn":
            resp = (
                "ওষুধ খেতে ভুলে গেলে শান্ত থাকুন। সবচেয়ে গুরুত্বপূর্ণ নিয়ম হল: কখনই মিস হওয়া ডোজ পূরণ করতে একসাথে দুইটি বা দ্বিগুণ ওষুধ খাবেন না। "
                "যদি আপনার পরবর্তী ডোজের সময় কাছাকাছি না হয় তবে সাধারণ একটি ডোজ নিতে পারেন, অথবা আপনার চিকিৎসকের সাথে যোগাযোগ করুন।"
            )
            act = "কখনই দ্বিগুণ ডোজ গ্রহণ করবেন না। পরবর্তী নির্ধারিত সময়ে একটি ডোজ গ্রহণ করুন।"
            warn = "মিস হওয়া ওষুধের জন্য কখনই একসাথে দুইটি বা ডাবল ডোজ গ্রহণ করবেন না।"
        else:
            resp = (
                "It is okay, don't worry. The most important clinical safety rule is: NEVER take a double dose or two pills together to make up for a forgotten dose. "
                "If it is close to the time for your next scheduled dose, skip the forgotten dose and resume your normal schedule."
            )
            act = "Do not take a double dose. Resume normal schedule with your next dose."
            warn = "Never take a double dose to make up for a missed dose."
        return {
            "intent": "forgot_dose_advice",
            "response": resp,
            "relevant_medications": [],
            "recommended_action": act,
            "requires_caregiver": False,
            "safety_warning": warn,
            "language": lang,
            "ai_provider": "deterministic_fallback"
        }

    # Intent 1: "Which medicine should I take next?" / "পরবর্তী ওষুধ"
    if any(q in lowered for q in ["next", "পরবর্তী", "what should i take", "after this"]):
        if next_med:
            med_items = [StructuredMedicationItem(
                name=next_med["name"],
                dosage=next_med["dosage"],
                scheduled_time=next_med["scheduled_time"],
                status="pending"
            )]
            if lang == "bn":
                resp = f"আপনার পরবর্তী নির্ধারিত ওষুধ হল {next_med['name']} ({next_med['dosage']}), যা {next_med['scheduled_time']} টায় নেয়ার জন্য নির্ধারিত। নির্দেশাবলী: {next_med.get('instructions') or 'পর্যাপ্ত পানি সহ গ্রহণ করুন'}।"
                act = f"{next_med['scheduled_time']} টায় {next_med['name']} সেবন করুন।"
            else:
                resp = f"Your next scheduled medication is {next_med['name']} ({next_med['dosage']}) at {next_med['scheduled_time']}. Instructions: {next_med.get('instructions') or 'Take with water'}."
                act = f"Take {next_med['name']} at {next_med['scheduled_time']} as prescribed."
            return {
                "intent": "next_medication",
                "response": resp,
                "relevant_medications": med_items,
                "recommended_action": act,
                "requires_caregiver": False,
                "safety_warning": None,
                "language": lang,
                "ai_provider": "deterministic_fallback"
            }
        else:
            if lang == "bn":
                resp = "আজকের দিনের জন্য আপনার আর কোনো অমীমাংসিত নির্ধারিত ওষুধ বাকি নেই। আপনি আজকের সকল ওষুধ সম্পন্ন করেছেন!"
            else:
                resp = "You have no remaining pending medications scheduled for today. All scheduled doses have been completed!"
            return {
                "intent": "next_medication",
                "response": resp,
                "relevant_medications": [],
                "recommended_action": "Rest well and stay hydrated.",
                "requires_caregiver": False,
                "safety_warning": None,
                "language": lang,
                "ai_provider": "deterministic_fallback"
            }

    # Intent 2: "Did I miss my morning medicine?" / "মিস করেছি"
    if any(q in lowered for q in ["miss", "মিস", "morning", "সকাল", "did i take"]):
        missed_items = [it for it in schedule if it.get("status") == "missed"]
        if missed_items:
            rel_meds = [
                StructuredMedicationItem(
                    name=it["name"],
                    dosage=it["dosage"],
                    scheduled_time=it["scheduled_time"],
                    status="missed"
                )
                for it in missed_items
            ]
            names_str = ", ".join([f"{it['name']} ({it['scheduled_time']})" for it in missed_items])
            if lang == "bn":
                resp = f"হ্যাঁ, আপনার রেকর্ড অনুযায়ী আপনি আজকের {names_str} ডোজটি মিস করেছেন।"
                act = "নির্ধারিত সময়ে পরবর্তী ডোজ স্বাভাবিক নিয়মে গ্রহণ করুন। কখনই দ্বিগুণ ডোজ নেবেন না।"
                warn = "মিস হওয়া ওষুধের জন্য একসাথে ডাবল ডোজ গ্রহণ করবেন না।"
            else:
                resp = f"Yes, based on your schedule records, you missed the scheduled dose for: {names_str}."
                act = "Take your next scheduled dose at its normal time. Never take an extra or double dose."
                warn = "Do not take a double dose to make up for a missed medication."
            return {
                "intent": "missed_check",
                "response": resp,
                "relevant_medications": rel_meds,
                "recommended_action": act,
                "requires_caregiver": False,
                "safety_warning": warn,
                "language": lang,
                "ai_provider": "deterministic_fallback"
            }
        else:
            taken_morning = [it for it in schedule if it.get("status") == "taken"]
            if lang == "bn":
                resp = "সুসংবাদ! আপনার সকালের কোনো নির্ধারিত ওষুধ মিস হয়নি। আপনি নির্ধারিত সময়ে ওষুধ গ্রহণ করেছেন।"
            else:
                resp = "Good news! You have not missed your scheduled morning medication. Your records show you are on track."
            return {
                "intent": "missed_check",
                "response": resp,
                "relevant_medications": [
                    StructuredMedicationItem(name=it["name"], dosage=it["dosage"], scheduled_time=it["scheduled_time"], status="taken")
                    for it in taken_morning
                ],
                "recommended_action": "Continue with your regular schedule.",
                "requires_caregiver": False,
                "safety_warning": None,
                "language": lang,
                "ai_provider": "deterministic_fallback"
            }

    # Intent 3: "What medicines are scheduled today?" / "আজকের ওষুধ"
    if any(q in lowered for q in ["today", "আজকের", "schedule", "তালিকা", "what meds", "list"]):
        if not schedule:
            if lang == "bn":
                resp = "আজকের দিনে আপনার কোনো সক্রিয় ওষুধ নির্ধারিত নেই।"
            else:
                resp = "You have no active medications scheduled for today."
            return {
                "intent": "daily_schedule",
                "response": resp,
                "relevant_medications": [],
                "recommended_action": None,
                "requires_caregiver": False,
                "safety_warning": None,
                "language": lang,
                "ai_provider": "deterministic_fallback"
            }

        rel_meds = [
            StructuredMedicationItem(
                name=it["name"],
                dosage=it["dosage"],
                scheduled_time=it["scheduled_time"],
                status=it["status"]
            )
            for it in schedule
        ]

        if lang == "bn":
            lines = [f"• {it['name']} ({it['dosage']}) - {it['scheduled_time']} (অবস্থা: {it['status']})" for it in schedule]
            resp = f"আজকের আপনার ওষুধের সময়সূচী:\n" + "\n".join(lines)
        else:
            lines = [f"• {it['name']} ({it['dosage']}) at {it['scheduled_time']} (Status: {it['status']})" for it in schedule]
            resp = f"Here is your medication schedule for today:\n" + "\n".join(lines)

        return {
            "intent": "daily_schedule",
            "response": resp,
            "relevant_medications": rel_meds,
            "recommended_action": "Follow the scheduled times carefully.",
            "requires_caregiver": False,
            "safety_warning": None,
            "language": lang,
            "ai_provider": "deterministic_fallback"
        }

    # Intent 4: "I forgot to take my medicine" / "ভুলে গেছি"
    if any(q in lowered for q in ["forgot", "ভুলে", "skip", "missed it"]):
        if lang == "bn":
            resp = (
                "ওষুধ খেতে ভুলে গেলে শান্ত থাকুন। সবচেয়ে গুরুত্বপূর্ণ নিয়ম হল: কখনই মিস হওয়া ডোজ পূরণ করতে একসাথে দুইটি বা দ্বিগুণ ওষুধ খাবেন না। "
                "যদি আপনার পরবর্তী ডোজের সময় কাছাকাছি না হয় তবে সাধারণ একটি ডোজ নিতে পারেন, অথবা আপনার চিকিৎসকের সাথে যোগাযোগ করুন।"
            )
            act = "কখনই দ্বিগুণ ডোজ গ্রহণ করবেন না। পরবর্তী নির্ধারিত সময়ে একটি ডোজ গ্রহণ করুন।"
            warn = "মিস হওয়া ওষুধের জন্য অতিরিক্ত বা ডাবল ডোজ খাওয়া সম্পূর্ণ নিষিদ্ধ।"
        else:
            resp = (
                "It is okay, don't worry. The most important clinical safety rule is: NEVER take a double dose or two pills together to make up for a forgotten dose. "
                "If it is close to the time for your next scheduled dose, skip the forgotten dose and resume your normal schedule."
            )
            act = "Do not take a double dose. Resume normal schedule with your next dose."
            warn = "Never take a double dose to make up for a missed dose."
        return {
            "intent": "forgot_dose_advice",
            "response": resp,
            "relevant_medications": [],
            "recommended_action": act,
            "requires_caregiver": False,
            "safety_warning": warn,
            "language": lang,
            "ai_provider": "deterministic_fallback"
        }

    # Intent 5: "Please notify my caregiver" / "কেয়ারগিভারকে জানান"
    if any(q in lowered for q in ["notify", "caregiver", "কেয়ারগিভার", "inform", "জানান", "message daughter"]):
        cg_names = ", ".join(caregivers) if caregivers else "Family Caregiver"
        if lang == "bn":
            resp = f"আপনার অনুরোধ অনুযায়ী আপনার কেয়ারগিভার ({cg_names}) এর ইন-অ্যাপ ড্যাশবোর্ডে নোটিফিকেশন পাঠানো হয়েছে।"
            act = "কেয়ারগিভার আপনার সাথে যোগাযোগ করবে।"
        else:
            resp = f"I have dispatched an in-app update notification to your registered caregiver ({cg_names})."
            act = "Your caregiver has been notified on their dashboard."
        return {
            "intent": "notify_caregiver",
            "response": resp,
            "relevant_medications": [],
            "recommended_action": act,
            "requires_caregiver": True,
            "safety_warning": None,
            "language": lang,
            "ai_provider": "deterministic_fallback"
        }

    # Intent 6: "Show my medication history" / "ইতিহাস"
    if any(q in lowered for q in ["history", "ইতিহাস", "past", "records"]):
        if lang == "bn":
            resp = f"{patient_name}, আপনি মেনুর 'Medications' ট্যাবে অথবা আপনার কেয়ারগিভার ড্যাশবোর্ডে গিয়ে আপনার অতীতের ওষুধের সম্পূর্ণ ইতিহাস ও এডহ্যারেন্স দেখতে পারেন।"
            act = "মেডিকেশন হিস্ট্রি দেখতে Medications ট্যাবে যান।"
        else:
            resp = f"{patient_name}, you can view your full past medication adherence history in the Medication Management tab or on the Caregiver Adherence chart."
            act = "Navigate to Medication Management to view historical logs."
        return {
            "intent": "history_query",
            "response": resp,
            "relevant_medications": [],
            "recommended_action": act,
            "requires_caregiver": False,
            "safety_warning": None,
            "language": lang,
            "ai_provider": "deterministic_fallback"
        }

    # Default friendly assistance
    if lang == "bn":
        resp = f"নমস্কার {patient_name}। আমি আপনার এল্ডারকেয়ার সহকারী। আপনি আমাকে আজকের ওষুধ, পরবর্তী ডোজ, মিস হওয়া ওষুধ বা যেকোনো স্বাস্থ্য তথ্য সম্পর্কে জিজ্ঞাসা করতে পারেন।"
        act = "'আমার পরবর্তী ওষুধ কোনটি?' বা 'আজকের ওষুধের তালিকা' জিজ্ঞাসা করতে পারেন।"
    else:
        resp = f"Hello {patient_name}. I am your ElderCare AI Assistant. You can ask me about your next medication, today's schedule, whether you missed a dose, or asking to notify your caregiver."
        act = "Try asking 'Which medicine should I take next?' or 'What medicines are scheduled today?'"

    return {
        "intent": "general_query",
        "response": resp,
        "relevant_medications": [],
        "recommended_action": act,
        "requires_caregiver": False,
        "safety_warning": None,
        "language": lang,
        "ai_provider": "deterministic_fallback"
    }


async def process_eldercare_chat(
    elderly_id: int,
    user_id: int,
    message: str,
    session_id: str,
    requested_lang: Optional[str],
    db: Session
) -> ChatQueryResponse:
    """
    Core conversational orchestration function:
    1. Gathers patient context (profile, schedules, logs, vitals).
    2. Detects language (English or Bengali).
    3. Handles urgent emergency symptoms deterministically.
    4. Invokes Google Gemini API with structured instructions if available;
       otherwise gracefully falls back to deterministic healthcare rules.
    5. Enforces deterministic medication safety guardrails.
    6. Persists conversation history.
    """
    lang = requested_lang or detect_language(message)
    context = assemble_patient_context(elderly_id, db)

    # Check for life-threatening emergency symptoms immediately
    if check_for_emergency_symptoms(message):
        fallback_data = execute_deterministic_fallback(message, context, lang)
        # Log emergency conversation
        conv_user = Conversation(elderly_id=elderly_id, user_id=user_id, session_id=session_id, role="user", message=message)
        conv_ai = Conversation(elderly_id=elderly_id, user_id=user_id, session_id=session_id, role="assistant", message=fallback_data["response"], structured_data=fallback_data)
        db.add_all([conv_user, conv_ai])
        db.commit()
        return ChatQueryResponse(**fallback_data)

    ai_result = None
    ai_provider = "deterministic_fallback"

    # Attempt Google Gemini API call if key is configured
    if gemini_client.is_available():
        system_instruction = f"""
You are ElderCare AI, an empathetic, accessible healthcare companion for senior citizens.
Language: Respond in { 'Bengali (বাংলা)' if lang == 'bn' else 'English' }.
STRICT HEALTHCARE SAFETY RULES:
1. NEVER suggest taking a double dose for a missed medication.
2. NEVER prescribe, change dosages, or diagnose clinical conditions.
3. Keep responses clear, warm, using simple sentence structures suitable for elderly users.
4. If asked about medications, use ONLY the verified patient context provided.

PATIENT CONTEXT:
Name: {context.get('patient_name')}
Allergies/Conditions: {context.get('allergies_conditions')}
Today's Medication Schedule: {context.get('today_schedule')}
Next Scheduled Medication: {context.get('next_medication')}
Latest Vitals: BP={context.get('latest_bp')}, Glucose={context.get('latest_glucose')}

Return JSON with exact keys:
- "intent": "next_medication" | "missed_check" | "daily_schedule" | "forgot_dose_advice" | "notify_caregiver" | "history_query" | "general_query"
- "response": string
- "relevant_medications": list of {{"name": string, "dosage": string, "scheduled_time": string, "status": string}}
- "recommended_action": string or null
- "requires_caregiver": boolean
- "safety_warning": string or null
- "language": "{lang}"
"""
        try:
            gemini_out = await gemini_client.generate_response(
                prompt=f"User question: {message}",
                system_instruction=system_instruction,
                json_mode=True
            )
            if gemini_out and "response" in gemini_out and "intent" in gemini_out:
                ai_result = gemini_out
                ai_provider = "gemini_2.5_flash"
        except Exception:
            ai_result = None

    if not ai_result:
        ai_result = execute_deterministic_fallback(message, context, lang)
        ai_provider = "deterministic_fallback"

    # Enforce deterministic medication safety guardrails
    guarded = enforce_medication_safety_guardrails(
        assistant_response=ai_result.get("response", ""),
        user_message=message,
        intent=ai_result.get("intent", "general_query"),
        language=lang
    )
    ai_result["response"] = guarded["response"]
    if guarded["safety_warning"]:
        ai_result["safety_warning"] = guarded["safety_warning"]

    ai_result["ai_provider"] = ai_provider
    ai_result["language"] = lang

    # Format relevant medications
    rel_meds = []
    for m in ai_result.get("relevant_medications", []):
        if isinstance(m, dict):
            rel_meds.append(StructuredMedicationItem(
                name=m.get("name", ""),
                dosage=m.get("dosage", ""),
                scheduled_time=m.get("scheduled_time"),
                status=m.get("status")
            ))

    # Save to conversations table
    conv_user = Conversation(
        elderly_id=elderly_id,
        user_id=user_id,
        session_id=session_id,
        role="user",
        message=message
    )
    conv_ai = Conversation(
        elderly_id=elderly_id,
        user_id=user_id,
        session_id=session_id,
        role="assistant",
        message=ai_result["response"],
        structured_data={
            "intent": ai_result.get("intent"),
            "recommended_action": ai_result.get("recommended_action"),
            "safety_warning": ai_result.get("safety_warning"),
            "ai_provider": ai_provider
        }
    )
    db.add_all([conv_user, conv_ai])
    db.commit()

    return ChatQueryResponse(
        intent=ai_result.get("intent", "general_query"),
        response=ai_result.get("response", ""),
        relevant_medications=rel_meds,
        recommended_action=ai_result.get("recommended_action"),
        requires_caregiver=ai_result.get("requires_caregiver", False),
        safety_warning=ai_result.get("safety_warning"),
        language=lang,
        ai_provider=ai_provider
    )
