"""
Run this once to create the admin user and seed sample notices/FAQs.
Usage: python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import SessionLocal, engine, Base
import app.models  # register models
from app.models.user import User
from app.models.document import Notice, FAQ
from app.core.security import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Create admin
if not db.query(User).filter(User.email == "admin@university.edu").first():
    admin = User(
        name="Admin",
        email="admin@university.edu",
        password_hash=hash_password("admin123"),
        role="admin"
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    print("[OK] Admin created: admin@university.edu / admin123")
else:
    admin = db.query(User).filter(User.email == "admin@university.edu").first()
    print("[INFO] Admin already exists")

# Create demo student
if not db.query(User).filter(User.email == "student@university.edu").first():
    student = User(
        name="Demo Student",
        email="student@university.edu",
        password_hash=hash_password("student123"),
        role="student",
        enrollment_no="CS2021001",
        department="Computer Science",
        semester=5
    )
    db.add(student)
    db.commit()
    print("[OK] Demo student created: student@university.edu / student123")

# Seed notices
notices = [
    ("Exam Schedule Released", "The end-semester examination schedule for Semester 5 has been released. Please check the examination portal for your timetable.", "exam"),
    ("PBL Submission Deadline", "Project Based Learning (PBL) final submissions are due on the last working day of the month. Submit via the faculty portal.", "academic"),
    ("Library Extended Hours", "The central library will remain open until 10 PM during examination week.", "library"),
    ("Placement Drive - TCS", "TCS will be conducting a campus placement drive next week. Eligible students must register through the placement cell.", "placement"),
]
for title, content, category in notices:
    if not db.query(Notice).filter(Notice.title == title).first():
        db.add(Notice(title=title, content=content, category=category, created_by=admin.id))
db.commit()
print("[OK] Sample notices seeded")

# Seed FAQs
faqs = [
    ("What is the minimum attendance required?", "Students must maintain a minimum of 75% attendance in each subject to be eligible for end-semester examinations. Students with attendance between 65-75% may apply for condonation with valid medical reasons.", "academics"),
    ("How is the internal assessment calculated?", "Internal assessment (IA) consists of: 2 Unit Tests (20 marks each), Assignments (10 marks), and Attendance (10 marks). Total IA = 60 marks.", "academics"),
    ("What is PBL and how is it graded?", "Project Based Learning (PBL) is a hands-on project assigned each semester. It is graded on: Problem Statement (10), Design (20), Implementation (40), Presentation (20), Report (10). Total = 100 marks.", "academics"),
    ("How do I apply for hostel accommodation?", "Hostel applications open at the start of each academic year. Fill the hostel application form available at the student affairs office. Allotment is based on distance from hometown and merit.", "hostel"),
    ("What are the library timings?", "The central library is open Monday to Saturday, 8:00 AM to 8:00 PM. During examination periods, it remains open until 10:00 PM.", "library"),
    ("How do I pay semester fees?", "Semester fees can be paid online through the student portal or via DD/NEFT to the university account. The fee payment deadline is the 15th of the first month of each semester.", "fees"),
]
for question, answer, category in faqs:
    if not db.query(FAQ).filter(FAQ.question == question).first():
        db.add(FAQ(question=question, answer=answer, category=category, created_by=admin.id))
db.commit()
print("[OK] Sample FAQs seeded")

db.close()
print("\nDatabase seeded successfully!")
print("Admin login: admin@university.edu / admin123")
print("Student login: student@university.edu / student123")
