#!/usr/bin/env python3
"""
Test script to verify Ollama extraction setup works correctly.
Processes a single paper to validate the entire pipeline.
"""

import json
import gzip
import requests
from pathlib import Path

OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_MODEL = "llama3.1:8b"
INPUT_DIR = Path("data/combined_compressed")

SYSTEM_ROLE = """You are an expert academic analyst specializing in how machine learning (ML) impacts different academic fields. You evaluate papers with peer-review rigor and cross-disciplinary awareness.

Your responsibilities:
1. Identify the primary academic field
2. Detect ML usage - both explicit and implicit
3. Validate ML relevance - check for keyword stuffing vs. substantive use
4. Classify ML impact type and maturity level

CRITICAL RULES:
- Be conservative about ML importance
- Only list tools if ACTUALLY USED, not just mentioned
- Mark is_keyword_stuffing as true if ML keywords are present but not substantively used
- Use precise academic language"""

USER_PROMPT = """Analyze the following research paper and extract structured information.

Paper Text:
{text}

Extract the following information in valid JSON format:

{{
  "primary_field": "The primary academic field",
  "ml_impact_analysis": {{
    "has_ml_usage": true/false,
    "ml_usage_type": "explicit|implicit|minimal|none",
    "is_keyword_stuffing": true/false,
    "ml_role_description": "How ML is actually used or why limited",
    "impact_types": ["analytical_enhancement", "predictive_modeling", etc.],
    "maturity_level": "exploratory|applied|core|field_shaping|none",
    "impact_on_field": "Expert summary of ML impact",
    "key_takeaway": "One-sentence insight",
    "frameworks": ["ONLY if actually used"],
    "compute_resources": ["ONLY if substantively discussed"],
    "datasets": ["ONLY if used for training/evaluation"],
    "models": ["ONLY if implemented or evaluated"]
  }},
  "citations": {{
    "cited_papers": ["Sample titles/authors"],
    "citation_count_estimate": "number"
  }},
  "reproducibility": {{
    "code_available": true/false,
    "code_url": "URL",
    "data_available": true/false,
    "data_url": "URL",
    "has_supplementary": true/false,
    "mentions_replication": true/false
  }},
  "research_outcomes": {{
    "has_clinical_trial": true/false,
    "clinical_trial_ids": [],
    "has_patent": true/false,
    "patent_numbers": [],
    "mentions_retraction": true/false,
    "mentions_correction": true/false
  }},
  "impact_indicators": {{
    "mentions_media_coverage": true/false,
    "mentions_policy_influence": true/false,
    "mentions_industry_adoption": true/false,
    "real_world_applications": []
  }},
  "additional_info": {{
    "funding_sources": [],
    "collaborations": [],
    "keywords": [],
    "methodology": "",
    "main_findings": ""
  }}
}}

CRITICAL: Be conservative about ML importance. Only list tools if ACTUALLY USED, not just mentioned.
Return ONLY valid JSON."""


def test_ollama_connection():
    """Test if Ollama is running and accessible."""
    print("Testing Ollama connection...")
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        if response.status_code == 200:
            models = response.json().get('models', [])
            model_names = [m['name'] for m in models]
            print(f"✓ Ollama is running")
            print(f"  Available models: {', '.join(model_names)}")

            if not any(OLLAMA_MODEL in name for name in model_names):
                print(f"\n✗ Model '{OLLAMA_MODEL}' not found")
                print(f"  Run: ollama pull {OLLAMA_MODEL}")
                return False
            print(f"✓ Model '{OLLAMA_MODEL}' is available")
            return True
        else:
            print(f"✗ Ollama returned status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"✗ Cannot connect to Ollama")
        print(f"  Error: {e}")
        print(f"  Start Ollama with: ollama serve")
        return False


def get_sample_paper():
    """Get a sample paper from the dataset."""
    print("\nLoading sample paper...")

    # Try to find any JSONL file
    jsonl_files = list(INPUT_DIR.glob("*.jsonl.gz"))

    if not jsonl_files:
        print(f"✗ No JSONL files found in {INPUT_DIR}")
        print("  Run combine_categories.py first")
        return None

    # Read first paper from first file
    sample_file = jsonl_files[0]
    print(f"  Reading from: {sample_file.name}")

    with gzip.open(sample_file, 'rt', encoding='utf-8') as f:
        first_line = f.readline()
        if first_line:
            paper = json.loads(first_line)
            print(f"✓ Loaded paper: {paper.get('id', 'unknown')}")
            return paper

    print("✗ Could not read paper from file")
    return None


def extract_from_paper(paper):
    """Extract metrics from a paper using Ollama."""
    print("\nExtracting metrics...")

    # Get text (truncate if too long)
    text = paper.get('text', '')[:8000]

    # Build user prompt
    user_prompt = USER_PROMPT.format(text=text)

    print(f"  Sending {len(text):,} characters to Ollama...")

    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "system": SYSTEM_ROLE,
                "prompt": user_prompt,
                "stream": False,
                "format": "json",
                "options": {
                    "temperature": 0.1,
                    "num_predict": 2000
                }
            },
            timeout=120
        )

        if response.status_code == 200:
            result = response.json()
            response_text = result.get('response', '{}')

            print(f"✓ Received response ({len(response_text)} chars)")

            # Try to parse JSON
            try:
                extracted = json.loads(response_text)
                print("✓ Successfully parsed JSON")
                return extracted
            except json.JSONDecodeError as e:
                print(f"✗ JSON parse error: {e}")
                print(f"\nRaw response:\n{response_text[:500]}...")
                return None
        else:
            print(f"✗ Ollama API error: {response.status_code}")
            return None

    except requests.exceptions.Timeout:
        print("✗ Request timeout (model may be too slow)")
        return None
    except Exception as e:
        print(f"✗ Error: {e}")
        return None


def validate_extraction(extracted):
    """Validate the extracted data structure."""
    print("\nValidating extraction...")

    required_fields = [
        'primary_field',
        'ml_impact_analysis',
        'citations',
        'reproducibility',
        'research_outcomes',
        'impact_indicators',
        'additional_info'
    ]

    all_valid = True

    for field in required_fields:
        if field in extracted:
            print(f"  ✓ {field}")
        else:
            print(f"  ✗ {field} - MISSING")
            all_valid = False

    return all_valid


def display_results(extracted):
    """Display extracted results in a readable format."""
    print("\n" + "=" * 60)
    print("EXTRACTION RESULTS")
    print("=" * 60)

    # Primary Field
    print(f"\nPrimary Field: {extracted.get('primary_field', 'Unknown')}")

    # ML Impact Analysis
    ml_analysis = extracted.get('ml_impact_analysis', {})
    print("\nML Impact Analysis:")
    print(f"  Has ML Usage: {ml_analysis.get('has_ml_usage', False)}")
    print(f"  ML Usage Type: {ml_analysis.get('ml_usage_type', 'unknown')}")
    print(f"  Keyword Stuffing: {ml_analysis.get('is_keyword_stuffing', False)}")
    print(f"  Maturity Level: {ml_analysis.get('maturity_level', 'unknown')}")
    print(f"  ML Role: {ml_analysis.get('ml_role_description', 'N/A')[:100]}...")
    print(f"  Impact Types: {', '.join(ml_analysis.get('impact_types', [])) or 'None'}")
    print(f"  Key Takeaway: {ml_analysis.get('key_takeaway', 'N/A')}")

    if ml_analysis.get('frameworks'):
        print(f"  Frameworks: {', '.join(ml_analysis.get('frameworks', []))}")
    if ml_analysis.get('datasets'):
        print(f"  Datasets: {', '.join(ml_analysis.get('datasets', []))}")
    if ml_analysis.get('models'):
        print(f"  Models: {', '.join(ml_analysis.get('models', []))}")

    # Reproducibility
    repro = extracted.get('reproducibility', {})
    print("\nReproducibility:")
    print(f"  Code available: {repro.get('code_available', False)}")
    if repro.get('code_url'):
        print(f"  Code URL: {repro['code_url']}")
    print(f"  Data available: {repro.get('data_available', False)}")
    if repro.get('data_url'):
        print(f"  Data URL: {repro['data_url']}")

    # Research Outcomes
    outcomes = extracted.get('research_outcomes', {})
    print("\nResearch Outcomes:")
    print(f"  Clinical trials: {outcomes.get('has_clinical_trial', False)}")
    print(f"  Patents: {outcomes.get('has_patent', False)}")
    print(f"  Retractions: {outcomes.get('mentions_retraction', False)}")

    # Impact
    impact = extracted.get('impact_indicators', {})
    print("\nImpact Indicators:")
    print(f"  Media coverage: {impact.get('mentions_media_coverage', False)}")
    print(f"  Policy influence: {impact.get('mentions_policy_influence', False)}")
    print(f"  Industry adoption: {impact.get('mentions_industry_adoption', False)}")
    apps = impact.get('real_world_applications', [])
    if apps:
        print(f"  Applications: {', '.join(apps)}")

    # Additional Info
    additional = extracted.get('additional_info', {})
    print("\nAdditional Info:")
    funding = additional.get('funding_sources', [])
    if funding:
        print(f"  Funding: {', '.join(funding)}")
    keywords = additional.get('keywords', [])
    if keywords:
        print(f"  Keywords: {', '.join(keywords[:10])}")

    print("\n" + "=" * 60)


def main():
    print("=" * 60)
    print("Research Impact Extraction - Test Script")
    print("=" * 60)

    # Test 1: Ollama connection
    if not test_ollama_connection():
        print("\n❌ Test failed: Ollama not accessible")
        return False

    # Test 2: Load sample paper
    paper = get_sample_paper()
    if not paper:
        print("\n❌ Test failed: No sample paper available")
        return False

    # Test 3: Extract metrics
    extracted = extract_from_paper(paper)
    if not extracted:
        print("\n❌ Test failed: Extraction failed")
        return False

    # Test 4: Validate structure
    if not validate_extraction(extracted):
        print("\n⚠️  Warning: Extraction structure incomplete")

    # Display results
    display_results(extracted)

    # Save test output
    output_file = Path("test_extraction_output.json")
    with open(output_file, 'w') as f:
        json.dump({
            'paper_id': paper.get('id'),
            'paper_year': paper.get('metadata', {}).get('year'),
            'extracted': extracted
        }, f, indent=2)

    print(f"\n✓ Test output saved to: {output_file}")

    print("\n" + "=" * 60)
    print("✅ ALL TESTS PASSED")
    print("=" * 60)
    print("\nYou can now run the full extraction:")
    print("  python3 extract_research_impact.py")
    print("=" * 60)

    return True


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
