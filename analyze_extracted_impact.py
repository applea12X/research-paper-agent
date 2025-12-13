#!/usr/bin/env python3
"""
Analyze extracted research impact data and generate insights.

Creates aggregated statistics and visualizations from the extracted impact metrics.
"""

import json
from pathlib import Path
from collections import defaultdict, Counter
from typing import Dict, List
import csv

# Configuration
INPUT_DIR = Path("data/extracted_impact")
OUTPUT_DIR = Path("data/analysis")


def setup_output_dir():
    """Create output directory."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"✓ Output directory: {OUTPUT_DIR}")


def load_extracted_data(category: str) -> List[Dict]:
    """Load extracted impact data for a category."""
    input_file = INPUT_DIR / f"{category}_impact.jsonl"

    if not input_file.exists():
        return []

    papers = []
    with open(input_file, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                try:
                    papers.append(json.loads(line))
                except json.JSONDecodeError:
                    continue

    return papers


def analyze_ml_impact_quantification(papers: List[Dict]) -> Dict:
    """Analyze ML impact quantification across papers."""
    contribution_levels = Counter()

    papers_with_ml = 0
    papers_with_acceleration = 0
    papers_with_efficiency = 0
    papers_with_new_capability = 0

    attribution_scores = []

    for paper in papers:
        ml_quant = paper.get('ml_impact_quantification', {})

        if ml_quant.get('has_ml_usage'):
            papers_with_ml += 1

        level = ml_quant.get('ml_contribution_level', 'none')
        contribution_levels[level] += 1

        # Attribution scoring
        attribution = ml_quant.get('attribution_scoring', {})
        ml_percent = attribution.get('ml_contribution_percent')
        if ml_percent is not None:
            attribution_scores.append(ml_percent)

        # Acceleration metrics
        acceleration = ml_quant.get('acceleration_metrics', {})
        if acceleration.get('provides_acceleration'):
            papers_with_acceleration += 1

        # Efficiency measures
        efficiency = ml_quant.get('efficiency_measures', {})
        if efficiency.get('improves_efficiency'):
            papers_with_efficiency += 1

        # Breakthrough analysis
        breakthrough = ml_quant.get('breakthrough_analysis', {})
        if breakthrough.get('enables_new_capability'):
            papers_with_new_capability += 1

    total = len(papers)

    return {
        'total_papers': total,
        'papers_with_ml_usage': papers_with_ml,
        'ml_usage_rate': papers_with_ml / total if total else 0,
        'contribution_level_distribution': dict(contribution_levels.most_common()),
        'papers_with_acceleration': papers_with_acceleration,
        'acceleration_rate': papers_with_acceleration / total if total else 0,
        'papers_with_efficiency': papers_with_efficiency,
        'efficiency_rate': papers_with_efficiency / total if total else 0,
        'papers_with_new_capability': papers_with_new_capability,
        'new_capability_rate': papers_with_new_capability / total if total else 0,
        'average_ml_attribution': sum(attribution_scores) / len(attribution_scores) if attribution_scores else 0,
        'attribution_scores_count': len(attribution_scores)
    }


def analyze_reproducibility(papers: List[Dict]) -> Dict:
    """Analyze reproducibility indicators."""
    code_available = 0
    data_available = 0
    has_supplementary = 0
    mentions_replication = 0
    code_urls = []
    data_urls = []

    for paper in papers:
        repro = paper.get('reproducibility', {})

        if repro.get('code_available'):
            code_available += 1
            if repro.get('code_url'):
                code_urls.append(repro['code_url'])

        if repro.get('data_available'):
            data_available += 1
            if repro.get('data_url'):
                data_urls.append(repro['data_url'])

        if repro.get('has_supplementary'):
            has_supplementary += 1

        if repro.get('mentions_replication'):
            mentions_replication += 1

    total = len(papers)

    return {
        'code_availability_rate': code_available / total if total else 0,
        'data_availability_rate': data_available / total if total else 0,
        'supplementary_rate': has_supplementary / total if total else 0,
        'replication_mention_rate': mentions_replication / total if total else 0,
        'papers_with_code': code_available,
        'papers_with_data': data_available,
        'papers_with_supplementary': has_supplementary,
        'papers_mentioning_replication': mentions_replication,
        'total_papers': total,
        'code_urls_found': len(code_urls),
        'data_urls_found': len(data_urls)
    }


def analyze_research_outcomes(papers: List[Dict]) -> Dict:
    """Analyze research outcomes."""
    clinical_trials = 0
    patents = 0
    retractions = 0
    corrections = 0
    clinical_trial_ids = []
    patent_numbers = []

    for paper in papers:
        outcomes = paper.get('research_outcomes', {})

        if outcomes.get('has_clinical_trial'):
            clinical_trials += 1
            trial_ids = outcomes.get('clinical_trial_ids', [])
            clinical_trial_ids.extend([tid for tid in trial_ids if tid])

        if outcomes.get('has_patent'):
            patents += 1
            pat_nums = outcomes.get('patent_numbers', [])
            patent_numbers.extend([pn for pn in pat_nums if pn])

        if outcomes.get('mentions_retraction'):
            retractions += 1

        if outcomes.get('mentions_correction'):
            corrections += 1

    total = len(papers)

    return {
        'clinical_trial_rate': clinical_trials / total if total else 0,
        'patent_rate': patents / total if total else 0,
        'retraction_rate': retractions / total if total else 0,
        'correction_rate': corrections / total if total else 0,
        'papers_with_clinical_trials': clinical_trials,
        'papers_with_patents': patents,
        'papers_with_retractions': retractions,
        'papers_with_corrections': corrections,
        'total_papers': total,
        'clinical_trial_ids_found': len(clinical_trial_ids),
        'patent_numbers_found': len(patent_numbers)
    }


def analyze_impact_indicators(papers: List[Dict]) -> Dict:
    """Analyze impact indicators."""
    media_coverage = 0
    policy_influence = 0
    industry_adoption = 0
    real_world_apps = Counter()

    for paper in papers:
        impact = paper.get('impact_indicators', {})

        if impact.get('mentions_media_coverage'):
            media_coverage += 1

        if impact.get('mentions_policy_influence'):
            policy_influence += 1

        if impact.get('mentions_industry_adoption'):
            industry_adoption += 1

        for app in impact.get('real_world_applications', []):
            if app:
                real_world_apps[app] += 1

    total = len(papers)

    return {
        'media_coverage_rate': media_coverage / total if total else 0,
        'policy_influence_rate': policy_influence / total if total else 0,
        'industry_adoption_rate': industry_adoption / total if total else 0,
        'papers_with_media_coverage': media_coverage,
        'papers_with_policy_influence': policy_influence,
        'papers_with_industry_adoption': industry_adoption,
        'top_real_world_applications': dict(real_world_apps.most_common(20)),
        'total_papers': total
    }


def analyze_additional_info(papers: List[Dict]) -> Dict:
    """Analyze additional information."""
    funding_sources = Counter()
    collaborations = Counter()
    keywords = Counter()

    for paper in papers:
        additional = paper.get('additional_info', {})

        for funding in additional.get('funding_sources', []):
            if funding:
                funding_sources[funding] += 1

        for collab in additional.get('collaborations', []):
            if collab:
                collaborations[collab] += 1

        for keyword in additional.get('keywords', []):
            if keyword:
                keywords[keyword] += 1

    return {
        'top_funding_sources': dict(funding_sources.most_common(20)),
        'top_collaborations': dict(collaborations.most_common(20)),
        'top_keywords': dict(keywords.most_common(50)),
        'total_papers': len(papers)
    }


def analyze_temporal_trends(papers: List[Dict]) -> Dict:
    """Analyze trends over time."""
    by_year = defaultdict(lambda: {
        'count': 0,
        'code_available': 0,
        'data_available': 0,
        'ml_adoption': 0,
        'clinical_trials': 0,
        'patents': 0
    })

    for paper in papers:
        year = paper.get('_year', 'unknown')

        if year != 'unknown':
            by_year[year]['count'] += 1

            if paper.get('reproducibility', {}).get('code_available'):
                by_year[year]['code_available'] += 1

            if paper.get('reproducibility', {}).get('data_available'):
                by_year[year]['data_available'] += 1

            if paper.get('ml_adoption', {}).get('frameworks'):
                by_year[year]['ml_adoption'] += 1

            if paper.get('research_outcomes', {}).get('has_clinical_trial'):
                by_year[year]['clinical_trials'] += 1

            if paper.get('research_outcomes', {}).get('has_patent'):
                by_year[year]['patents'] += 1

    return dict(sorted(by_year.items()))


def analyze_category(category: str) -> Dict:
    """Comprehensive analysis of a category."""
    print(f"\nAnalyzing {category}...")

    papers = load_extracted_data(category)

    if not papers:
        print(f"  No data found for {category}")
        return None

    print(f"  Loaded {len(papers):,} papers")

    analysis = {
        'category': category,
        'total_papers': len(papers),
        'ml_impact_quantification': analyze_ml_impact_quantification(papers)
    }

    return analysis


def generate_category_report(analysis: Dict, output_file: Path):
    """Generate a detailed report for a category."""
    category = analysis['category']

    with open(output_file, 'w') as f:
        f.write(f"# ML Impact Quantification Report: {category}\n\n")
        f.write(f"Total Papers Analyzed: {analysis['total_papers']:,}\n\n")

        ml_quant = analysis['ml_impact_quantification']

        # ML Usage Overview
        f.write("## ML Usage Overview\n\n")
        f.write(f"- Papers with ML usage: {ml_quant['papers_with_ml_usage']:,} ")
        f.write(f"({ml_quant['ml_usage_rate']:.1%})\n\n")

        # Contribution Levels
        f.write("### ML Contribution Level Distribution\n\n")
        for level, count in ml_quant['contribution_level_distribution'].items():
            f.write(f"- {level}: {count:,} papers\n")
        f.write("\n")

        # Attribution Scoring
        f.write("## Attribution Scoring\n\n")
        f.write(f"- Average ML Attribution: {ml_quant['average_ml_attribution']:.1f}%\n")
        f.write(f"- Papers with Attribution Scores: {ml_quant['attribution_scores_count']:,}\n\n")

        # Acceleration Metrics
        f.write("## Acceleration Metrics\n\n")
        f.write(f"- Papers with Acceleration: {ml_quant['papers_with_acceleration']:,} ")
        f.write(f"({ml_quant['acceleration_rate']:.1%})\n\n")

        # Efficiency Measures
        f.write("## Efficiency Measures\n\n")
        f.write(f"- Papers with Efficiency Improvements: {ml_quant['papers_with_efficiency']:,} ")
        f.write(f"({ml_quant['efficiency_rate']:.1%})\n\n")

        # Breakthrough Analysis
        f.write("## Breakthrough Analysis\n\n")
        f.write(f"- Papers Enabling New Capabilities: {ml_quant['papers_with_new_capability']:,} ")
        f.write(f"({ml_quant['new_capability_rate']:.1%})\n\n")

    print(f"  ✓ Report saved to {output_file}")


def export_to_csv(all_analyses: List[Dict]):
    """Export summary statistics to CSV."""
    csv_file = OUTPUT_DIR / "summary_statistics.csv"

    with open(csv_file, 'w', newline='') as f:
        writer = csv.writer(f)

        # Header
        writer.writerow([
            'Category',
            'Total Papers',
            'ML Usage Rate',
            'Average ML Attribution %',
            'Acceleration Rate',
            'Efficiency Rate',
            'New Capability Rate'
        ])

        # Data
        for analysis in all_analyses:
            if analysis:
                ml = analysis['ml_impact_quantification']
                writer.writerow([
                    analysis['category'],
                    analysis['total_papers'],
                    f"{ml['ml_usage_rate']:.3f}",
                    f"{ml['average_ml_attribution']:.1f}",
                    f"{ml['acceleration_rate']:.3f}",
                    f"{ml['efficiency_rate']:.3f}",
                    f"{ml['new_capability_rate']:.3f}"
                ])

    print(f"\n✓ Summary CSV saved to {csv_file}")


def main():
    print("=" * 60)
    print("Research Impact Analysis")
    print("=" * 60)

    setup_output_dir()

    # Find all extracted impact files
    impact_files = list(INPUT_DIR.glob("*_impact.jsonl"))

    if not impact_files:
        print(f"\n✗ No extracted impact files found in {INPUT_DIR}")
        print("  Run extract_research_impact.py first")
        return

    print(f"\n✓ Found {len(impact_files)} categories to analyze")

    all_analyses = []

    # Analyze each category
    for impact_file in impact_files:
        category = impact_file.stem.replace('_impact', '')

        analysis = analyze_category(category)

        if analysis:
            all_analyses.append(analysis)

            # Save detailed JSON
            json_file = OUTPUT_DIR / f"{category}_analysis.json"
            with open(json_file, 'w') as f:
                json.dump(analysis, f, indent=2)
            print(f"  ✓ Analysis saved to {json_file}")

            # Generate report
            report_file = OUTPUT_DIR / f"{category}_report.md"
            generate_category_report(analysis, report_file)

    # Export summary CSV
    if all_analyses:
        export_to_csv(all_analyses)

    # Generate overall summary
    summary_file = OUTPUT_DIR / "overall_summary.json"
    overall_summary = {
        'total_categories': len(all_analyses),
        'total_papers': sum(a['total_papers'] for a in all_analyses),
        'categories': [a['category'] for a in all_analyses]
    }

    with open(summary_file, 'w') as f:
        json.dump(overall_summary, f, indent=2)

    print(f"\n{'='*60}")
    print("Analysis Complete")
    print(f"{'='*60}")
    print(f"  Total categories analyzed: {len(all_analyses)}")
    print(f"  Total papers analyzed: {overall_summary['total_papers']:,}")
    print(f"  Output directory: {OUTPUT_DIR}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
