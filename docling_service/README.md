# Docling Resume Matcher

A FastAPI-based service that Extracts text from Resumes and Job Descriptions using **Docling** and compares them using TF-IDF similarity.

## Prerequisites
- Python 3.13 (already setup in venv)
- `docling` and other dependencies (being installed)

## How to Run
1. Activate the virtual environment:
   ```powershell
   .\venv\Scripts\activate
   ```
2. Start the server:
   ```bash
   python main.py
   ```
3. The API will be available at `http://localhost:8000`.
4. You can access the Interactive API docs at `http://localhost:8000/docs`.

## API Usage
### Match Resume
`POST /match`

**Parameters:**
- `resume`: PDF/DOCX File
- `jd_text`: JSON string (e.g., `{"description": "Python dev...", "skills": ["FastAPI"]}`)

**Sample Curl:**
```bash
curl -X 'POST' \
  'http://localhost:8000/match' \
  -H 'accept: application/json' \
  -H 'Content-Type: multipart/form-data' \
  -F 'resume=@my_resume.pdf' \
  -F 'jd_text={"role":"Python Developer","description":"Must know FastAPI and Docling"}'
```

## Features
- **Docling Extraction**: Uses IBM's Docling for high-quality Markdown extraction from documents.
- **Semantic Scoring**: Matches using TF-IDF and Cosine Similarity.
- **Keyword Extraction**: Identifies matching keywords between the resume and JD.
