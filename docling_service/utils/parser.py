from docling.document_converter import DocumentConverter
import tempfile
import os

def extract_text(file_path: str) -> str:
    """Extract text from a document using Docling and return as markdown."""
    try:
        converter = DocumentConverter()
        result = converter.convert(file_path)
        return result.document.export_to_markdown()
    except Exception as e:
        print(f"Error extracting text: {e}")
        return ""

def extract_from_bytes(file_bytes: bytes, filename: str) -> str:
    """Save bytes to a temporary file and extract text."""
    suffix = os.path.splitext(filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name
    
    try:
        text = extract_text(tmp_path)
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
    return text
