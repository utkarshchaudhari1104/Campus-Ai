"""
Generates sample university PDF documents for demo purposes.
Run: python create_sample_docs.py
Requires: pip install reportlab
"""
import os

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.units import inch
    from reportlab.lib import colors
except ImportError:
    print("Installing reportlab...")
    os.system("pip install reportlab")
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.units import inch

OUTPUT_DIR = "./data/uploads"
os.makedirs(OUTPUT_DIR, exist_ok=True)
styles = getSampleStyleSheet()
h1 = styles["Heading1"]
h2 = styles["Heading2"]
body = styles["BodyText"]
body.spaceAfter = 8


def make_pdf(filename, title, sections):
    path = os.path.join(OUTPUT_DIR, filename)
    doc = SimpleDocTemplate(path, pagesize=A4, topMargin=0.8*inch, bottomMargin=0.8*inch)
    story = [Paragraph(title, h1), Spacer(1, 0.2*inch)]
    for heading, paragraphs in sections:
        story.append(Paragraph(heading, h2))
        for p in paragraphs:
            story.append(Paragraph(p, body))
        story.append(Spacer(1, 0.1*inch))
    doc.build(story)
    print(f"✅ Created: {path}")


# 1. Academic Regulations
make_pdf("Academic_Regulations.pdf", "Academic Regulations 2024-25", [
    ("1. Attendance Policy", [
        "Students must maintain a minimum of 75% attendance in each subject to be eligible for end-semester examinations.",
        "Students with attendance between 65% and 75% may apply for condonation by submitting a medical certificate or other valid proof to the Dean of Academics within 7 days.",
        "Students with attendance below 65% will be detained and will not be permitted to appear in the end-semester examination.",
        "Attendance is calculated from the first day of the semester to the last working day before examinations.",
        "Medical leave must be supported by a registered medical practitioner's certificate submitted within 3 days of rejoining.",
    ]),
    ("2. Internal Assessment (IA)", [
        "Internal Assessment carries 40 marks for each subject.",
        "IA consists of: Unit Test 1 (15 marks), Unit Test 2 (15 marks), Assignments and Quizzes (10 marks).",
        "Unit Tests are conducted in the 8th and 14th week of the semester.",
        "Students who miss a Unit Test due to medical reasons may apply for a re-test within 5 days.",
        "Assignment submission is mandatory. Non-submission results in zero marks for that component.",
    ]),
    ("3. End Semester Examination", [
        "End Semester Examination (ESE) carries 60 marks for each theory subject.",
        "The duration of ESE is 3 hours for theory subjects and 2 hours for practical subjects.",
        "Students must carry their hall ticket and university ID card to the examination hall.",
        "Use of mobile phones or electronic devices is strictly prohibited in the examination hall.",
        "Results are declared within 30 days of the last examination.",
    ]),
    ("4. Project Based Learning (PBL)", [
        "PBL is a mandatory component for all undergraduate students from Semester 3 onwards.",
        "Each group consists of 3-5 students. Groups are formed in the first week of the semester.",
        "PBL grading: Problem Statement and Literature Review (10 marks), Design and Methodology (20 marks), Implementation (40 marks), Final Presentation (20 marks), Report (10 marks). Total = 100 marks.",
        "PBL topics must be approved by the faculty guide before the end of Week 2.",
        "Mid-semester PBL review is conducted in Week 10. Final submission is in Week 16.",
        "Plagiarism in PBL reports will result in zero marks and disciplinary action.",
    ]),
    ("5. Grading System", [
        "The university follows a 10-point grading scale.",
        "O (Outstanding): 91-100 marks = 10 grade points",
        "A+ (Excellent): 81-90 marks = 9 grade points",
        "A (Very Good): 71-80 marks = 8 grade points",
        "B+ (Good): 61-70 marks = 7 grade points",
        "B (Above Average): 51-60 marks = 6 grade points",
        "C (Average): 40-50 marks = 5 grade points",
        "F (Fail): Below 40 marks = 0 grade points",
        "CGPA is calculated as the weighted average of grade points across all semesters.",
    ]),
    ("6. Promotion Rules", [
        "A student must pass all subjects of a semester to be promoted to the next semester.",
        "A student with up to 2 backlogs may be allowed to continue to the next semester on a provisional basis.",
        "Students with more than 2 backlogs must repeat the semester.",
        "Maximum duration to complete the degree is 6 years for a 4-year program.",
    ]),
])

# 2. Fee Structure
make_pdf("Fee_Structure.pdf", "Fee Structure 2024-25", [
    ("Tuition Fees", [
        "Semester 1 and 2 (First Year): Rs. 85,000 per semester",
        "Semester 3 and 4 (Second Year): Rs. 90,000 per semester",
        "Semester 5 and 6 (Third Year): Rs. 95,000 per semester",
        "Semester 7 and 8 (Final Year): Rs. 95,000 per semester",
        "Fees must be paid before the 15th of the first month of each semester.",
        "Late payment attracts a fine of Rs. 500 per week after the due date.",
        "Fees can be paid online via the student portal, NEFT/RTGS, or Demand Draft in favor of 'University Finance Department'.",
    ]),
    ("Other Fees", [
        "Examination Fee: Rs. 1,500 per semester (included in tuition)",
        "Library Fee: Rs. 500 per semester",
        "Laboratory Fee: Rs. 2,000 per semester (for engineering branches)",
        "Sports and Cultural Fee: Rs. 1,000 per year",
        "Student Activity Fee: Rs. 500 per year",
        "Alumni Association Fee: Rs. 500 (one-time, final year)",
    ]),
    ("Hostel Fees", [
        "Single Occupancy Room: Rs. 45,000 per semester",
        "Double Occupancy Room: Rs. 30,000 per semester",
        "Triple Occupancy Room: Rs. 22,000 per semester",
        "Hostel fees include electricity (up to 100 units/month), water, and Wi-Fi.",
        "Mess charges are separate: Rs. 3,500 per month for vegetarian, Rs. 4,000 per month for non-vegetarian.",
        "Hostel security deposit: Rs. 10,000 (refundable at the time of leaving).",
    ]),
    ("Scholarships and Fee Waivers", [
        "Merit Scholarship: Students with CGPA above 9.0 receive 25% tuition fee waiver.",
        "Government Scholarships: SC/ST/OBC students may apply for state and central government scholarships.",
        "Sports Quota: Students representing the university at national level receive 50% fee waiver.",
        "EWS Category: Students from Economically Weaker Sections may apply for fee concession with income certificate.",
        "Scholarship applications must be submitted within the first month of each academic year.",
    ]),
    ("Refund Policy", [
        "Withdrawal before commencement of classes: 100% refund (minus Rs. 1,000 processing fee)",
        "Withdrawal within 15 days of commencement: 80% refund",
        "Withdrawal within 30 days of commencement: 50% refund",
        "Withdrawal after 30 days: No refund",
        "Refund requests must be submitted in writing to the Finance Department.",
    ]),
])

# 3. Hostel Rules
make_pdf("Hostel_Rules.pdf", "Hostel Rules and Regulations", [
    ("Admission to Hostel", [
        "Hostel accommodation is available for outstation students on a first-come, first-served basis.",
        "Students must fill the hostel application form and submit it to the Hostel Office with required documents.",
        "Required documents: Admission letter, ID proof, address proof, medical fitness certificate, 4 passport photos.",
        "Allotment is confirmed only after payment of the hostel security deposit.",
        "Students from within 30 km of the university are not eligible for hostel accommodation.",
    ]),
    ("Timings and Entry/Exit", [
        "Hostel gates close at 10:00 PM on weekdays and 11:00 PM on weekends.",
        "Students must sign the entry/exit register every time they leave or enter the hostel.",
        "Late entry beyond closing time requires prior written permission from the Hostel Warden.",
        "Overnight absence requires written permission from parents/guardians and the Hostel Warden.",
        "Students going home on weekends must inform the warden and sign the leave register.",
    ]),
    ("Mess and Dining", [
        "Mess timings: Breakfast 7:00-9:00 AM, Lunch 12:00-2:00 PM, Dinner 7:00-9:00 PM.",
        "Students must carry their mess card for all meals.",
        "Outside food delivery is allowed only at the hostel gate, not inside rooms.",
        "Cooking in rooms is strictly prohibited.",
        "Mess menu is prepared by the Mess Committee with student representatives.",
    ]),
    ("Discipline and Conduct", [
        "Ragging in any form is strictly prohibited and is a punishable offense under law.",
        "Consumption of alcohol, tobacco, or any intoxicants is strictly prohibited.",
        "Visitors of the opposite gender are not allowed inside the hostel rooms.",
        "Visitors are allowed only in the common visiting area between 4:00 PM and 7:00 PM.",
        "Students must maintain cleanliness in their rooms and common areas.",
        "Loud music or noise after 11:00 PM is not permitted.",
        "Damage to hostel property will be charged to the student.",
    ]),
    ("Facilities", [
        "Each room is provided with a bed, study table, chair, wardrobe, and bookshelf.",
        "Wi-Fi is available throughout the hostel (speed: 50 Mbps shared).",
        "Laundry facility is available on each floor (coin-operated machines).",
        "Common room with TV, indoor games, and newspapers is available on the ground floor.",
        "24-hour security with CCTV surveillance.",
        "Generator backup for power cuts.",
        "First aid room with a nurse available from 8 AM to 8 PM.",
    ]),
])

# 4. Library Rules
make_pdf("Library_Rules.pdf", "Central Library - Rules and Services", [
    ("Library Timings", [
        "Regular Days (Monday to Saturday): 8:00 AM to 8:00 PM",
        "Examination Period: 8:00 AM to 10:00 PM (extended hours)",
        "Sundays and Public Holidays: 10:00 AM to 4:00 PM",
        "The library remains closed on national holidays and during semester breaks.",
    ]),
    ("Membership and Borrowing", [
        "All enrolled students are automatically members of the central library.",
        "Students can borrow up to 3 books at a time.",
        "Loan period: 14 days for regular books, 7 days for reference books.",
        "Books can be renewed once online through the library portal if not reserved by another student.",
        "Reference books, journals, and newspapers cannot be taken out of the library.",
        "E-resources and digital library access is available 24/7 through the student portal.",
    ]),
    ("Fines and Penalties", [
        "Overdue fine: Rs. 2 per day per book after the due date.",
        "Loss of library card: Rs. 100 for replacement.",
        "Loss of borrowed book: Student must pay the current market price of the book plus Rs. 200 processing fee.",
        "Damage to books: Fine as assessed by the librarian.",
        "Students with outstanding dues will not be issued No Objection Certificate (NOC).",
    ]),
    ("Rules of Conduct", [
        "Maintain silence in the library at all times.",
        "Mobile phones must be kept on silent mode. Phone calls are not allowed inside the library.",
        "Food and beverages are not allowed inside the library.",
        "Personal belongings must be deposited at the property counter before entering.",
        "Students must carry their library card and university ID for entry.",
        "Marking, underlining, or defacing library books is a punishable offense.",
    ]),
    ("Digital Resources", [
        "The library subscribes to NPTEL, IEEE Xplore, Springer, and JSTOR databases.",
        "Students can access e-books and research papers through the library portal using their student credentials.",
        "Printing and scanning facility is available at Rs. 2 per page.",
        "The library has 50 computer terminals with internet access.",
    ]),
])

# 5. Placement Guide
make_pdf("Placement_Guide.pdf", "Training and Placement Cell - Student Guide", [
    ("About the Placement Cell", [
        "The Training and Placement Cell (TPC) facilitates campus recruitment for final year students.",
        "The TPC is located in the Administrative Block, Room 105.",
        "Contact: placement@university.edu | Phone: +91-XXXX-XXXXXX",
        "Office hours: Monday to Friday, 9:00 AM to 5:00 PM",
    ]),
    ("Eligibility Criteria", [
        "Students must have a minimum CGPA of 6.0 to participate in campus placements.",
        "No active backlogs at the time of placement registration.",
        "Students must register with the TPC at the beginning of their final year.",
        "Students who have already accepted an offer from a company cannot participate in further drives (one company policy).",
    ]),
    ("Placement Process", [
        "Step 1: Company announces job profile, CTC, and eligibility criteria.",
        "Step 2: Eligible students apply through the placement portal.",
        "Step 3: Aptitude Test / Online Assessment.",
        "Step 4: Group Discussion (if applicable).",
        "Step 5: Technical Interview (1-2 rounds).",
        "Step 6: HR Interview.",
        "Step 7: Offer Letter.",
        "The entire process typically takes 1-3 days.",
    ]),
    ("Placement Statistics 2023-24", [
        "Total students placed: 342 out of 420 eligible students (81.4%)",
        "Highest package: Rs. 42 LPA (Amazon - Computer Science)",
        "Average package: Rs. 8.5 LPA",
        "Median package: Rs. 7.2 LPA",
        "Top recruiters: TCS, Infosys, Wipro, Cognizant, Accenture, Amazon, Microsoft, Google, Deloitte, KPMG",
        "Core engineering placements: 45 students in core companies",
        "Startups and SMEs: 67 students",
    ]),
    ("Preparation Resources", [
        "The TPC conducts weekly aptitude training sessions every Saturday from 10 AM to 12 PM.",
        "Mock interviews are conducted in the 7th semester.",
        "Resume building workshops are held at the start of the final year.",
        "Students are encouraged to complete at least one internship before final year.",
        "Online resources: HackerRank, LeetCode, GeeksforGeeks are recommended for coding practice.",
    ]),
    ("Internship Policy", [
        "Students are encouraged to do internships during summer vacations (after 2nd and 4th semester).",
        "Internship duration: Minimum 4 weeks.",
        "Students must submit an internship report to the TPC after completion.",
        "Internship experience adds value to placement profile.",
        "The TPC also facilitates internship opportunities through its company network.",
    ]),
])

print("\n🎉 All sample documents created in ./data/uploads/")
print("Now run: python seed.py")
print("Then upload these PDFs through the Admin Portal.")
