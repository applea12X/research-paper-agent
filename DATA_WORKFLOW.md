# Data Processing Workflow

This document explains how to process the research paper data from raw downloads to git-ready compressed files.

## Directory Structure

```
data/
├── [Field,Year-Year]/        # Original downloaded data (gitignored)
│   ├── train/
│   ├── test/
│   └── val/
├── papers/                    # Intermediate: all files consolidated (gitignored)
├── combined/                  # Intermediate: combined by category (gitignored)
└── combined_compressed/       # Final: compressed for git (tracked)
```

## Scripts

### 1. `cleanup_data.py` - Consolidate Files

Flattens the train/test/val directory structure and moves all JSON files to one location.

```bash
python3 cleanup_data.py
```

**What it does:**
- Finds all `.json`, `.json.gz`, and `.jsonl.gz` files
- Decompresses `.gz` files (optional)
- Renames files to include field, year, and split info
- Outputs to `data/papers/`

**Configuration:**
- `DECOMPRESS_GZ = True` - Set to False to keep files compressed
- `OUTPUT_DIR = Path("data/papers")` - Where to put consolidated files

---

### 2. `combine_categories.py` - Combine by Category

Combines all papers from the same field/category into single files.

```bash
python3 combine_categories.py
```

**What it does:**
- Reads all files from `data/papers/`
- Groups by category (Biology, Physics, etc.)
- Combines all papers from the same category
- Outputs to `data/combined/` as JSONL files
- Generates a summary report

**Configuration:**
- `INPUT_DIR = Path("data/papers")`
- `OUTPUT_DIR = Path("data/combined")`
- `OUTPUT_FORMAT = "jsonl"` - or "json" for single array
- `INCLUDE_METADATA = True` - Adds source file info to each paper

---

### 3. `zip_for_git.py` - Compress for Git

Compresses the combined category files for version control.

```bash
python3 zip_for_git.py
```

**What it does:**
- Compresses all files in `data/combined/`
- Uses gzip with maximum compression
- Outputs to `data/combined_compressed/`
- Creates README with usage instructions
- Shows compression statistics

**Configuration:**
- `COMPRESSION_LEVEL = 9` - 1-9, where 9 is maximum

---

## Complete Workflow

Run all three scripts in sequence:

```bash
# Step 1: Consolidate all files
python3 cleanup_data.py

# Step 2: Combine same categories
python3 combine_categories.py

# Step 3: Compress for git
python3 zip_for_git.py

# Step 4: Add to git
git add data/combined_compressed/
git commit -m "Add compressed research paper data"
```

## Git Configuration

The `.gitignore` file is configured to:
- ✅ Track `data/combined_compressed/` (compressed files only)
- ❌ Ignore `data/papers/` (intermediate files)
- ❌ Ignore `data/combined/` (uncompressed combined files)
- ❌ Ignore original `data/[Field,Year-Year]/` directories

## Reading Compressed Data

### Python

```python
import gzip
import json

# Read a compressed JSONL file
with gzip.open('data/combined_compressed/Biology.jsonl.gz', 'rt', encoding='utf-8') as f:
    for line in f:
        paper = json.loads(line)
        print(paper['title'])  # or whatever field you need
```

### Command Line

```bash
# Decompress a file
gunzip -k data/combined_compressed/Biology.jsonl.gz

# View first 10 papers without decompressing
zcat data/combined_compressed/Biology.jsonl.gz | head -10

# Count papers in a category
zcat data/combined_compressed/Biology.jsonl.gz | wc -l
```

## File Formats

### JSONL (JSON Lines)

Each line is a complete JSON object representing one paper:

```json
{"title": "Paper 1", "abstract": "...", "_source_file": "Biology_2022-2022_train_Biology-2022.json"}
{"title": "Paper 2", "abstract": "...", "_source_file": "Biology_2021-2021_train_Biology-2021.json"}
```

### Metadata Fields

If `INCLUDE_METADATA = True` in `combine_categories.py`, each paper includes:
- `_source_file` - Original filename the paper came from
- `_source_category` - Extracted category name

## Disk Space

- Original data: ~several GB (uncompressed)
- Combined data: ~reduced size (merged files)
- Compressed data: ~10-20% of original (depends on data)

Only the compressed data in `data/combined_compressed/` is pushed to git.
