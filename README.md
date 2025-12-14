# AI Research Impact Observatory

> A GPU-accelerated research intelligence platform that quantifies machine learning's actual impact on scientific progress by processing 20M+ papers (2016-2024) across multiple scientific disciplines.

## 🚀 Quick Start

### Prerequisites

- **Ollama** - Local LLM inference
- **Python 3.8+** - Backend server
- **Node.js 18+** - Frontend application

### Installation & Setup

1. **Install Ollama and pull the model:**
   ```bash
   # Install Ollama from https://ollama.ai
   # Pull the required model
   ollama pull llama3.1:8b
   ```

2. **Start Ollama server:**
   ```bash
   ollama serve
   # Server should be running at http://127.0.0.1:11434
   ```

3. **Install backend dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. **Install frontend dependencies:**
   ```bash
   cd web
   npm install
   ```

### Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
python main.py
# Wait for: ✓ Dataset loaded successfully
# Server runs at http://localhost:8000
```

**Terminal 2 - Frontend:**
```bash
cd web
npm run dev
# Server runs at http://localhost:3000
```

**Terminal 3 (Optional) - Start with run script:**
```bash
cd backend
./run.sh  # Checks Ollama connection before starting
```

### Access the Application

- **Homepage:** http://localhost:3000
- **Dive Feature (Q&A + Paper Upload):** http://localhost:3000/dive
- **Findings Dashboard:** http://localhost:3000/findings
- **Case Studies:** http://localhost:3000/case-studies
- **API Health Check:** http://localhost:8000/api/health

---

## 🏗️ Tech Stack & Architecture

### Frontend Stack
- **Framework:** Next.js 16 (React 19)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Visualization:** D3.js, Recharts
- **Animation:** Framer Motion
- **Markdown:** react-markdown with remark-gfm

### Backend Stack
- **Framework:** FastAPI
- **Server:** Uvicorn
- **LLM Integration:** Ollama (llama3.1:8b)
- **PDF Processing:** PyPDF2
- **API:** RESTful endpoints

### Data Processing Stack
- **Language:** Python 3.8+
- **Libraries:** tqdm, requests, json, pathlib
- **Compression:** gzip

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
│                    http://localhost:3000                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js Frontend (Port 3000)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Homepage   │  │  Dive Chat   │  │   Findings   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Case Studies │  │ Visualizations│  │  PDF Upload  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              FastAPI Backend (Port 8000)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Chat API    │  │  Upload API  │  │  Search API  │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │ HTTP API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                Ollama Server (Port 11434)                    │
│                    llama3.1:8b Model                         │
│                  (Local LLM Inference)                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Local Dataset                             │
│         data/validation_metrics_summary.json                 │
│              (1,290 papers with metrics)                     │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Chat Query Flow:**
```
User Question → Frontend → Backend → Ollama LLM → Response
                              ↓
                     Dataset Context Added
```

**Paper Upload Flow:**
```
PDF Upload → Frontend → Backend → Extract Text (PyPDF2)
                          ↓
            Analyze with Ollama + Dataset Context
                          ↓
            Generate ML Impact Analysis → Return to Frontend
```

---

## 🧪 Reproduce the Demo

### Environment Variables

The application uses **local services** and does not require external API keys. However, you can configure the following:

#### Backend Configuration

Create `backend/.env` (optional):
```env
# Ollama Configuration
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.1:8b

# FastAPI Configuration
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Dataset Path (relative to backend directory)
DATASET_PATH=../data/validation_metrics_summary.json

# Logging
LOG_LEVEL=INFO
```

#### Frontend Configuration

Create `web/.env.local` (optional):
```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Feature Flags
NEXT_PUBLIC_ENABLE_UPLOAD=true
NEXT_PUBLIC_ENABLE_SEARCH=true
```

### Sample .env Template

**backend/.env.example:**
```env
# Ollama Configuration
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.1:8b

# FastAPI Configuration
HOST=0.0.0.0
PORT=8000

# CORS (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Dataset
DATASET_PATH=../data/validation_metrics_summary.json

# Logging
LOG_LEVEL=INFO
```

**web/.env.local.example:**
```env
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Features
NEXT_PUBLIC_ENABLE_UPLOAD=true
NEXT_PUBLIC_ENABLE_SEARCH=true
```

### Testing the Setup

1. **Check Ollama connection:**
   ```bash
   curl http://127.0.0.1:11434/api/tags
   ```

2. **Test backend health:**
   ```bash
   curl http://localhost:8000/api/health
   ```
   
   Expected response:
   ```json
   {
     "status": "healthy",
     "dataset_loaded": true,
     "ollama_reachable": true
   }
   ```

3. **Test frontend:**
   - Navigate to http://localhost:3000
   - You should see the homepage with navigation

4. **Test Dive feature:**
   - Go to http://localhost:3000/dive
   - Ask: "How many biology papers implement AI?"
   - Upload a research paper PDF (text-based, <10MB)

---

## 📊 Datasets & Data Provenance

### Primary Dataset

**validation_metrics_summary.json**
- **Location:** `data/validation_metrics_summary.json`
- **Size:** 1,290 papers
- **Source:** Processed from Semantic Scholar Open Research Corpus (S2ORC)
- **Time Period:** 2009-2022
- **Fields Covered:** 16 scientific disciplines

**Structure:**
```json
{
  "papers": [
    {
      "id": "paper_id",
      "year": 2021,
      "field": "ComputerScience",
      "ml_usage": "CORE",
      "has_code": true,
      "metrics": {...}
    }
  ]
}
```

### Output Data Files

**ML Analysis Outputs:**
- **Location:** `data/ml_output/`
- **Format:** JSONL (JSON Lines)
- **Fields:** 16 discipline-specific files
- **Content:** ML adoption markers per paper

**Example files:**
- `data/ml_output/Biology_output.jsonl`
- `data/ml_output/ComputerScience_output.jsonl`
- `data/ml_output/Medicine_output.jsonl`

**Non-ML Analysis Outputs:**
- **Location:** `data/nonml_output/`
- **Format:** JSONL
- **Content:** Papers with no ML adoption markers

### Raw Dataset Source

**Modular S2ORC Dataset**
- **Source:** [HuggingFace - modular-s2orc](https://huggingface.co/datasets/claran/modular-s2orc)
- **Total Size:** ~38 GB compressed
- **Total Papers:** 500K-1M in validation set, 20M+ in production
- **Format:** JSONL with gzip compression
- **Fields Available:** 16+ scientific disciplines

**Directory Structure:**
```
dataset/s2orc_data/
├── {Field},{YearRange}/
│   ├── train/
│   │   └── {Field}-{Year}.gz-{shard}.json.gz
│   ├── test/
│   │   └── {Field}-{Year}.jsonl.gz
│   └── val/
│       └── {Field}-{Year}.jsonl.gz
```

### Data Processing Pipeline

The data is processed through multiple stages:

1. **Cleanup:** `cleanup_data.py` - Consolidates files from train/test/val splits
2. **Combine:** `combine_categories.py` - Merges papers by discipline
3. **Compress:** `zip_for_git.py` - Compresses for version control
4. **Extract:** `extract_research_impact.py` - Extracts ML metrics with Ollama
5. **Analyze:** `analyze_extracted_impact.py` - Generates insights

**To reproduce processing:**
```bash
python3 cleanup_data.py
python3 combine_categories.py
python3 zip_for_git.py
python3 extract_research_impact.py
python3 analyze_extracted_impact.py
```

### Synthetic/Generated Data

**Frontend Visualizations:**
- `web/src/data/realHeatmapData.ts` - Aggregated ML adoption heatmap
- `web/src/data/discipline_stats.json` - Per-discipline statistics
- `web/src/data/ml_summaries.json` - Field-level ML adoption summaries

These are derived from the validation dataset, not synthetic.

### Data Provenance

- **Original Source:** Semantic Scholar Open Research Corpus (S2ORC)
- **License:** S2ORC is open for research use
- **Processing:** Papers extracted using Ollama LLM (llama3.1:8b)
- **Metrics Extracted:**
  - ML technique mentions (deep learning, transformers, etc.)
  - Framework usage (PyTorch, TensorFlow, scikit-learn)
  - Code availability (GitHub URLs)
  - Data availability (dataset mentions)
  - Reproducibility markers

---

## ⚠️ Known Limitations

### Technical Limitations

1. **Ollama Dependency:**
   - Requires local Ollama server running
   - First query loads model (10-30 seconds delay)
   - Performance depends on hardware (GPU recommended)

2. **Dataset Size:**
   - Current demo uses 1,290 papers (validation subset)
   - Production dataset has 20M+ papers (not included)
   - Some disciplines have limited representation

3. **PDF Processing:**
   - Only text-based PDFs supported (not scanned images)
   - Large PDFs (>10MB) may timeout
   - Complex formatting may affect extraction quality

4. **Analysis Speed:**
   - Paper upload analysis takes 30-60 seconds
   - Backend processes one request at a time
   - No request queuing system

5. **CORS Restrictions:**
   - Frontend must run on localhost:3000 or :3001
   - API only accepts requests from configured origins

### Data Limitations

1. **Time Coverage:**
   - Dataset covers 2009-2022 (not current)
   - Recent papers (2023-2024) not included
   - May miss latest ML trends

2. **Field Coverage:**
   - 16 disciplines covered, but uneven representation
   - Biology and Computer Science dominate
   - Some interdisciplinary papers may be miscategorized

3. **ML Detection Accuracy:**
   - Keyword-based detection may have false positives/negatives
   - Subtle ML usage might be missed
   - LLM analysis quality depends on paper clarity

4. **Citation Data:**
   - No structured citation graph (must parse from text)
   - Citation counts are estimates
   - Some citations may be missed

### Feature Limitations

1. **No User Accounts:**
   - No authentication/authorization
   - No conversation history persistence
   - Each session is independent

2. **Single Concurrent User:**
   - Backend handles one request at a time
   - No load balancing or scaling
   - Concurrent uploads will queue

3. **Limited Search:**
   - No advanced filters on frontend
   - Basic keyword matching
   - No fuzzy search or typo correction

4. **Visualization Constraints:**
   - Static data (no real-time updates)
   - Limited interactivity on some charts
   - No export functionality for charts

---

## 🚧 Next Steps & Roadmap

### Short Term (Next Sprint)

- [ ] **Improve PDF extraction:** Add OCR support for scanned PDFs
- [ ] **Add request queuing:** Handle concurrent uploads gracefully
- [ ] **Export functionality:** Allow users to download analysis results
- [ ] **Error handling:** Better user feedback for failed uploads
- [ ] **Caching layer:** Cache Ollama responses to speed up common queries

### Medium Term (1-3 Months)

- [ ] **Citation graph visualization:** Interactive network graphs
- [ ] **Advanced filters:** Filter by year, field, ML technique
- [ ] **Comparison mode:** Compare multiple papers side-by-side
- [ ] **Batch upload:** Process multiple PDFs at once
- [ ] **API documentation:** OpenAPI/Swagger docs
- [ ] **Database integration:** PostgreSQL for better querying

### Long Term (3-6 Months)

- [ ] **Full dataset integration:** Process all 20M+ papers
- [ ] **GPU acceleration:** RAPIDS cuDF/cuGraph for graph analysis
- [ ] **Temporal analysis:** Track ML adoption trends over time
- [ ] **Reproducibility scoring:** Quantify code/data availability
- [ ] **Discovery journey tracing:** Follow citations from ML → impact
- [ ] **User accounts:** Save queries, upload history, favorites
- [ ] **Collaborative features:** Share analyses, annotations, insights

### Production Readiness

- [ ] **Containerization:** Docker/Docker Compose setup
- [ ] **Cloud deployment:** AWS/GCP deployment guide
- [ ] **Monitoring:** Prometheus/Grafana metrics
- [ ] **Testing:** Unit tests, integration tests, E2E tests
- [ ] **CI/CD:** GitHub Actions pipeline
- [ ] **Security:** Rate limiting, input validation, HTTPS
- [ ] **Documentation:** API docs, user guide, video tutorials

### Research & Analysis Features

- [ ] **Attribution scoring:** Quantify ML contribution vs domain expertise
- [ ] **Acceleration metrics:** Measure time-to-discovery speedup
- [ ] **Cross-discipline analysis:** Compare adoption across fields
- [ ] **Reproducibility correlation:** Link ML adoption to quality signals
- [ ] **Trend forecasting:** Predict emerging ML techniques
- [ ] **Impact case studies:** Deep dives on transformational papers

---

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - Dive feature usage guide
- **[DATA_WORKFLOW.md](DATA_WORKFLOW.md)** - Data processing pipeline
- **[DATASET_STRUCTURE.md](DATASET_STRUCTURE.md)** - Dataset schema and structure
- **[README_DATA_PIPELINE.md](README_DATA_PIPELINE.md)** - Complete pipeline documentation
- **[EXTRACTION_WORKFLOW.md](EXTRACTION_WORKFLOW.md)** - Metric extraction details
- **[backend/README.md](backend/README.md)** - Backend API documentation
- **[backend/SEARCH_API_INFO.md](backend/SEARCH_API_INFO.md)** - Search API details

---

## 🤝 Contributing

This project was built for the **Symby AI Research Impact Observatory Hackathon**. Contributions are welcome!

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests (when available)
5. Commit: `git commit -m "Add amazing feature"`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

---

## 📄 License

This project is built for the AI Research Impact Observatory Hackathon.
The S2ORC dataset is open for research use. See [Semantic Scholar](https://www.semanticscholar.org/) for details.

---

## 🙏 Acknowledgments

- **Semantic Scholar** - S2ORC dataset
- **Ollama** - Local LLM inference
- **NVIDIA** - DGX Spark platform inspiration
- **Symby AI** - Hackathon organizer

---

## 📧 Contact & Support

For issues or questions:
1. Check the [documentation](#-documentation) above
2. Review [Known Limitations](#-known-limitations)
3. Test with `test_extraction.py` for pipeline issues
4. Check Ollama logs: `ollama logs`

---

**Built with ❤️ for advancing science through AI**

