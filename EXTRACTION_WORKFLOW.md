# Research Impact Extraction Workflow

This document explains how to extract and analyze research impact metrics from the paper dataset using Ollama LLM.

## Overview

The extraction pipeline processes research papers in JSONL format and extracts structured impact metrics:

1. **Citation Networks** - Referenced papers and citation counts
2. **ML Adoption Markers** - Frameworks, compute resources, datasets
3. **Reproducibility Indicators** - Code/data availability, replication attempts
4. **Research Outcomes** - Clinical trials, patents, retractions, corrections
5. **Impact Metrics** - Media coverage, policy influence, industry adoption

## Prerequisites

### 1. Install Ollama

```bash
# macOS
brew install ollama

# Or download from https://ollama.ai
```

### 2. Start Ollama Server

```bash
ollama serve
```

### 3. Pull a Model

```bash
# Recommended models (choose one):
ollama pull llama3.1:8b      # Fast, good quality (default)
ollama pull llama3.1:70b     # Better quality, slower
ollama pull mistral:7b       # Alternative, fast
ollama pull qwen2.5:14b      # Good for technical text
```

### 4. Install Python Dependencies

```bash
pip install requests tqdm
```

## Workflow

### Step 1: Extract Impact Metrics

The extraction script reads each line of the JSONL files and uses Ollama to extract structured metrics.

```bash
python3 extract_research_impact.py
```

**What it does:**
- Reads compressed JSONL files from `data/combined_compressed/`
- For each paper (one JSON per line):
  - Extracts paper text and metadata
  - Sends to Ollama with structured prompt
  - Receives JSON response with extracted metrics
- Saves to `data/extracted_impact/{category}_impact.jsonl`
- Supports resume (saves progress every 50 papers)
- Handles interruptions gracefully

**Configuration** (edit in script):
```python
OLLAMA_MODEL = "llama3.1:8b"  # Model to use
MAX_TEXT_LENGTH = 8000        # Max text length sent to LLM
SAVE_INTERVAL = 50            # Save progress frequency
```

**Example Usage:**
```bash
$ python3 extract_research_impact.py

Research Impact Information Extraction
============================================================
✓ Output directory: data/extracted_impact
✓ Ollama is running
  Available models: llama3.1:8b, mistral:7b

✓ Found 15 category files

Categories:
  1. Biology
  2. Chemistry
  3. ComputerScience
  4. Economics
  5. Engineering
  ...

Options:
  - Enter numbers (e.g., '1,2,3') to process specific categories
  - Enter 'all' to process all categories
  - Enter 'q' to quit

Your choice: 3

Processing ComputerScience...
  Total papers: 12,345
  Remaining: 12,345

  ComputerScience: 100%|████████| 12345/12345 [2:30:00<00:00, 1.37it/s]

  Summary for ComputerScience:
    ✓ Successfully extracted: 12,200
    ✗ Failed: 145
    → Output: data/extracted_impact/ComputerScience_impact.jsonl
```

**Output Format:**

Each line in the output JSONL file is a JSON object:

```json
{
  "citations": {
    "cited_papers": ["Paper 1", "Paper 2"],
    "citation_count_estimate": "25"
  },
  "ml_adoption": {
    "frameworks": ["TensorFlow", "PyTorch"],
    "compute_resources": ["NVIDIA V100", "Google Cloud"],
    "datasets": ["ImageNet", "COCO"],
    "models": ["ResNet-50", "BERT"]
  },
  "reproducibility": {
    "code_available": true,
    "code_url": "https://github.com/user/repo",
    "data_available": true,
    "data_url": "https://zenodo.org/...",
    "has_supplementary": true,
    "mentions_replication": false
  },
  "research_outcomes": {
    "has_clinical_trial": false,
    "clinical_trial_ids": [],
    "has_patent": false,
    "patent_numbers": [],
    "mentions_retraction": false,
    "mentions_correction": false
  },
  "impact_indicators": {
    "mentions_media_coverage": true,
    "mentions_policy_influence": false,
    "mentions_industry_adoption": true,
    "real_world_applications": ["image recognition", "autonomous driving"]
  },
  "additional_info": {
    "funding_sources": ["NSF", "Google"],
    "collaborations": ["Stanford", "MIT"],
    "keywords": ["deep learning", "computer vision"],
    "methodology": "Proposed novel architecture...",
    "main_findings": "Achieved 95% accuracy..."
  },
  "_paper_id": "10347072",
  "_year": 2011,
  "_category": "ComputerScience",
  "_source_file": "ComputerScience_2009-2011_val_Computer Science-2011.jsonl",
  "_extraction_timestamp": "2024-12-13T10:30:00.000Z"
}
```

### Step 2: Analyze Extracted Data

Generate aggregated statistics and insights from extracted metrics.

```bash
python3 analyze_extracted_impact.py
```

**What it does:**
- Reads all `*_impact.jsonl` files from `data/extracted_impact/`
- Aggregates metrics across all papers in each category
- Calculates rates, trends, and top items
- Generates reports in multiple formats

**Outputs:**

1. **JSON Analysis** (`data/analysis/{category}_analysis.json`)
   - Complete aggregated statistics
   - Top frameworks, datasets, funding sources
   - Temporal trends by year
   - All metrics in structured format

2. **Markdown Reports** (`data/analysis/{category}_report.md`)
   - Human-readable summary
   - Key statistics and trends
   - Top 10 lists for each category

3. **CSV Summary** (`data/analysis/summary_statistics.csv`)
   - Comparison across all categories
   - Easy to import into Excel/Google Sheets
   - Rates for all key metrics

**Example Output:**

```
Research Impact Analysis
============================================================
✓ Output directory: data/analysis

Analyzing ComputerScience...
  Loaded 12,200 papers
  ✓ Analysis saved to data/analysis/ComputerScience_analysis.json
  ✓ Report saved to data/analysis/ComputerScience_report.md

Analyzing Biology...
  Loaded 8,500 papers
  ...

✓ Summary CSV saved to data/analysis/summary_statistics.csv

============================================================
Analysis Complete
============================================================
  Total categories analyzed: 15
  Total papers analyzed: 125,000
  Output directory: data/analysis
============================================================
```

## Performance Considerations

### Speed

- **llama3.1:8b**: ~2-3 papers/second on M1 Mac
- **llama3.1:70b**: ~0.3-0.5 papers/second (10x slower but more accurate)
- For 10,000 papers with llama3.1:8b: ~1-2 hours

### GPU Acceleration

Ollama automatically uses GPU if available:
- **Mac**: Uses Metal (M1/M2/M3)
- **NVIDIA**: Uses CUDA
- **AMD**: Uses ROCm

### Resumable Processing

The extraction script saves progress every 50 papers:
- If interrupted, restart with the same command
- It will skip already processed papers
- Progress saved in `data/extracted_impact/progress/{category}_progress.json`

### Batch Processing

To process multiple categories efficiently:

```bash
# Process all categories overnight
python3 extract_research_impact.py
# Choose 'all' when prompted

# Or process specific categories in parallel (advanced)
python3 extract_research_impact.py &  # Terminal 1: Choose categories 1-5
python3 extract_research_impact.py &  # Terminal 2: Choose categories 6-10
# Note: Requires multiple Ollama instances on different ports
```

## Quality Control

### Validation

Check extraction quality:

```bash
# View a sample of extracted data
gunzip -c data/extracted_impact/ComputerScience_impact.jsonl | head -5 | jq

# Check for parsing errors
grep -c "null" data/extracted_impact/ComputerScience_impact.jsonl
```

### Re-extraction

To re-extract specific papers:

```bash
# Delete progress file to start fresh
rm data/extracted_impact/progress/ComputerScience_progress.json

# Or delete specific output to reprocess
rm data/extracted_impact/ComputerScience_impact.jsonl
```

## Troubleshooting

### Ollama Not Running

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not, start it
ollama serve
```

### Model Not Found

```bash
# List available models
ollama list

# Pull the model
ollama pull llama3.1:8b
```

### Out of Memory

If Ollama runs out of memory:

1. Use a smaller model: `OLLAMA_MODEL = "llama3.1:8b"`
2. Reduce text length: `MAX_TEXT_LENGTH = 4000`
3. Close other applications
4. Increase Docker memory (if using Docker)

### Slow Extraction

To speed up:

1. Use a smaller/faster model
2. Reduce `MAX_TEXT_LENGTH`
3. Process fewer categories at once
4. Ensure GPU acceleration is working

### JSON Parsing Errors

If you see many JSON parse errors:
1. Try a different model (some are better at JSON)
2. Increase temperature: `"temperature": 0.0`
3. Check the prompt formatting

## Advanced Configuration

### Custom Prompts

Edit the `EXTRACTION_PROMPT` in `extract_research_impact.py` to:
- Add new fields
- Change extraction focus
- Adjust format requirements

### Different Models for Different Categories

```python
# In extract_research_impact.py, add model selection logic:
if category == "Medicine":
    OLLAMA_MODEL = "meditron:7b"  # Medical-specialized model
elif category == "ComputerScience":
    OLLAMA_MODEL = "codellama:13b"  # Code-focused model
else:
    OLLAMA_MODEL = "llama3.1:8b"  # General purpose
```

### Parallel Processing

For maximum speed with multiple GPUs:

```python
# Set different ports for each Ollama instance
OLLAMA_BASE_URL = f"http://localhost:{11434 + worker_id}"
```

## Data Pipeline Summary

Complete workflow:

```bash
# 1. Prepare data
python3 cleanup_data.py
python3 combine_categories.py
python3 zip_for_git.py

# 2. Extract metrics
ollama serve  # In separate terminal
python3 extract_research_impact.py

# 3. Analyze results
python3 analyze_extracted_impact.py

# 4. View results
open data/analysis/summary_statistics.csv
open data/analysis/ComputerScience_report.md
```

## Output Directory Structure

```
data/
├── combined_compressed/          # Input: Compressed paper files
│   ├── ComputerScience.jsonl.gz
│   ├── Biology.jsonl.gz
│   └── ...
├── extracted_impact/             # Extracted metrics
│   ├── ComputerScience_impact.jsonl
│   ├── Biology_impact.jsonl
│   ├── progress/
│   │   ├── ComputerScience_progress.json
│   │   └── ...
│   └── extraction_summary.json
└── analysis/                     # Aggregated analysis
    ├── ComputerScience_analysis.json
    ├── ComputerScience_report.md
    ├── Biology_analysis.json
    ├── Biology_report.md
    ├── summary_statistics.csv
    └── overall_summary.json
```

## Next Steps

After extraction and analysis:

1. **Visualize trends** - Use the JSON/CSV data in Jupyter notebooks
2. **Build databases** - Import into PostgreSQL/MongoDB
3. **Create dashboards** - Use Tableau/PowerBI with CSV data
4. **Train models** - Use extracted features for ML models
5. **Citation network analysis** - Build graphs from citation data
