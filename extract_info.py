#!/usr/bin/env python3
"""
Research Impact Information Extraction using Ollama

Extracts structured information from research papers for the AI Research Impact Observatory:
- Citation networks
- ML adoption markers (frameworks, compute resources, datasets)
- Reproducibility indicators (code/data availability, replication attempts)
- Research outcomes (retractions, corrections, clinical trials, patents)
- Impact metrics (citations, media coverage, policy influence)
"""

import json
import gzip
import time
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime
import requests
from tqdm import tqdm

# Configuration
INPUT_DIR = Path("data/combined_compressed")
OUTPUT_DIR = Path("data/extracted_impact")
OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_MODEL = "llama3.1:8b"  # Can use llama3.1, mistral, or other models
MAX_TEXT_LENGTH = 8000  # Limit text length for LLM processing
BATCH_SIZE = 10  # Process in batches
SAVE_INTERVAL = 50  # Save progress every N papers

# System role definition
SYSTEM_ROLE = """You are an expert academic analyst specializing in quantifying how machine learning (ML) contributes to scientific breakthroughs and discovery efficiency.

Your task is to measure ML's actual contribution to research outcomes with three key metrics:
1. Attribution Scoring: What % of the breakthrough comes from ML vs. domain insight?
2. Acceleration Metrics: Did ML speed discovery by months/years compared to traditional methods?
3. Efficiency Measures: Did ML reduce cost, time, or resources per discovery?

CRITICAL RULES:
- Be conservative and evidence-based; do not overstate ML importance
- Distinguish ML contribution from domain expertise contribution
- Look for explicit evidence of acceleration, cost reduction, or capability enabling
- If ML is mentioned but not central to outcomes, mark minimal impact
- Use precise academic language based on what the paper explicitly demonstrates"""

# User prompt template
USER_PROMPT = """Analyze how machine learning contributed to this research paper's outcomes.

Paper ID: {paper_id}
Year: {year}
Field: {field}

Paper Text (truncated if needed):
{text}

Extract the following information in valid JSON format:

{{
  "ml_impact_quantification": {{
    "has_ml_usage": true/false,
    "ml_contribution_level": "none|minimal|moderate|substantial|critical",

    "attribution_scoring": {{
      "ml_contribution_percent": 0-100,
      "domain_insight_percent": 0-100,
      "explanation": "Evidence-based explanation of ML vs domain contributions"
    }},

    "acceleration_metrics": {{
      "provides_acceleration": true/false,
      "estimated_speedup": "e.g., '6 months faster', '10x faster than traditional', 'enabled previously impossible task'",
      "comparison_baseline": "What method ML was compared against, if any",
      "evidence": "Specific claims from paper about speed/time improvements"
    }},

    "efficiency_measures": {{
      "improves_efficiency": true/false,
      "cost_reduction": "e.g., '$100K saved', '50% less compute', 'reduced from 1000 to 100 experiments'",
      "resource_optimization": "Types of resources saved (compute, labor, materials, etc.)",
      "evidence": "Specific efficiency claims from paper"
    }},

    "breakthrough_analysis": {{
      "enables_new_capability": true/false,
      "capability_description": "What became possible that wasn't before",
      "is_incremental_improvement": true/false,
      "impact_summary": "Overall assessment of ML's role in this research"
    }}
  }}
}}

Return ONLY valid JSON. Use null for unavailable information. Be conservative in scoring - only high scores if paper provides explicit evidence."""


def setup_output_dir():
    """Create output directory structure."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "progress").mkdir(exist_ok=True)
    print(f"✓ Output directory: {OUTPUT_DIR}")


def check_ollama_available():
    """Check if Ollama is running and the model is available."""
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        if response.status_code == 200:
            models = response.json().get('models', [])
            model_names = [m['name'] for m in models]
            print(f"✓ Ollama is running")
            print(f"  Available models: {', '.join(model_names)}")

            if not any(OLLAMA_MODEL in name for name in model_names):
                print(f"\n⚠️  Model '{OLLAMA_MODEL}' not found.")
                print(f"  Run: ollama pull {OLLAMA_MODEL}")
                return False
            return True
        return False
    except requests.exceptions.RequestException as e:
        print(f"✗ Ollama is not running or not accessible")
        print(f"  Start Ollama with: ollama serve")
        print(f"  Error: {e}")
        return False


def call_ollama(system_role: str, user_prompt: str, max_retries: int = 3) -> Optional[Dict]:
    """Call Ollama API to extract information with system and user roles."""
    for attempt in range(max_retries):
        try:
            response = requests.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "system": system_role,
                    "prompt": user_prompt,
                    "stream": False,
                    "format": "json",
                    "options": {
                        "temperature": 0.1,  # Low temperature for more consistent extraction
                        "num_predict": 2000  # Max tokens for response
                    }
                },
                timeout=120
            )

            if response.status_code == 200:
                result = response.json()
                response_text = result.get('response', '{}')

                # Try to parse JSON response
                try:
                    extracted_data = json.loads(response_text)
                    return extracted_data
                except json.JSONDecodeError as e:
                    print(f"  ⚠️  JSON parse error (attempt {attempt + 1}): {e}")
                    # Try to extract JSON from response
                    import re
                    json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                    if json_match:
                        try:
                            extracted_data = json.loads(json_match.group())
                            return extracted_data
                        except:
                            pass

                    if attempt == max_retries - 1:
                        return None
            else:
                print(f"  ⚠️  Ollama API error (attempt {attempt + 1}): {response.status_code}")

        except requests.exceptions.Timeout:
            print(f"  ⚠️  Timeout (attempt {attempt + 1})")
        except Exception as e:
            print(f"  ⚠️  Error (attempt {attempt + 1}): {e}")

        if attempt < max_retries - 1:
            time.sleep(2 ** attempt)  # Exponential backoff

    return None


def truncate_text(text: str, max_length: int = MAX_TEXT_LENGTH) -> str:
    """Truncate text to max length, trying to preserve important sections."""
    if len(text) <= max_length:
        return text

    # Try to get introduction, methods, and conclusion
    sections = []

    # Look for common section markers
    intro_markers = ['introduction', 'abstract', 'background']
    method_markers = ['method', 'approach', 'algorithm', 'model']
    result_markers = ['result', 'experiment', 'evaluation']
    conclusion_markers = ['conclusion', 'discussion', 'future work']

    text_lower = text.lower()

    # Try to find key sections
    parts = []
    for marker in intro_markers + method_markers + result_markers + conclusion_markers:
        idx = text_lower.find(marker)
        if idx != -1:
            # Get section starting from marker
            section_start = max(0, idx - 50)
            section_end = min(len(text), idx + 1500)
            parts.append(text[section_start:section_end])

    if parts:
        combined = "\n...\n".join(parts)
        if len(combined) <= max_length:
            return combined
        return combined[:max_length] + "..."

    # Fallback: take beginning and end
    chunk_size = max_length // 2
    return text[:chunk_size] + "\n...\n" + text[-chunk_size:]


def extract_paper_info(paper: Dict, category: str) -> Optional[Dict]:
    """Extract impact information from a single paper."""
    paper_id = paper.get('id', 'unknown')
    text = paper.get('text', '')
    metadata = paper.get('metadata', {})
    year = metadata.get('year', 'unknown')

    # Truncate text if needed
    truncated_text = truncate_text(text)

    # Build user prompt
    user_prompt = USER_PROMPT.format(
        paper_id=paper_id,
        year=year,
        field=category,
        text=truncated_text
    )

    # Call Ollama with system role and user prompt
    extracted = call_ollama(SYSTEM_ROLE, user_prompt)

    if extracted:
        # Add metadata
        extracted['_paper_id'] = paper_id
        extracted['_year'] = year
        extracted['_category'] = category
        extracted['_source_file'] = paper.get('_source_file', '')
        extracted['_extraction_timestamp'] = datetime.utcnow().isoformat()

        return extracted

    return None


def process_category_file(category_file: Path, category: str):
    """Process all papers in a category file."""
    print(f"\n{'='*60}")
    print(f"Processing: {category}")
    print(f"{'='*60}")

    # Output files
    output_file = OUTPUT_DIR / f"{category}_impact.jsonl"
    progress_file = OUTPUT_DIR / "progress" / f"{category}_progress.json"

    # Load progress if exists
    processed_ids = set()
    if progress_file.exists():
        with open(progress_file, 'r') as f:
            progress_data = json.load(f)
            processed_ids = set(progress_data.get('processed_ids', []))
            print(f"  ✓ Resuming from {len(processed_ids)} processed papers")

    # Count total papers
    print(f"  Counting papers...")
    total_papers = 0
    with gzip.open(category_file, 'rt', encoding='utf-8') as f:
        for _ in f:
            total_papers += 1

    print(f"  Total papers: {total_papers:,}")
    print(f"  Remaining: {total_papers - len(processed_ids):,}")

    # Process papers
    papers_processed = 0
    papers_success = 0
    papers_failed = 0

    # Open output file in append mode
    output_mode = 'a' if output_file.exists() else 'w'

    with gzip.open(category_file, 'rt', encoding='utf-8') as f:
        with open(output_file, output_mode, encoding='utf-8') as out_f:

            for line in tqdm(f, total=total_papers, desc=f"  {category}"):
                try:
                    paper = json.loads(line)
                    paper_id = paper.get('id', 'unknown')

                    # Skip if already processed
                    if paper_id in processed_ids:
                        continue

                    # Extract information
                    extracted = extract_paper_info(paper, category)

                    if extracted:
                        # Write to output
                        out_f.write(json.dumps(extracted, ensure_ascii=False) + '\n')
                        out_f.flush()
                        papers_success += 1
                    else:
                        papers_failed += 1

                    # Mark as processed
                    processed_ids.add(paper_id)
                    papers_processed += 1

                    # Save progress periodically
                    if papers_processed % SAVE_INTERVAL == 0:
                        with open(progress_file, 'w') as pf:
                            json.dump({
                                'processed_ids': list(processed_ids),
                                'papers_processed': papers_processed,
                                'papers_success': papers_success,
                                'papers_failed': papers_failed,
                                'last_update': datetime.utcnow().isoformat()
                            }, pf)

                    # Small delay to avoid overwhelming Ollama
                    time.sleep(0.1)

                except json.JSONDecodeError:
                    continue
                except KeyboardInterrupt:
                    print(f"\n\n⚠️  Interrupted by user")
                    # Save progress
                    with open(progress_file, 'w') as pf:
                        json.dump({
                            'processed_ids': list(processed_ids),
                            'papers_processed': papers_processed,
                            'papers_success': papers_success,
                            'papers_failed': papers_failed,
                            'last_update': datetime.utcnow().isoformat()
                        }, pf)
                    raise
                except Exception as e:
                    print(f"  ✗ Error processing paper {paper_id}: {e}")
                    papers_failed += 1

    # Final progress save
    with open(progress_file, 'w') as pf:
        json.dump({
            'processed_ids': list(processed_ids),
            'papers_processed': papers_processed,
            'papers_success': papers_success,
            'papers_failed': papers_failed,
            'last_update': datetime.utcnow().isoformat(),
            'completed': True
        }, pf)

    # Print summary
    print(f"\n  Summary for {category}:")
    print(f"    ✓ Successfully extracted: {papers_success:,}")
    print(f"    ✗ Failed: {papers_failed:,}")
    print(f"    → Output: {output_file}")


def generate_extraction_summary():
    """Generate summary of all extractions."""
    summary_file = OUTPUT_DIR / "extraction_summary.json"

    summary = {
        'extraction_date': datetime.utcnow().isoformat(),
        'categories': {},
        'total_papers_extracted': 0,
        'model_used': OLLAMA_MODEL
    }

    for progress_file in (OUTPUT_DIR / "progress").glob("*_progress.json"):
        with open(progress_file, 'r') as f:
            progress = json.load(f)
            category = progress_file.stem.replace('_progress', '')
            summary['categories'][category] = {
                'papers_processed': progress.get('papers_processed', 0),
                'papers_success': progress.get('papers_success', 0),
                'papers_failed': progress.get('papers_failed', 0),
                'completed': progress.get('completed', False)
            }
            summary['total_papers_extracted'] += progress.get('papers_success', 0)

    with open(summary_file, 'w') as f:
        json.dump(summary, f, indent=2)

    print(f"\n✓ Summary written to {summary_file}")
    return summary


def main():
    print("=" * 60)
    print("Research Impact Information Extraction")
    print("=" * 60)

    # Setup
    setup_output_dir()

    # Check Ollama
    if not check_ollama_available():
        print("\n❌ Please start Ollama and ensure the model is available")
        print(f"   1. Start Ollama: ollama serve")
        print(f"   2. Pull model: ollama pull {OLLAMA_MODEL}")
        return

    # Find category files
    category_files = list(INPUT_DIR.glob("*.jsonl.gz"))

    if not category_files:
        print(f"\n✗ No category files found in {INPUT_DIR}")
        print(f"  Run combine_categories.py first")
        return

    print(f"\n✓ Found {len(category_files)} category files")

    # Ask which categories to process
    print("\nCategories:")
    for i, f in enumerate(category_files, 1):
        print(f"  {i}. {f.stem}")

    print("\nOptions:")
    print("  - Enter numbers (e.g., '1,2,3') to process specific categories")
    print("  - Enter 'all' to process all categories")
    print("  - Enter 'q' to quit")

    choice = input("\nYour choice: ").strip()

    if choice.lower() == 'q':
        return

    selected_files = []
    if choice.lower() == 'all':
        selected_files = category_files
    else:
        try:
            indices = [int(x.strip()) - 1 for x in choice.split(',')]
            selected_files = [category_files[i] for i in indices if 0 <= i < len(category_files)]
        except:
            print("Invalid input")
            return

    if not selected_files:
        print("No files selected")
        return

    # Process each category
    print(f"\n{'='*60}")
    print(f"Processing {len(selected_files)} categories")
    print(f"{'='*60}")

    start_time = time.time()

    try:
        for category_file in selected_files:
            category = category_file.stem
            process_category_file(category_file, category)
    except KeyboardInterrupt:
        print("\n\n⚠️  Extraction interrupted by user")

    # Generate summary
    summary = generate_extraction_summary()

    # Print final summary
    elapsed = time.time() - start_time
    print(f"\n{'='*60}")
    print("Extraction Complete")
    print(f"{'='*60}")
    print(f"  Total papers extracted: {summary['total_papers_extracted']:,}")
    print(f"  Time elapsed: {elapsed/60:.1f} minutes")
    print(f"  Output directory: {OUTPUT_DIR}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
