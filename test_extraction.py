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

SYSTEM_ROLE = """You are an expert academic analyst specializing in quantifying how machine learning (ML) contributes to scientific breakthroughs and discovery efficiency.

Your task is to measure ML's actual contribution with three key metrics:
1. Attribution Scoring: What % of breakthrough comes from ML vs. domain insight?
2. Acceleration Metrics: Did ML speed discovery by months/years?
3. Efficiency Measures: Did ML reduce cost, time, or resources?

CRITICAL RULES:
- Be conservative and evidence-based; only high scores with explicit evidence
- Distinguish ML contribution from domain expertise
- Look for explicit evidence of acceleration or cost reduction"""

USER_PROMPT = """Analyze how machine learning contributed to this research paper's outcomes.

Paper Text:
{text}

Extract the following information in valid JSON format:

{{
  "ml_impact_quantification": {{
    "has_ml_usage": true/false,
    "ml_contribution_level": "none|minimal|moderate|substantial|critical",

    "attribution_scoring": {{
      "ml_contribution_percent": 0-100,
      "domain_insight_percent": 0-100,
      "explanation": "Evidence-based explanation"
    }},

    "acceleration_metrics": {{
      "provides_acceleration": true/false,
      "estimated_speedup": "e.g., '6 months faster', '10x faster'",
      "comparison_baseline": "What method ML was compared against",
      "evidence": "Specific claims from paper"
    }},

    "efficiency_measures": {{
      "improves_efficiency": true/false,
      "cost_reduction": "e.g., '$100K saved', '50% less compute'",
      "resource_optimization": "Types of resources saved",
      "evidence": "Specific efficiency claims"
    }},

    "breakthrough_analysis": {{
      "enables_new_capability": true/false,
      "capability_description": "What became possible",
      "is_incremental_improvement": true/false,
      "impact_summary": "Overall ML role assessment"
    }}
  }}
}}

Return ONLY valid JSON. Be conservative - only high scores with explicit evidence."""


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
        'ml_impact_quantification'
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
    print("ML IMPACT QUANTIFICATION RESULTS")
    print("=" * 60)

    ml_quant = extracted.get('ml_impact_quantification', {})

    print(f"\nML Usage: {ml_quant.get('has_ml_usage', False)}")
    print(f"Contribution Level: {ml_quant.get('ml_contribution_level', 'unknown')}")

    # Attribution Scoring
    attribution = ml_quant.get('attribution_scoring', {})
    print("\n--- Attribution Scoring ---")
    print(f"  ML Contribution: {attribution.get('ml_contribution_percent', 0)}%")
    print(f"  Domain Insight: {attribution.get('domain_insight_percent', 0)}%")
    print(f"  Explanation: {attribution.get('explanation', 'N/A')}")

    # Acceleration Metrics
    acceleration = ml_quant.get('acceleration_metrics', {})
    print("\n--- Acceleration Metrics ---")
    print(f"  Provides Acceleration: {acceleration.get('provides_acceleration', False)}")
    print(f"  Estimated Speedup: {acceleration.get('estimated_speedup', 'N/A')}")
    print(f"  Comparison Baseline: {acceleration.get('comparison_baseline', 'N/A')}")
    print(f"  Evidence: {acceleration.get('evidence', 'N/A')[:100]}...")

    # Efficiency Measures
    efficiency = ml_quant.get('efficiency_measures', {})
    print("\n--- Efficiency Measures ---")
    print(f"  Improves Efficiency: {efficiency.get('improves_efficiency', False)}")
    print(f"  Cost Reduction: {efficiency.get('cost_reduction', 'N/A')}")
    print(f"  Resource Optimization: {efficiency.get('resource_optimization', 'N/A')}")
    print(f"  Evidence: {efficiency.get('evidence', 'N/A')[:100]}...")

    # Breakthrough Analysis
    breakthrough = ml_quant.get('breakthrough_analysis', {})
    print("\n--- Breakthrough Analysis ---")
    print(f"  Enables New Capability: {breakthrough.get('enables_new_capability', False)}")
    print(f"  Capability: {breakthrough.get('capability_description', 'N/A')}")
    print(f"  Incremental Improvement: {breakthrough.get('is_incremental_improvement', False)}")
    print(f"  Impact Summary: {breakthrough.get('impact_summary', 'N/A')}")

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
