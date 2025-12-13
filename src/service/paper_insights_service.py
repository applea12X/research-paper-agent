import os
import sys
import tempfile
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from utils.text_extraction import extract_text_from_upload
from utils.insights import analyze_text

app = FastAPI(title="Paper Insights Service")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict")
async def predict(file: UploadFile = File(...), use_graph: bool = Form(False)):
    suffix = os.path.splitext(file.filename or '')[1].lower()
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix or '.pdf') as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        text = extract_text_from_upload(tmp_path, file.content_type)
        graph_path = None
        if use_graph:
            candidate = os.path.join(os.path.dirname(ROOT), 'data', 'graph.json')
            if os.path.exists(candidate):
                graph_path = candidate

        insights = analyze_text(text, graph_path=graph_path)
        return JSONResponse(content=insights)
    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass


@app.get("/ml_categories")
def ml_categories():
    """Return a list of category names found under data/ml_scores_Output.
    The frontend can use this to whitelist which categories to display.
    """
    project_root = os.path.dirname(ROOT)
    target_dir = os.path.join(project_root, 'data', 'ml_scores_Output')
    if not os.path.exists(target_dir):
        return JSONResponse(content=[], status_code=200)

    entries = []
    try:
        for name in sorted(os.listdir(target_dir)):
            # Skip hidden files
            if name.startswith('.'):
                continue
            full = os.path.join(target_dir, name)
            if os.path.isdir(full):
                entries.append(name)
            else:
                # Strip common extensions
                base, _ = os.path.splitext(name)
                entries.append(base)
    except Exception:
        return JSONResponse(content=[], status_code=200)

    return JSONResponse(content=entries)
