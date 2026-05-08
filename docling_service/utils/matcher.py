from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re

def clean_text(text: str) -> str:
    """Basic text cleaning."""
    text = text.lower()
    text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

TECH_SKILLS = {
    "python", "javascript", "java", "c++", "c#", "rust", "go", "ruby", "php", "sql", "nosql", 
    "fastapi", "flask", "django", "react", "next.js", "vue", "angular", "node.js", 
    "docker", "kubernetes", "aws", "azure", "gcp", "git", "ci/cd", "agile", "scrum",
    "tensorflow", "pytorch", "scikit-learn", "nlp", "llm", "docling", "pandas", "numpy",
    "langchain", "langgraph", "rag", "gemini", "vertex ai", "chromadb", "postgresql", 
    "mongodb", "openai", "anthropic", "claude", "llama", "huggingface", "transformers",
    "bert", "gpt", "agentic", "workflows", "vector", "embedding", "eda", "visualization",
    "matplotlib", "seaborn", "postman", "api", "rest", "graphql"
}

def calculate_score(resume_text: str, jd_text: str) -> float:
    """Calculate similarity score using TF-IDF and a skill boost."""
    if not resume_text or not jd_text:
        return 0.0
        
    cleaned_resume = clean_text(resume_text)
    cleaned_jd = clean_text(jd_text)
    
    # 1. TF-IDF Similarity
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform([cleaned_resume, cleaned_jd])
    
    tfidf_score = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
    
    # 2. Skill Boost
    resume_words = set(cleaned_resume.split())
    jd_words = set(cleaned_jd.split())
    
    jd_skills = jd_words.intersection(TECH_SKILLS)
    if not jd_skills:
        # If no skills found in JD, just return the TF-IDF score
        return float(tfidf_score * 100)
        
    matched_skills = resume_words.intersection(jd_skills)
    skill_score = len(matched_skills) / len(jd_skills)
    
    # Combine (70% weight on skills, 30% on general TF-IDF similarity)
    final_score = (0.7 * skill_score) + (0.3 * tfidf_score)
    return float(final_score * 100)

def get_matching_keywords(resume_text: str, jd_text: str) -> list:
    """Find matching keywords, prioritizing skills."""
    cleaned_resume = clean_text(resume_text)
    cleaned_jd = clean_text(jd_text)
    
    resume_words = set(cleaned_resume.split())
    jd_words = set(cleaned_jd.split())
    
    matching_skills = list(resume_words.intersection(jd_words).intersection(TECH_SKILLS))
    other_matches = list(resume_words.intersection(jd_words) - set(matching_skills))
    
    return matching_skills + other_matches[:10]

