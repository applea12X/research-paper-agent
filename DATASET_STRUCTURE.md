# Dataset Structure: Modular S2ORC

## Overview

The dataset is the **Semantic Scholar Open Research Corpus (S2ORC)** organized in a modular format, containing scientific papers from 2009-2022 across multiple disciplines.

- **Total Size:** ~38 GB compressed
- **Total Files:** 303 compressed JSON files (.gz)
- **Total Directories:** 66 field-year combinations
- **Format:** JSONL (JSON Lines) - one paper per line
- **Compression:** gzip (.gz)

## Directory Structure

### Hierarchy

```
dataset/s2orc_data/
├── {Field},{YearRange}/
│   ├── train/
│   │   └── {Field}-{Year}.gz-{shard}.json.gz  (large file, e.g., 551MB)
│   ├── test/
│   │   └── {Field}-{Year}.jsonl.gz            (small file, e.g., 1.6MB)
│   └── val/
│       └── {Field}-{Year}.jsonl.gz            (small file, e.g., 1.4MB)
└── README.md
```

### Example Structure

```
ComputerScience,2019-2019/
├── train/
│   └── Computer Science-2019.gz-0000.json.gz  (551MB, ~61,617 papers)
├── test/
│   └── Computer Science-2019.jsonl.gz         (1.6MB, ~100 papers)
└── val/
    └── Computer Science-2019.jsonl.gz         (1.4MB, ~100 papers)
```

## Fields Available

The dataset covers the following scientific disciplines:

1. **Agricultural And Food Sciences** (2016-2022)
2. **Biology** (2016-2022) - Largest field by volume (1.6GB for 2021)
3. **Chemistry** (2019-2022)
4. **Computer Science** (2009-2011, 2016-2022) - Key for ML methodology papers
5. **Economics** (2017-2022)
6. **Engineering** (2017-2022)
7. **Environmental Science** (2017-2019)
8. **Geology** (likely present, not fully explored)
9. **Geography** (likely present)
10. **Materials Science** (likely present)
11. **Mathematics** (2007-2009 based on cache)
12. **Medicine** (2007-2009 based on cache)
13. **Physics** (2017 based on cache)
14. **Psychology** (likely present)
15. And more...

### Field Sizes (Sample)

| Field | Year Range | Size | Papers (approx) |
|-------|------------|------|-----------------|
| Biology | 2021 | 1.6GB | 149,329 |
| Biology | 2020 | 1.4GB | ~120,000 |
| Computer Science | 2021 | 1.3GB | ~100,000 |
| Computer Science | 2020 | 1.0GB | ~80,000 |
| Computer Science | 2019 | 564MB | 61,617 |
| Biology | 2019 | 1.0GB | ~80,000 |
| Biology | 2022 | 201MB | ~16,000 |

**Note:** Biology and Computer Science have the largest volumes, critical for our analysis.

## File Format & Schema

### File Types

1. **Train files:** Large sharded files (`.gz-0000.json.gz`)
   - Contain the bulk of papers (thousands to hundreds of thousands)
   - May have multiple shards (`.gz-0000`, `.gz-0001`, etc.)
   - Example: 551MB compressed → ~10GB uncompressed

2. **Test/Val files:** Small files (`.jsonl.gz`)
   - Contain ~100 papers each for validation
   - Used for testing metrics

### JSON Schema

Each line in the JSONL file contains a complete paper record:

```json
{
  "id": "199012281",
  "added": "2019-08-02T11:23:38.403Z",
  "created": "2019-06-01T00:00:00.000Z",
  "source": "s2",
  "version": "v3-fos",
  
  "metadata": {
    "year": 2019,
    "sha1": "14b9ee353b63ee37bdf84d45285021b9664afe2c",
    "provenance": "Computer Science-2019.gz:1",
    "s2fieldsofstudy": ["Computer Science"],
    "extfieldsofstudy": ["Physics", "Computer Science"]
  },
  
  "text": "Research on Neural Machine Translation Model\n\nIn neural machine translation...",
  
  "attributes": {
    "bff_duplicate_paragraph_spans_decontamination": [],
    "bff_contained_ngram_count": 0,
    "bff_duplicate_spans": []
  }
}
```

### Key Fields Explained

#### Essential Fields

- **`id`** (string): Unique paper identifier (Semantic Scholar paper ID)
- **`text`** (string): Full paper text including:
  - Title
  - Abstract
  - Full paper content (Introduction, Methods, Results, Conclusion, References)
  - This is the primary field for analysis
- **`metadata.year`** (int): Publication year (2009-2022)
- **`metadata.s2fieldsofstudy`** (array[string]): Primary field classification
  - Example: `["Computer Science"]`, `["Biology"]`
- **`metadata.extfieldsofstudy`** (array[string]): Extended/additional fields
  - Example: `["Physics", "Computer Science"]` (interdisciplinary paper)

#### Supporting Fields

- **`added`** (string): Date added to S2ORC database (ISO 8601 format)
- **`created`** (string): Publication date (ISO 8601 format)
- **`source`** (string): Data source (typically "s2" for Semantic Scholar)
- **`version`** (string): S2ORC version (e.g., "v3-fos")
- **`metadata.sha1`** (string): Content hash for deduplication
- **`metadata.provenance`** (string): Original file location

#### Quality/Deduplication Fields

- **`attributes.bff_duplicate_paragraph_spans_decontamination`** (array): Duplicate paragraph markers
- **`attributes.bff_contained_ngram_count`** (int): N-gram overlap count
- **`attributes.bff_duplicate_spans`** (array): Duplicate text spans

## Data Extraction Strategy

### What We Can Extract from the `text` Field

The `text` field contains the full paper and is our primary source for:

#### 1. **Citation Extraction**
- **References Section:** Parse citations from the References/Bibliography
- **In-Text Citations:** Extract `[1]`, `[2]`, or (Author, Year) style citations
- **Challenge:** Citations are in text format, not structured - requires parsing
- **Solution:** Use regex + NIM-based LLM to extract cited papers, match to paper IDs

#### 2. **ML Adoption Markers**
Keywords and phrases indicating ML technique usage:
- **Techniques:** "deep learning", "neural network", "transformer", "LSTM", "GAN", "reinforcement learning", "graph neural network", "CNN", "attention mechanism"
- **Frameworks:** "PyTorch", "TensorFlow", "Keras", "scikit-learn", "JAX"
- **Compute:** "GPU", "TPU", "CUDA", "distributed training", "supercomputer", "A100", "V100"
- **Pre-trained Models:** "BERT", "GPT", "ResNet", "AlphaFold", "ESM", "ProtBERT"

#### 3. **Reproducibility Indicators**
- **Code Availability:**
  - GitHub URLs: `github.com/username/repo`
  - "code available at", "source code", "implementation available"
  - "code upon request"
- **Data Availability:**
  - Dataset names: "ImageNet", "COCO", "PubChem", "Protein Data Bank"
  - Dataset URLs: `zenodo.org`, `figshare.com`, `kaggle.com`
  - "data available", "supplementary materials"
- **Reproducibility Statements:**
  - "reproducible", "replicable", "code and data available"
  - "random seed", "hyperparameters"

#### 4. **Methodology Identification**
- **Abstract:** First paragraph usually contains paper summary
- **Introduction:** Explains problem and approach
- **Methods Section:** Detailed methodology (often labeled "Methods", "Methodology", "Materials and Methods")
- **Results Section:** Experimental outcomes
- **Conclusion:** Summary and future work

#### 5. **Research Outcomes**
- **Experimental Results:** BLEU scores, accuracy metrics, speedup factors
- **Real-World Applications:** "clinical trial", "FDA approval", "patent", "deployed in production"
- **Comparisons:** "compared to baseline", "state-of-the-art", "outperforms"

### What We're Missing

**⚠️ Notable Limitations:**
- **Structured Citations:** No direct paper ID to cited paper ID mapping
  - Must parse references section text
  - Match author names + year to other paper IDs (fuzzy matching)
- **Author Information:** Not in this dataset structure
  - Would need to extract from text or use Semantic Scholar API
- **Citation Counts:** Not included, must build from graph
- **Abstract Field:** Not separated, must extract from text
- **DOI/ArXiv ID:** Not in schema (could extract from text)

## Processing Approach

### Phase 1: Data Loading (cuDF)

```python
import cudf

# Load compressed JSONL with GPU acceleration
df = cudf.read_json(
    'dataset/s2orc_data/ComputerScience,2019-2019/train/Computer Science-2019.gz-0000.json.gz',
    lines=True,
    compression='gzip'
)

# Extract nested metadata
df['year'] = df['metadata'].struct.field('year')
df['field'] = df['metadata'].struct.field('s2fieldsofstudy')
```

### Phase 2: Text Processing

```python
# Extract ML keywords (GPU-accelerated string operations)
ml_keywords = ['deep learning', 'neural network', 'transformer', 'GAN']
df['ml_keyword_count'] = 0
for keyword in ml_keywords:
    df['ml_keyword_count'] += df['text'].str.contains(keyword, case=False).astype(int)

# Extract GitHub URLs (regex on GPU)
df['github_url'] = df['text'].str.extract(r'(github\.com/[\w-]+/[\w-]+)')
df['has_code'] = df['github_url'].notna()
```

### Phase 3: Citation Extraction (Hybrid Approach)

```python
# Option 1: Regex for numbered citations [1], [2], etc.
citations_pattern = r'\[(\d+)\]'

# Option 2: NIM-based LLM for reference parsing
# Extract references section, parse with LLM to get cited paper info
# Match author + year to paper IDs in database

# Option 3: Semantic search
# Use FAISS to find similar papers that might be cited
```

### Phase 4: Graph Construction

```python
import cugraph

# Build edge list: source paper → cited papers
edges = cudf.DataFrame({
    'source': [paper_id1, paper_id1, paper_id2, ...],
    'target': [cited_id1, cited_id2, cited_id3, ...]
})

# Create directed graph
G = cugraph.Graph(directed=True)
G.from_cudf_edgelist(edges, source='source', destination='target')
```

## Estimated Dataset Statistics

### Paper Counts (Rough Estimates)

Based on sample analysis:
- **Computer Science 2019:** 61,617 papers
- **Biology 2020:** 149,329 papers
- **Total across all fields/years:** Likely **500K-1M papers** in this validation set

### Full Production Dataset

From the hackathon description:
- **Validation Set:** 81,000 papers (this dataset)
- **Production Set:** 20,000,000+ papers (HuggingFace link)
  - URL: https://huggingface.co/datasets/claran/modular-s2orc

## Key Insights for Implementation

### 1. Focus Fields
- **Computer Science (2009-2022):** ML methodology papers
  - Contains papers about deep learning, transformers, GANs, etc.
- **Biology (2016-2022):** Domain science adoption
  - Largest field, good for measuring ML impact
- **Chemistry, Physics, Materials Science:** Domain science

### 2. Temporal Coverage
- **2016-2024:** Primary analysis window (per hackathon)
- **2009-2015:** Historical baseline (some CS papers available)
- **2022:** Most recent complete year in dataset

### 3. Citation Challenges
- **No direct citation graph:** Must parse from text
- **Approach:**
  1. Extract references section using regex/LLM
  2. Parse author names + year
  3. Fuzzy match to paper IDs in dataset
  4. Build edge list for cuGraph

### 4. ML Detection Strategy
- **Tier 1 (Fast):** Keyword matching on GPU (cuDF string ops)
- **Tier 2 (Medium):** Classification model (cuML Random Forest)
- **Tier 3 (Slow but Accurate):** NIM-based LLM classification

### 5. Processing Order
1. **Start with Computer Science 2019-2021:** Identify ML methodology papers
2. **Process domain fields 2019-2021:** Find ML adoption
3. **Build citation graph:** Connect ML methods to domain papers
4. **Temporal analysis:** Compare 2016-2018 vs 2019-2022

## Data Quality Notes

### Strengths
✅ Full paper text (not just abstracts)
✅ Clean field classification
✅ Temporal organization (by year)
✅ Deduplication markers
✅ Compressed for storage efficiency

### Challenges
⚠️ No structured citations (must parse text)
⚠️ No author metadata in schema
⚠️ Variable text quality (some papers may be incomplete)
⚠️ Mixed fields (some papers span multiple disciplines)

## Next Steps for Implementation

1. **Load sample files:** Start with small validation sets (test/val) to prototype pipeline
2. **Build text parsers:** Extract citations, ML keywords, reproducibility markers
3. **Classify papers:** ML methodology vs domain science
4. **Build citation graph:** Parse references, create edge list
5. **Scale to full dataset:** Process all 66 field-year combinations
6. **Generate insights:** Run attribution scoring, acceleration metrics, reproducibility analysis

## Storage Requirements

- **Compressed:** 38 GB (current dataset)
- **Uncompressed:** ~200-300 GB (estimated)
- **Parquet (processed):** ~50-80 GB (estimated, with compression)
- **Graph (in-memory):** ~2-5 GB for 500K nodes (cuGraph GPU)
- **Embeddings:** ~1.5 GB (500K papers × 768 dims × 4 bytes)

**DGX Spark 128GB memory is more than sufficient for this validation dataset.**
