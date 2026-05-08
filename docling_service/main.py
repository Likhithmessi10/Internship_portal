from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from utils.parser import extract_from_bytes
from utils.matcher import calculate_score, get_matching_keywords
import uvicorn
import json
import os

# Disable HuggingFace symlinks to avoid WinError 1314 on Windows
os.environ["HF_HUB_DISABLE_SYMLINKS"] = "1"

app = FastAPI(title="Docling Resume Matcher")


@app.get("/")
async def root():
    return {"message": "Welcome to the Docling Resume Matcher Service!"}

@app.post("/match")
async def match_resume(
    resume: UploadFile = File(..., description="Resume PDF or DOCX"),
    jd_text: str = Form(..., description="Job Description as a JSON string")
):
    """
    Match a resume against a job description provided as a JSON string.
    The JSON can be a simple string or an object with fields like 'description', 'requirements', etc.
    """
    # 1. Parse Resume
    resume_content = await resume.read()
    resume_text = extract_from_bytes(resume_content, resume.filename)
    
    if not resume_text:
        raise HTTPException(status_code=500, detail="Could not extract text from the resume.")

    # 2. Parse JD from JSON string
    try:
        jd_data = json.loads(jd_text)
        if isinstance(jd_data, dict):
            # Recursively flatten all values from the JSON object
            def flatten_dict(d):
                vals = []
                for v in d.values():
                    if isinstance(v, dict):
                        vals.extend(flatten_dict(v))
                    elif isinstance(v, list):
                        vals.append(" ".join([str(i) for i in v]))
                    else:
                        vals.append(str(v))
                return vals
            extracted_jd = " ".join(flatten_dict(jd_data))
        else:
            extracted_jd = str(jd_data)
    except Exception:
        # Fallback to raw string if error occurs
        extracted_jd = jd_text

    if not extracted_jd:
        raise HTTPException(status_code=400, detail="Job description content is empty.")



    # 3. Calculate match score
    score = calculate_score(resume_text, extracted_jd)
    matching_keywords = get_matching_keywords(resume_text, extracted_jd)

    return {
        "score": round(score, 2),
        "matching_keywords": matching_keywords,
        "resume_summary": resume_text[:200] + "...",
        "jd_summary": extracted_jd[:200] + "..."
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
