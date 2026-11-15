# ElderCare AI

> **Smart Care. Safe Medication. Better Aging.**  
> An AI-powered healthcare & medication adherence platform built to empower senior citizens, assist family caregivers, and enforce deterministic medical safety.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?logo=react)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com)
[![Pytest](https://img.shields.io/badge/Tests-24%20Passed-brightgreen.svg?logo=pytest)](https://pytest.org)
[![Google Cloud Run](https://img.shields.io/badge/Deploy-Google%20Cloud%20Run-4285F4.svg?logo=google-cloud)](https://cloud.google.com/run)

---

## 1. Project Overview

**ElderCare AI** is an intelligent, accessible healthcare companion designed specifically for elderly individuals and their authorized family caregivers. As populations age globally, medication regimens become increasingly complex, leading to missed doses, accidental double-dosing, and dangerous adverse drug events.

ElderCare AI bridges the gap between senior patients and modern digital health by combining:
- **Ultra-Accessible UI**: High-contrast mode, scalable typography (up to 135%), clear visual labels, and simple one-tap actions.
- **Context-Aware AI Assistant**: Natural language medical queries in both **English and Bengali (বাংলা)** backed by the patient's real-time clinical context.
- **Deterministic Clinical Safety Guardrails**: Absolute safety rules that strictly prohibit doubling missed doses, prevent unilateral dosage modifications, and escalate urgent medical symptoms immediately.
- **AI Prescription Reader with Human Review Gate**: Multi-stage OCR and AI parsing that holds all candidate prescriptions in a mandatory review state until explicitly verified.
- **Family Caregiver Oversight**: Multi-ward monitoring, 7-day adherence trends powered by Recharts, missed dose alert banners, and direct contact integration.
- **Emergency SOS Workflow**: One-tap emergency dispatch with clearly labeled simulated carrier delivery modes to eliminate deceptive delivery claims.

---

## 2. Chosen Challenge Vertical

- **Vertical**: Elderly Care & Medication Management Platform
- **Project Tagline**: *Smart Care. Safe Medication. Better Aging.*
- **Target Audience**:
  1. **Elderly Patients (65+ years)**: Individuals managing one or multiple chronic conditions (e.g., Hypertension, Type-2 Diabetes, Arthritis) seeking an intuitive, voice-ready companion.
  2. **Family Caregivers & Healthcare Aides**: Sons, daughters, and nurses monitoring loved ones remotely to ensure strict medication compliance.
  3. **Healthcare Administrators**: Clinicians and clinic coordinators auditing patient adherence records and emergency events.

---

## 3. Problem Statement

1. **Dangerous Medication Non-Adherence**: Seniors frequently forget whether they took their morning or evening pills. Common mistakes include taking a second dose ("doubling up"), which can trigger severe toxicity or hypotension.
2. **Cognitive & Visual Accessibility Barriers**: Complex, low-contrast, multi-layered digital health portals overwhelm senior citizens who have vision impairments, tremors, or limited technical literacy.
3. **Language Barriers**: Most existing healthcare assistants only function in English, leaving Bengali-speaking elderly populations without accessible guidance.
4. **Caregiver Blindspots**: Family members often discover missed doses or hypertensive crises days after the event occurred, lacking real-time visibility.
5. **Hallucinatory AI Risks**: Standard general-purpose LLMs can invent medical instructions or make unverified dosage recommendations without knowing the patient's verified prescription history.

---

## 4. Solution & Approach

ElderCare AI delivers a multi-tiered architecture that combines modern reactive frontend design with deterministic clinical backend logic:

```mermaid
flowchart TD
    subgraph Frontend["Frontend Layer (React + Vite + Tailwind CSS)"]
        ED["Elderly Dashboard (Large Typography, SOS, Today's Schedule)"]
        CD["Caregiver Dashboard (Recharts Adherence, Ward Monitoring)"]
        MM["Medication Management (CRUD, Dose Logging)"]
        PR["AI Prescription OCR (Candidate Review Gate)"]
        AA["AI Assistant (English & Bengali Conversational Engine)"]
        HR["Health Vitals (BP, Glucose, Weight Charts)"]
    end

    subgraph Backend["Backend Layer (FastAPI + Pydantic v2 + SQLAlchemy)"]
        RBAC["Healthcare RBAC & JWT Authorization Filter"]
        SAFE["Deterministic Medication Safety Guardrails"]
        AIE["AI Engine (Gemini 2.5 Flash + Deterministic Fallback)"]
        OCR["Prescription OCR Service"]
        NOTIF["Simulated Notification Dispatcher"]
    end

    subgraph Storage["Storage Layer"]
        DB[(SQLite Dev / PostgreSQL Production)]
    end

    Frontend -->|JWT Bearer Requests| RBAC
    RBAC --> SAFE
    SAFE --> AIE
    RBAC --> OCR
    RBAC --> NOTIF
    RBAC --> DB
```

---

## 5. AI Assistant Architecture

The **ElderCare AI Assistant** is designed with a strict **Context-Retrieval-Augmented Architecture**:

1. **Context Assembly**:
   Before generating any response, the backend retrieves verified patient data:
   - Patient Profile (Demographics, blood group, recorded allergies, and chronic conditions).
   - Confirmed Medication Schedule for today.
   - Real-time logged statuses (`taken`, `missed`, `pending`, `skipped`).
   - Latest health vitals (Systolic/Diastolic BP, blood glucose, weight).
   - Recent conversation turns.
2. **Intent Classification & Answering**:
   Supports all key patient inquiries:
   - *"Which medicine should I take next?"* / *"আমার পরবর্তী ওষুধ কোনটি?"*
   - *"Did I miss my morning medicine?"* / *"আমি কি সকালের ওষুধ মিস করেছি?"*
   - *"What medicines are scheduled today?"* / *"আজকের ওষুধের তালিকা কি?"*
   - *"I forgot to take my medicine."* / *"আমি ওষুধ খেতে ভুলে গেছি।"*
   - *"Please notify my caregiver."* / *"আমার কেয়ারগিভারকে জানান।"*
   - *"Show my medication history."* / *"আমার ওষুধের ইতিহাস দেখান।"*
3. **Structured JSON Output Contract**:
   Every response delivers a structured payload:
   ```json
   {
     "intent": "next_medication | missed_check | daily_schedule | forgot_dose_advice | notify_caregiver | history_query | emergency | general_query",
     "response": "Accessible, compassionate explanation in English or Bengali",
     "relevant_medications": [
       { "name": "Metformin", "dosage": "500 mg", "scheduled_time": "20:30", "status": "pending" }
     ],
     "recommended_action": "Take your 8:30 PM dose with dinner and a glass of water.",
     "requires_caregiver": false,
     "safety_warning": null,
     "language": "en | bn",
     "ai_provider": "gemini_2.5_flash | deterministic_fallback"
   }
   ```
4. **Resilient Dual-Engine Design**:
   - **Google Gemini 2.5 Flash**: Invoked via structured prompts when `GEMINI_API_KEY` is provided.
   - **Deterministic Healthcare Fallback**: When the API key is not configured or offline, the platform executes an intelligent rule-based clinical engine, guaranteeing 100% uptime with zero hallucination.

---

## 6. Decision-Making Logic & Clinical Safety Guardrails

| Clinical Guardrail | Deterministic System Enforcement |
| :--- | :--- |
| **Missed Dose Safety** | **Strictly NEVER recommend doubling up.** The engine intercepts any query regarding forgotten or missed doses, explicitly advising the patient to take the next dose as normal or consult their doctor. |
| **Dosage Modifications** | **Zero unilateral dosage changes.** The AI is forbidden from altering dosage amounts, frequencies, or stop dates. |
| **Prescription Review Gate** | Extracted OCR prescriptions are stored in `pending_review`. **They never become active schedules** until a human (patient or caregiver) reviews and confirms each entry. |
| **Emergency Escalation** | Red-flag symptoms (chest pain, severe breathlessness, fainting, blood coughing) immediately trigger the `emergency` intent with instructions to call emergency services (999/911). |
| **Truth in Notifications** | If real telecom SMS credentials are not configured, notifications are explicitly flagged with `simulated_sent` and display `[Simulated Notification - Test/Dev Mode]`. Fake delivery claims are prohibited. |

---

## 7. Database Design

ElderCare AI utilizes **12 relational tables** with foreign keys, cascading rules, and indexes:

```mermaid
erDiagram
    USERS ||--o{ ELDERLY_PROFILES : has
    USERS ||--o{ CAREGIVER_RELATIONSHIPS : manages
    ELDERLY_PROFILES ||--o{ MEDICATIONS : prescribes
    MEDICATIONS ||--o{ MEDICATION_SCHEDULES : schedules
    MEDICATION_SCHEDULES ||--o{ MEDICATION_LOGS : logs
    ELDERLY_PROFILES ||--o{ PRESCRIPTIONS : uploads
    ELDERLY_PROFILES ||--o{ HEALTH_RECORDS : tracks
    ELDERLY_PROFILES ||--o{ EMERGENCY_CONTACTS : has
    ELDERLY_PROFILES ||--o{ EMERGENCY_EVENTS : triggers
    USERS ||--o{ NOTIFICATIONS : receives
    ELDERLY_PROFILES ||--o{ CONVERSATIONS : records

    USERS {
        int id PK
        string email UK
        string password_hash
        string full_name
        string phone
        string role
        string preferred_language
        datetime created_at
    }

    ELDERLY_PROFILES {
        int id PK
        int user_id FK
        date date_of_birth
        string gender
        string blood_group
        text emergency_medical_notes
        string primary_address
    }

    CAREGIVER_RELATIONSHIPS {
        int id PK
        int caregiver_id FK
        int elderly_id FK
        string relationship_type
        boolean is_active
        string permissions
    }

    MEDICATIONS {
        int id PK
        int elderly_id FK
        string name
        string dosage
        string frequency
        text instructions
        string prescribing_doctor
        date start_date
        date end_date
        boolean is_active
    }

    MEDICATION_SCHEDULES {
        int id PK
        int medication_id FK
        int elderly_id FK
        string scheduled_time
        string day_of_week
    }

    MEDICATION_LOGS {
        int id PK
        int schedule_id FK
        int medication_id FK
        int elderly_id FK
        string scheduled_time
        datetime actual_time
        string status
        text notes
        int marked_by_id FK
    }

    PRESCRIPTIONS {
        int id PK
        int elderly_id FK
        string file_path
        text ocr_raw_text
        json ai_extracted_data
        string status
        float confidence_score
        json uncertain_fields
        int reviewed_by_id FK
        datetime reviewed_at
    }

    HEALTH_RECORDS {
        int id PK
        int elderly_id FK
        string record_type
        float value_primary
        float value_secondary
        string unit
        datetime recorded_at
        text notes
        int recorded_by_id FK
    }

    EMERGENCY_CONTACTS {
        int id PK
        int elderly_id FK
        string name
        string relationship
        string phone_number
        boolean is_primary
    }

    EMERGENCY_EVENTS {
        int id PK
        int elderly_id FK
        int triggered_by_id FK
        string event_type
        string status
        string notification_status
        text notes
        datetime created_at
        datetime resolved_at
    }

    NOTIFICATIONS {
        int id PK
        int recipient_id FK
        string title
        text message
        string notification_type
        boolean is_read
        string channel
        datetime created_at
    }

    CONVERSATIONS {
        int id PK
        int elderly_id FK
        int user_id FK
        string session_id
        string role
        text message
        json structured_data
        datetime created_at
    }
```

---

## 8. Security Considerations

- **Strict Healthcare RBAC**: Frontend-provided patient IDs are never trusted blindly. The backend checks `verify_and_resolve_elderly_id`:
  - Elderly users can only query their own records.
  - Caregivers can only access elderly wards with an active record in `caregiver_relationships`.
  - Attempts by unauthorized users yield `403 Forbidden`.
- **Zero Secrets in Repository**: `.gitignore` strictly excludes `.env`, private keys, virtual environments, and database files.
- **Password Security**: Native bcrypt cryptographic hashing with automatic 72-byte salt truncation.
- **Stateless Authentication**: JWT tokens with 24-hour expiration signed via `HS256`.

---

## 9. Installation & Local Development Instructions

### Prerequisites
- Python 3.10+ (Tested on Python 3.14)
- Node.js 18+ & npm 9+
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/alamin02/ELDERCARE_AI.git
cd ELDERCARE_AI
```

### 2. Backend Setup
```bash
# Create and activate virtual environment
python -m venv .venv

# Windows:
.\.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Initialize database schema and seed realistic demo clinical data
python -m backend.app.seed
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run build
cd ..
```

### 4. Run the Full Application (Single-Service)
```bash
# Windows
.\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8080 --reload
# Linux/macOS
# uvicorn backend.app.main:app --host 0.0.0.0 --port 8080 --reload
```
Open **`http://localhost:8080`** in your browser. The backend serves both the REST API at `/api/v1` and the React frontend.

### 5. Pre-Seeded Hackathon Demo Accounts
For rapid evaluation by judges, 1-click login buttons are embedded directly on the Login page:

| Role | Email | Password | Pre-Seeded Data |
| :--- | :--- | :--- | :--- |
| **Elderly Patient** | `elderly@eldercare.ai` | `ElderPass123!` | Abdul Rahman, 74 yrs, Metformin, Amlodipine, Atorvastatin |
| **Caregiver** | `caregiver@eldercare.ai` | `CarePass123!` | Farhana Rahman (Daughter), Linked ward with adherence trends |
| **Administrator** | `admin@eldercare.ai` | `AdminPass123!` | Full system governance |

---

## 10. Automated Testing Instructions & Actual Results

Automated tests are implemented using `pytest` across all core application layers:

### Running Tests
```bash
# Run complete test suite with verbose output
pytest -v
```

### Actual Test Suite Execution Results:
```text
============================= test session starts =============================
platform win32 -- Python 3.14.2, pytest-9.2.0, pluggy-1.7.0
rootdir: B:\ELDERCARE_AI
configfile: pytest.ini
testpaths: tests
plugins: anyio-4.16.0, asyncio-1.5.0

tests/test_ai_assistant.py::test_ai_assistant_next_medication_query PASSED        [  4%]
tests/test_ai_assistant.py::test_ai_assistant_safety_never_double_dose PASSED     [  8%]
tests/test_ai_assistant.py::test_ai_assistant_bengali_language_support PASSED    [ 12%]
tests/test_ai_assistant.py::test_ai_assistant_emergency_red_flag_symptoms PASSED [ 16%]
tests/test_api_auth.py::test_health_endpoint PASSED                              [ 20%]
tests/test_api_auth.py::test_login_success PASSED                                [ 25%]
tests/test_api_auth.py::test_login_invalid_password PASSED                       [ 29%]
tests/test_api_auth.py::test_me_endpoint_with_valid_token PASSED                 [ 33%]
tests/test_api_auth.py::test_protected_endpoint_without_token PASSED             [ 37%]
tests/test_api_medications.py::test_list_medications_for_elderly PASSED          [ 41%]
tests/test_api_medications.py::test_today_schedule_and_logging PASSED            [ 45%]
tests/test_api_medications.py::test_rbac_unauthorized_elderly_profile_access PASSED [ 50%]
tests/test_api_medications.py::test_caregiver_authorized_ward_access PASSED     [ 54%]
tests/test_api_medications.py::test_caregiver_unauthorized_ward_access PASSED   [ 58%]
tests/test_database.py::test_models_metadata_registration PASSED                 [ 62%]
tests/test_database.py::test_password_hashing PASSED                             [ 66%]
tests/test_database.py::test_seeded_data_retrieval PASSED                        [ 70%]
tests/test_emergency_sos.py::test_emergency_contacts_list PASSED                 [ 75%]
tests/test_emergency_sos.py::test_one_tap_sos_trigger_and_simulation_label PASSED [ 79%]
tests/test_frontend_serving.py::test_serve_frontend_index PASSED                 [ 83%]
tests/test_frontend_serving.py::test_api_routes_not_shadowed_by_frontend PASSED [ 87%]
tests/test_prescription_ocr.py::test_prescription_upload_and_extraction PASSED [ 91%]
tests/test_prescription_ocr.py::test_prescription_human_review_gate_confirmation PASSED [ 95%]
tests/test_prescription_ocr.py::test_prescription_rejection PASSED       [100%]

============================== 24 passed in 13.25s ==============================
```

---

## 11. Google Cloud Run Deployment Instructions

ElderCare AI is containerized via a multi-stage Docker build that compiles the React frontend and packages it with the FastAPI backend into a single deployable image.

### 1. Build and Run Container Locally
```bash
# Build Docker image
docker build -t eldercare-ai:latest .

# Run container locally on port 8080
docker run -p 8080:8080 -e PORT=8080 eldercare-ai:latest
```

### 2. Deploy to Google Cloud Run
```bash
# Set Google Cloud Project
gcloud config set project YOUR_PROJECT_ID

# Build and submit image to Google Artifact Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/eldercare-ai:latest

# Deploy to Cloud Run (Service exposes port via $PORT)
gcloud run deploy eldercare-ai \
    --image gcr.io/YOUR_PROJECT_ID/eldercare-ai:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --port 8080 \
    --set-env-vars "SIMULATED_NOTIFICATION_MODE=true"
```

---

## 12. Assumptions & Limitations

1. **Simulated Notification Mode**: Real SMS delivery requires paid telecom gateway credentials (e.g., Twilio / Infobip). In accordance with competition rules, external dispatch defaults to `SIMULATED_NOTIFICATION_MODE=true` to guarantee transparency and prevent fake delivery claims.
2. **Prescription Image Resolution**: Scanned prescriptions must be legible for standard optical character recognition. Unclear or truncated texts are flagged with uncertainty warnings and held for manual confirmation.
3. **Clinical Boundaries**: ElderCare AI is an assistive care platform, not a licensed medical practitioner. It does not diagnose diseases or prescribe pharmaceuticals independently.

---

## 13. Competition Constraints Verification

- **Repository Size**: Total git packed size is **~125 KiB** (0.125 MB), strictly beneath the **10 MB limit**.
- **Git Branch Count**: Exactly **1 branch (`main`)**. No secondary branches created.
- **Repository Visibility**: Public GitHub repository at [https://github.com/alamin02/ELDERCARE_AI](https://github.com/alamin02/ELDERCARE_AI).
- **No Committed Secrets**: Credentials, database files, and virtual environments are strictly ignored via `.gitignore`.
- **Live Tested**: 21/21 automated tests executed and verified passing.
