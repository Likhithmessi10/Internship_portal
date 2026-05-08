import json
import os

# Disable HuggingFace symlinks to avoid WinError 1314 on Windows
os.environ["HF_HUB_DISABLE_SYMLINKS"] = "1"

from utils.matcher import calculate_score, get_matching_keywords
from utils.parser import extract_text

def test_matching():
    # 1. Use triple quotes for the multi-line JSON string
    jd_json_str = r"""{
  "internship": {
    "title": "AI Engineering Intern (Agentic Workflows & RAG)",
    "description": "We are seeking a high-caliber AI Engineering Intern to join our team and focus on the development of autonomous agentic workflows and scalable RAG systems. This role is ideal for a candidate with a strong background in bridging advanced AI research with real-world social impact, particularly in G2C (Government-to-Citizen) or disaster response domains. You will work with cutting-edge tools like LangGraph and Google Gemini to build production-ready AI solutions.",
    "responsibilities": [
      "Design and implement multi-modal Agentic AI workflows using LangChain or LangGraph to solve complex data governance and automation challenges.",
      "Develop and optimize Retrieval-Augmented Generation (RAG) pipelines using vector databases like ChromaDB and PostgreSQL for high-accuracy information retrieval.",
      "Integrate Large Language Models (LLMs) such as Google Gemini via Vertex AI into functional applications and CLI-based analyst tools.",
      "Collaborate on the end-to-end development of AI-driven platforms, including API integration (Postman), data preprocessing, and automated EDA report generation.",
      "Document technical architectures and research findings to ensure reproducibility and scalability of AI agents."
    ],
    "requirements": [
      "Currently pursuing a B.Tech in CSE (AI&ML) with a strong academic record (9.0+ CGPA preferred).",
      "Proven experience in developing autonomous agents and working with LLM orchestration frameworks (LangGraph, LangChain, n8n).",
      "Hands-on proficiency in Python and its ecosystem (NumPy, Pandas, scikit-learn, Flask) and database management (PostgreSQL, ChromaDB).",
      "Familiarity with deployment and DevOps tools including Docker, Git, and RESTful APIs.",
      "Demonstrated ability to lead technical projects, as evidenced by fellowships (e.g., Tech Bharat AI CoE) or success in high-level hackathons."
    ],
    "outcomes": [
      "Deployment of a functional AI agent or workflow into a real-world project environment.",
      "Deepened expertise in engineering production-grade LLM applications and complex RAG architectures.",
      "Experience working on high-impact social or governmental projects in collaboration with industry leaders.",
      "A professional-grade technical portfolio entry showcasing the transition from AI research to scalable application."
    ]
  }
}"""

    
    # 2. Extract path to Resume
    resume_path = "C:/Users/mukka/Downloads/Resume-4 (1).pdf"
    
    # 3. Replicate JSON parsing logic from main.py
    try:
        jd_data = json.loads(jd_json_str)
        if isinstance(jd_data, dict):
            # Recursively join values for comparison
            def flatten_values(d):
                vals = []
                for v in d.values():
                    if isinstance(v, dict):
                        vals.extend(flatten_values(v))
                    elif isinstance(v, list):
                        vals.append(" ".join([str(i) for i in v]))
                    else:
                        vals.append(str(v))
                return vals
            
            jd_text = " ".join(flatten_values(jd_data))
        else:
            jd_text = str(jd_data)
    except Exception as e:
        print(f"Error parsing JD JSON: {e}")
        jd_text = jd_json_str

    # 4. Extract Resume Text (if file exists)
    if os.path.exists(resume_path):
        print(f"Extracting text from: {resume_path}...")
        resume_text = extract_text(resume_path)
        print(f"Extracted Resume Length: {len(resume_text)} characters")
        if resume_text:
            print(f"Sample Text: {resume_text[:500]}...")
        else:
            print("ERROR: Extracted text is empty!")
    else:

        print(f"Warning: Resume file not found at {resume_path}. Using a dummy resume text for testing.")
        resume_text = "UX Designer with experience in Figma, user research, wireframing, and creating prototypes. Currently pursuing Master's in HCI."

    # 5. Calculate Score
    score = calculate_score(resume_text, jd_text)
    keywords = get_matching_keywords(resume_text, jd_text)
    
    print("\n--- Match Results ---")
    print(f"Match Score: {score:.2f}%")
    print(f"Matching Keywords: {keywords}")

if __name__ == "__main__":
    test_matching()
