import os
from typing import Optional
from PyPDF2 import PdfReader


def extract_text_from_pdf(path: str) -> str:
    text_chunks = []
    with open(path, 'rb') as f:
        reader = PdfReader(f)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_chunks.append(page_text)
    return '\n'.join(text_chunks)


def extract_text_from_upload(path: str, content_type: Optional[str] = None) -> str:
    ext = os.path.splitext(path)[1].lower()
    if ext == '.pdf' or (content_type and 'pdf' in content_type.lower()):
        return extract_text_from_pdf(path)
    with open(path, 'rb') as f:
        try:
            return f.read().decode('utf-8', errors='ignore')
        except Exception:
            return ''
