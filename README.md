# CampusAI – AI University Assistant

A web app where students can ask questions and get answers from their university's official documents using AI.

---

## What does it do?

- Students log in and ask questions like *"What is the attendance rule?"* or *"What are the library timings?"*
- The AI searches through uploaded university PDF documents and gives an answer with the source document and page number
- If the answer is not found in the documents, it clearly says so
- Admins can upload university PDFs, manage notices, and FAQs

---

## Project Structure

```
AI University Assistant/
├── backend/      ← Python + FastAPI (the server and AI logic)
└── frontend/     ← React + Tailwind CSS (the website)
```

---

## How to Run

You need **two terminals open at the same time** — one for backend, one for frontend.

### Terminal 1 — Start the Backend (Python server)

```bash
cd backend

# Step 1: Create a virtual environment (only needed once)
python -m venv venv

# Step 2: Activate it
venv\Scripts\activate          # Windows
source venv/bin/activate       # Mac / Linux

# Step 3: Install required packages (only needed once)
pip install -r requirements.txt

# Step 4: Create the database and demo users (only needed once)
python seed.py

# Step 5: Start the server
uvicorn main:app --reload --port 8000
```

Server runs at: http://localhost:8000

### Terminal 2 — Start the Frontend (React website)

```bash
cd frontend

# Step 1: Install packages (only needed once)
npm install

# Step 2: Start the website
npm run dev
```

Website runs at: http://localhost:5173

---

## Login Credentials (for testing)

| Who | Email | Password |
|-----|-------|----------|
| Admin | admin@university.edu | admin123 |
| Student | student@university.edu | student123 |

---

## How to Add University Documents (Important!)

1. Login as **Admin**
2. Go to **Documents** in the sidebar
3. Upload any university PDF (exam rules, fee structure, hostel rules, etc.)
4. The system will automatically read the PDF and make it searchable by the AI
5. Students can now ask questions about that document

---

## Tech Used

| Part | Technology |
|------|-----------|
| Website | React, Tailwind CSS |
| Server | Python, FastAPI |
| AI Search | Sentence Transformers, FAISS |
| PDF Reading | PyPDF |
| Database | SQLite |

---

## How the AI Works (Simple Explanation)

1. Admin uploads a PDF → app reads all the text → splits into small chunks → converts to numbers (embeddings) → saves in FAISS
2. Student asks a question → question is also converted to numbers → FAISS finds the most similar chunks
3. The most relevant chunks are shown to the student as the answer with the source document and page number

This technique is called **RAG (Retrieval-Augmented Generation)**.
