# Research Paper Data Pipeline

Complete pipeline for processing research papers and extracting impact metrics for the AI Research Impact Observatory.

## Quick Start

```bash
# 1. Install dependencies
pip install tqdm requests

# 2. Start Ollama
ollama serve  # In separate terminal
ollama pull llama3.1:8b

# 3. Test setup
python3 test_extraction.py

# 4. Run full pipeline (if test passes)
python3 cleanup_data.py
python3 combine_categories.py
python3 zip_for_git.py
python3 extract_research_impact.py
python3 analyze_extracted_impact.py
```

## Pipeline Overview

```
Raw Data → Cleanup → Combine → Compress → Extract Metrics → Analyze
   ↓          ↓         ↓          ↓            ↓              ↓
 train/    papers/  combined/  compressed/  extracted/     analysis/
 test/val                        (git)       impact/
```

## Scripts

### Data Preparation

| Script | Purpose | Input | Output |
|--------|---------|-------|--------|
| [cleanup_data.py](cleanup_data.py) | Flatten directory structure | `data/Field,Year-Year/train/test/val/` | `data/papers/` |
| [combine_categories.py](combine_categories.py) | Combine by field | `data/papers/` | `data/combined/` |
| [zip_for_git.py](zip_for_git.py) | Compress for version control | `data/combined/` | `data/combined_compressed/` |

### Metric Extraction

| Script | Purpose | Input | Output |
|--------|---------|-------|--------|
| [test_extraction.py](test_extraction.py) | Test Ollama setup | `data/combined_compressed/` | `test_extraction_output.json` |
| [extract_research_impact.py](extract_research_impact.py) | Extract impact metrics | `data/combined_compressed/` | `data/extracted_impact/` |
| [analyze_extracted_impact.py](analyze_extracted_impact.py) | Generate insights | `data/extracted_impact/` | `data/analysis/` |

## Extracted Metrics

### 1. Citation Networks
- Referenced papers (titles/authors)
- Citation count estimates
- Citation relationships

### 2. ML Adoption Markers
- **Frameworks**: TensorFlow, PyTorch, scikit-learn, Keras, etc.
- **Compute Resources**: GPU types (V100, A100), cloud platforms (AWS, GCP), HPC systems
- **Datasets**: ImageNet, COCO, common benchmarks, custom datasets
- **Models**: Specific architectures (ResNet, BERT, GPT, etc.)

### 3. Reproducibility Indicators
- Code availability (boolean)
- Code repository URLs (GitHub, GitLab, etc.)
- Data availability (boolean)
- Data repository URLs (Zenodo, Figshare, etc.)
- Supplementary materials presence
- Replication study mentions

### 4. Research Outcomes
- Clinical trials (has_clinical_trial, NCT numbers)
- Patents (has_patent, patent numbers)
- Retractions (mentions)
- Corrections (mentions)

### 5. Impact Metrics
- Media coverage mentions
- Policy influence mentions
- Industry adoption mentions
- Real-world applications

### 6. Additional Information
- Funding sources (NSF, NIH, private companies)
- Collaborations (institutions, companies)
- Technical keywords
- Methodology summaries
- Main findings

## File Formats

### Input: JSONL (JSON Lines)

Each line is a complete paper:
```json
{"id": "123", "text": "paper content...", "metadata": {...}}
{"id": "124", "text": "paper content...", "metadata": {...}}
```

### Output: Structured JSON

Each extracted paper:
```json
{
  "citations": {...},
  "ml_adoption": {...},
  "reproducibility": {...},
  "research_outcomes": {...},
  "impact_indicators": {...},
  "additional_info": {...},
  "_paper_id": "123",
  "_year": 2020,
  "_category": "ComputerScience",
  "_extraction_timestamp": "2024-12-13T10:30:00.000Z"
}
```

## Directory Structure

```
research-paper-agent/
├── data/
│   ├── [Field,Year-Year]/       # Original (gitignored)
│   │   ├── train/
│   │   ├── test/
│   │   └── val/
│   ├── papers/                  # Consolidated (gitignored)
│   ├── combined/                # Combined by category (gitignored)
│   ├── combined_compressed/     # Compressed (tracked in git)
│   │   ├── Biology.jsonl.gz
│   │   ├── ComputerScience.jsonl.gz
│   │   └── ...
│   ├── extracted_impact/        # LLM extracted (gitignored)
│   │   ├── Biology_impact.jsonl
│   │   ├── ComputerScience_impact.jsonl
│   │   ├── progress/
│   │   └── extraction_summary.json
│   └── analysis/                # Analysis results (tracked in git)
│       ├── Biology_analysis.json
│       ├── Biology_report.md
│       ├── summary_statistics.csv
│       └── overall_summary.json
├── Scripts
│   ├── cleanup_data.py
│   ├── combine_categories.py
│   ├── zip_for_git.py
│   ├── extract_research_impact.py
│   ├── analyze_extracted_impact.py
│   └── test_extraction.py
└── Documentation
    ├── README_DATA_PIPELINE.md (this file)
    ├── DATA_WORKFLOW.md
    └── EXTRACTION_WORKFLOW.md
```

## Git Strategy

### Tracked Files (pushed to git)
- ✅ `data/combined_compressed/` - Compressed source data
- ✅ `data/analysis/` - Analysis results and reports
- ✅ All Python scripts
- ✅ Documentation

### Ignored Files (not in git)
- ❌ `data/papers/` - Intermediate files
- ❌ `data/combined/` - Uncompressed combined files
- ❌ `data/extracted_impact/` - LLM-generated (can be regenerated)
- ❌ Original data directories

**Rationale**: The compressed data and analysis results are small enough for git. The extracted impact data can be regenerated from the compressed files using the extraction script.

## Performance Benchmarks

### Extraction Speed (llama3.1:8b on M1 Mac)
- Speed: ~2-3 papers/second
- 10,000 papers: ~1-2 hours
- 100,000 papers: ~10-20 hours

### Model Comparison
| Model | Speed | Quality | Memory |
|-------|-------|---------|--------|
| llama3.1:8b | Fast (3 papers/s) | Good | 8 GB |
| llama3.1:70b | Slow (0.5 papers/s) | Excellent | 48 GB |
| mistral:7b | Fast (3 papers/s) | Good | 7 GB |
| qwen2.5:14b | Medium (1.5 papers/s) | Very Good | 14 GB |

### Disk Space Requirements
- Original data: ~10-50 GB (varies by dataset)
- Combined data: ~5-25 GB
- Compressed data: ~1-5 GB (80-90% compression)
- Extracted impact: ~500 MB - 2 GB
- Analysis results: ~10-100 MB

## Common Workflows

### Test Setup
```bash
# Verify everything works before full extraction
python3 test_extraction.py
```

### Process Single Category
```bash
# Extract just Computer Science papers
python3 extract_research_impact.py
# Choose option: 3 (or whichever number for CS)
```

### Resume Interrupted Extraction
```bash
# Just run the same command - it auto-resumes
python3 extract_research_impact.py
```

### Re-extract with Different Model
```bash
# Edit extract_research_impact.py
# Change: OLLAMA_MODEL = "llama3.1:70b"

# Delete progress to start fresh
rm -rf data/extracted_impact/progress/

# Run extraction
python3 extract_research_impact.py
```

### Export for Excel Analysis
```bash
# Generate analysis (creates CSV)
python3 analyze_extracted_impact.py

# Open in Excel/Google Sheets
open data/analysis/summary_statistics.csv
```

## Troubleshooting

### "Ollama not running"
```bash
# Start Ollama service
ollama serve

# Verify it's running
curl http://localhost:11434/api/tags
```

### "Model not found"
```bash
# Pull the model
ollama pull llama3.1:8b

# List available models
ollama list
```

### "Out of memory"
```bash
# Use smaller model
# In extract_research_impact.py, change:
OLLAMA_MODEL = "llama3.1:8b"  # Instead of 70b

# Or reduce text length
MAX_TEXT_LENGTH = 4000  # Instead of 8000
```

### "Extraction too slow"
```bash
# 1. Use faster model
OLLAMA_MODEL = "mistral:7b"

# 2. Process fewer categories
# Run script, choose 1-2 categories at a time

# 3. Check GPU is being used
ollama ps  # Should show model loaded
```

### "JSON parse errors"
```bash
# Try more structured model
OLLAMA_MODEL = "qwen2.5:14b"  # Better at JSON

# Or check prompt formatting
# Ensure the EXTRACTION_PROMPT has clear JSON structure
```

## Next Steps

After completing the pipeline:

1. **Build Citation Network Graph**
   - Use NetworkX to create citation graphs
   - Visualize with Gephi or D3.js

2. **Temporal Analysis**
   - Track ML adoption trends over time
   - Reproducibility improvements by year

3. **Cross-Category Insights**
   - Compare adoption rates across fields
   - Identify interdisciplinary patterns

4. **Database Integration**
   - Import into PostgreSQL for querying
   - Build MongoDB for flexible schema

5. **Dashboard Creation**
   - Tableau/PowerBI dashboards
   - Web interface with Flask/FastAPI

6. **ML Modeling**
   - Predict paper impact
   - Identify emerging trends
   - Citation recommendation

## Documentation

- [DATA_WORKFLOW.md](DATA_WORKFLOW.md) - Data preparation steps
- [EXTRACTION_WORKFLOW.md](EXTRACTION_WORKFLOW.md) - Detailed extraction guide
- Script headers - Each script has detailed docstrings

## Support

For issues:
1. Check the troubleshooting section above
2. Review the detailed workflow documentation
3. Run `test_extraction.py` to identify issues
4. Check Ollama logs: `ollama logs`

## License

This pipeline is part of the AI Research Impact Observatory project.
