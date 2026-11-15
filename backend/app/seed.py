import datetime
from backend.app.database import engine, SessionLocal, Base
from backend.app.models import (
    User,
    ElderlyProfile,
    CaregiverRelationship,
    Medication,
    MedicationSchedule,
    MedicationLog,
    HealthRecord,
    EmergencyContact,
    Notification
)
from backend.app.security import get_password_hash


def init_and_seed_db():
    """Initializes tables and seeds standard demo accounts and clinical data."""
    print("Creating all database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if already seeded
        existing_elderly = db.query(User).filter(User.email == "elderly@eldercare.ai").first()
        if existing_elderly:
            print("Database already seeded with demo data. Skipping.")
            return

        print("Seeding demo users...")
        # 1. Elderly Patient
        elderly_user = User(
            email="elderly@eldercare.ai",
            password_hash=get_password_hash("ElderPass123!"),
            full_name="Abdul Rahman",
            phone="+880 1711-000111",
            role="elderly",
            preferred_language="en"
        )
        db.add(elderly_user)
        db.flush()

        # Elderly Profile
        elderly_profile = ElderlyProfile(
            user_id=elderly_user.id,
            date_of_birth=datetime.date(1952, 4, 12),
            gender="Male",
            blood_group="O+",
            emergency_medical_notes="Type-2 Diabetes Mellitus, Hypertension, Mild Osteoarthritis. Penicillin allergy.",
            primary_address="House 42, Road 7, Dhanmondi, Dhaka"
        )
        db.add(elderly_profile)
        db.flush()

        # 2. Caregiver
        caregiver_user = User(
            email="caregiver@eldercare.ai",
            password_hash=get_password_hash("CarePass123!"),
            full_name="Farhana Rahman",
            phone="+880 1819-222333",
            role="caregiver",
            preferred_language="en"
        )
        db.add(caregiver_user)
        db.flush()

        # Link Caregiver to Elderly
        relationship = CaregiverRelationship(
            caregiver_id=caregiver_user.id,
            elderly_id=elderly_profile.id,
            relationship_type="Daughter",
            is_active=True,
            permissions="view,edit_meds,emergency_alerts"
        )
        db.add(relationship)

        # 3. Admin
        admin_user = User(
            email="admin@eldercare.ai",
            password_hash=get_password_hash("AdminPass123!"),
            full_name="System Administrator",
            phone="+880 1900-000000",
            role="admin",
            preferred_language="en"
        )
        db.add(admin_user)
        db.flush()

        # 4. Medications & Schedules
        today = datetime.date.today()

        # Med 1: Metformin
        med1 = Medication(
            elderly_id=elderly_profile.id,
            name="Metformin",
            dosage="500 mg",
            frequency="Twice daily",
            instructions="Take immediately after meals with plenty of water.",
            prescribing_doctor="Dr. Tariqul Islam",
            start_date=today - datetime.timedelta(days=90),
            is_active=True
        )
        db.add(med1)
        db.flush()

        sched1_morning = MedicationSchedule(
            medication_id=med1.id,
            elderly_id=elderly_profile.id,
            scheduled_time="08:30",
            day_of_week="daily"
        )
        sched1_evening = MedicationSchedule(
            medication_id=med1.id,
            elderly_id=elderly_profile.id,
            scheduled_time="20:30",
            day_of_week="daily"
        )
        db.add_all([sched1_morning, sched1_evening])
        db.flush()

        # Med 2: Amlodipine
        med2 = Medication(
            elderly_id=elderly_profile.id,
            name="Amlodipine",
            dosage="5 mg",
            frequency="Once daily",
            instructions="Take in the morning for blood pressure maintenance.",
            prescribing_doctor="Dr. Tariqul Islam",
            start_date=today - datetime.timedelta(days=60),
            is_active=True
        )
        db.add(med2)
        db.flush()

        sched2 = MedicationSchedule(
            medication_id=med2.id,
            elderly_id=elderly_profile.id,
            scheduled_time="09:00",
            day_of_week="daily"
        )
        db.add(sched2)
        db.flush()

        # Med 3: Atorvastatin
        med3 = Medication(
            elderly_id=elderly_profile.id,
            name="Atorvastatin",
            dosage="10 mg",
            frequency="Once daily",
            instructions="Take at bedtime for cholesterol control.",
            prescribing_doctor="Dr. Tariqul Islam",
            start_date=today - datetime.timedelta(days=45),
            is_active=True
        )
        db.add(med3)
        db.flush()

        sched3 = MedicationSchedule(
            medication_id=med3.id,
            elderly_id=elderly_profile.id,
            scheduled_time="22:00",
            day_of_week="daily"
        )
        db.add(sched3)
        db.flush()

        # 5. Medication Logs for Today
        now = datetime.datetime.utcnow()
        log1 = MedicationLog(
            schedule_id=sched1_morning.id,
            medication_id=med1.id,
            elderly_id=elderly_profile.id,
            scheduled_time="08:30",
            actual_time=now.replace(hour=8, minute=35),
            status="taken",
            notes="Taken on time after breakfast",
            marked_by_id=elderly_user.id
        )
        log2 = MedicationLog(
            schedule_id=sched2.id,
            medication_id=med2.id,
            elderly_id=elderly_profile.id,
            scheduled_time="09:00",
            actual_time=now.replace(hour=9, minute=5),
            status="taken",
            notes="Taken with morning water",
            marked_by_id=elderly_user.id
        )
        db.add_all([log1, log2])

        # 6. Emergency Contacts
        contact1 = EmergencyContact(
            elderly_id=elderly_profile.id,
            name="Farhana Rahman",
            relationship_type="Daughter",
            phone_number="+880 1819-222333",
            is_primary=True
        )
        contact2 = EmergencyContact(
            elderly_id=elderly_profile.id,
            name="Dr. Tariqul Islam",
            relationship_type="Physician / Cardiologist",
            phone_number="+880 1712-998877",
            is_primary=False
        )
        contact3 = EmergencyContact(
            elderly_id=elderly_profile.id,
            name="National Emergency Service",
            relationship_type="Ambulance & Emergency",
            phone_number="999",
            is_primary=False
        )
        db.add_all([contact1, contact2, contact3])

        # 7. Health Records (BP, Glucose, Weight)
        health_data = [
            HealthRecord(
                elderly_id=elderly_profile.id,
                record_type="blood_pressure",
                value_primary=126.0,
                value_secondary=82.0,
                unit="mmHg",
                recorded_at=now - datetime.timedelta(days=3),
                notes="Morning resting BP",
                recorded_by_id=elderly_user.id
            ),
            HealthRecord(
                elderly_id=elderly_profile.id,
                record_type="blood_pressure",
                value_primary=128.0,
                value_secondary=84.0,
                unit="mmHg",
                recorded_at=now - datetime.timedelta(days=2),
                notes="Normal evening check",
                recorded_by_id=caregiver_user.id
            ),
            HealthRecord(
                elderly_id=elderly_profile.id,
                record_type="blood_pressure",
                value_primary=122.0,
                value_secondary=80.0,
                unit="mmHg",
                recorded_at=now - datetime.timedelta(days=1),
                notes="Excellent reading after walk",
                recorded_by_id=elderly_user.id
            ),
            HealthRecord(
                elderly_id=elderly_profile.id,
                record_type="blood_glucose",
                value_primary=108.0,
                unit="mg/dL",
                recorded_at=now - datetime.timedelta(days=2),
                notes="Fasting blood sugar",
                recorded_by_id=elderly_user.id
            ),
            HealthRecord(
                elderly_id=elderly_profile.id,
                record_type="blood_glucose",
                value_primary=142.0,
                unit="mg/dL",
                recorded_at=now - datetime.timedelta(days=1),
                notes="2 hours post-lunch",
                recorded_by_id=elderly_user.id
            ),
            HealthRecord(
                elderly_id=elderly_profile.id,
                record_type="weight",
                value_primary=68.4,
                unit="kg",
                recorded_at=now - datetime.timedelta(days=7),
                notes="Weekly weight log",
                recorded_by_id=elderly_user.id
            ),
            HealthRecord(
                elderly_id=elderly_profile.id,
                record_type="weight",
                value_primary=68.1,
                unit="kg",
                recorded_at=now - datetime.timedelta(days=1),
                notes="Weekly weight log",
                recorded_by_id=elderly_user.id
            )
        ]
        db.add_all(health_data)

        # 8. Initial Notifications
        notif1 = Notification(
            recipient_id=elderly_user.id,
            title="Medication Reminder",
            message="Your evening Metformin (500 mg) is scheduled for 8:30 PM.",
            notification_type="medication_reminder",
            is_read=False,
            channel="in_app"
        )
        notif2 = Notification(
            recipient_id=caregiver_user.id,
            title="Caregiver Update",
            message="Abdul Rahman has completed 2/2 scheduled morning doses today.",
            notification_type="medication_reminder",
            is_read=False,
            channel="in_app"
        )
        db.add_all([notif1, notif2])

        db.commit()
        print("Database initialized and demo data successfully seeded!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    init_and_seed_db()
