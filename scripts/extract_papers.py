#!/usr/bin/env python3

import gzip
import json
import os
from pathlib import Path
import random
from typing import List, Dict, Any

# Configuration
DATA_DIR = Path("data/combined_compressed")
OUTPUT_FILE = Path("web/src/data/real_papers.json")
DISCIPLINE_STATS_FILE = Path("web/src/data/discipline_stats.json")
PAPERS_PER_DISCIPLINE = 100  # Sample size for visualization

def calculate_impact_score(citations: int, year: int) -> float:
    current_year = 2025
    year_factor = max(0, 1 - (current_year - year) / 20)

    import math
    citation_factor = min(1.0, math.log(citations + 1) / math.log(1000))
    score = (citation_factor * 0.7 + year_factor * 0.3) * 100
    return round(min(100, max(0, score)), 2)

def has_code_available(paper_data: Dict[str, Any]) -> bool:

    text = paper_data.get("text", "").lower()

    # Check for common code availability indicators
    code_indicators = [
        "github.com",
        "code is available",
        "source code",
        "open source",
        "code available at",
        "implementation available"
    ]

    return any(indicator in text for indicator in code_indicators)

def extract_papers_from_file(file_path: Path, discipline: str, sample_size: int) -> tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Extract and transform papers from a compressed JSONL file.
    Returns: (sampled_papers, full_discipline_stats)
    """
    papers = []

    print(f"Processing {file_path.name}...")

    with gzip.open(file_path, 'rt', encoding='utf-8') as f:
        all_papers = []
        for line in f:
            try:
                paper = json.loads(line)
                metadata = paper.get("metadata", {})

                # Extract required fields
                year = metadata.get("year")
                if not year or year < 2000:  # Filter old papers
                    continue

                # Get paper ID
                paper_id = paper.get("id", "")
                if not paper_id:
                    continue

                # Extract title from text (usually first line or section)
                text = paper.get("text", "")
                title_lines = text.split("\n\n")
                title = title_lines[0] if title_lines else "Untitled"
                # Clean title - take first reasonable length part
                title = title.strip()[:200]

                # Get citations (not in all datasets, default to 0)
                citations = metadata.get("citations", 0)
                if isinstance(citations, str):
                    try:
                        citations = int(citations)
                    except:
                        citations = 0

                all_papers.append({
                    "id": paper_id,
                    "title": title,
                    "year": year,
                    "citations": citations,
                    "domain": discipline,
                    "raw_data": paper
                })

            except json.JSONDecodeError:
                continue
            except Exception as e:
                print(f"Error processing paper: {e}")
                continue

        # Calculate statistics from ALL papers
        total_papers = len(all_papers)
        if total_papers == 0:
            return [], {"paperCount": 0, "avgImpact": 0, "codeAvailableCount": 0}

        total_impact = 0
        total_code_available = 0
        for paper in all_papers:
            impact = calculate_impact_score(paper["citations"], paper["year"])
            total_impact += impact
            if has_code_available(paper["raw_data"]):
                total_code_available += 1

        discipline_stats = {
            "paperCount": total_papers,
            "avgImpact": total_impact / total_papers,
            "codeAvailableCount": total_code_available
        }

        print(f"  Total papers in {discipline}: {total_papers}")
        print(f"  Avg impact: {discipline_stats['avgImpact']:.2f}, Code available: {total_code_available}")

        # Sample papers if we have more than needed
        if len(all_papers) > sample_size:
            # Stratify by year to get diverse sample
            all_papers.sort(key=lambda x: x["year"])
            step = len(all_papers) / sample_size
            sampled_papers = [all_papers[int(i * step)] for i in range(sample_size)]
        else:
            sampled_papers = all_papers

        # Transform to final format
        for paper in sampled_papers:
            transformed = {
                "id": paper["id"],
                "title": paper["title"],
                "impactScore": calculate_impact_score(paper["citations"], paper["year"]),
                "codeAvailable": has_code_available(paper["raw_data"]),
                "year": paper["year"],
                "citations": paper["citations"],
                "domain": paper["domain"]
            }
            papers.append(transformed)

    print(f"  Sampled {len(papers)} papers for visualization")
    return papers, discipline_stats

def main():
    """Main extraction process."""
    # Map filenames to discipline names
    discipline_mapping = {
        "AgriculturalAndFoodSciences.jsonl.gz": "Agricultural and Food Sciences",
        "Biology.jsonl.gz": "Biology",
        "Chemistry.jsonl.gz": "Chemistry",
        "ComputerScience.jsonl.gz": "Computer Science",
        "Economics.jsonl.gz": "Economics",
        "Engineering.jsonl.gz": "Engineering",
        "EnvironmentalScience.jsonl.gz": "Environmental Science",
        "Mathematics.jsonl.gz": "Mathematics",
        "Medicine.jsonl.gz": "Medicine",
        "Physics.jsonl.gz": "Physics",
        "PoliticalScience.jsonl.gz": "Political Science",
        "Psychology.jsonl.gz": "Psychology",
    }

    all_papers = []
    discipline_stats = {}

    for filename, discipline in discipline_mapping.items():
        file_path = DATA_DIR / filename
        if file_path.exists():
            papers, stats = extract_papers_from_file(file_path, discipline, PAPERS_PER_DISCIPLINE)
            all_papers.extend(papers)
            discipline_stats[discipline] = stats
        else:
            print(f"Warning: {filename} not found")

    print(f"\n{'='*60}")
    print(f"Total papers sampled for visualization: {len(all_papers)}")
    print(f"{'='*60}")

    # Create output directory if it doesn't exist
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    # Write papers to JSON file
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_papers, f, indent=2)

    # Write discipline stats to separate file
    with open(DISCIPLINE_STATS_FILE, 'w', encoding='utf-8') as f:
        json.dump(discipline_stats, f, indent=2)

    print(f"\nPapers written to {OUTPUT_FILE}")
    print(f"Discipline stats written to {DISCIPLINE_STATS_FILE}")

    # Print statistics
    print("\n" + "="*60)
    print("FULL DATASET STATISTICS (all papers):")
    print("="*60)

    total_all = sum(stats["paperCount"] for stats in discipline_stats.values())
    total_code_all = sum(stats["codeAvailableCount"] for stats in discipline_stats.values())

    print(f"\nTotal papers analyzed: {total_all:,}")
    print(f"Total with code: {total_code_all:,} ({total_code_all/total_all*100:.1f}%)")

    for discipline, stats in sorted(discipline_stats.items()):
        print(f"\n{discipline}:")
        print(f"  Total papers: {stats['paperCount']:,}")
        print(f"  With code: {stats['codeAvailableCount']:,} ({stats['codeAvailableCount']/stats['paperCount']*100:.1f}%)")
        print(f"  Avg impact score: {stats['avgImpact']:.2f}")

    print("\n" + "="*60)
    print("SAMPLED DATA STATISTICS (visualization subset):")
    print("="*60)
    by_discipline = {}
    for paper in all_papers:
        discipline = paper["domain"]
        if discipline not in by_discipline:
            by_discipline[discipline] = {
                "count": 0,
                "with_code": 0,
                "avg_impact": 0,
                "avg_citations": 0
            }
        by_discipline[discipline]["count"] += 1
        if paper["codeAvailable"]:
            by_discipline[discipline]["with_code"] += 1
        by_discipline[discipline]["avg_impact"] += paper["impactScore"]
        by_discipline[discipline]["avg_citations"] += paper["citations"]

    for discipline, stats in sorted(by_discipline.items()):
        stats["avg_impact"] /= stats["count"]
        stats["avg_citations"] /= stats["count"]
        print(f"\n{discipline}:")
        print(f"  Sampled papers: {stats['count']}")
        print(f"  With code: {stats['with_code']} ({stats['with_code']/stats['count']*100:.1f}%)")
        print(f"  Avg impact score: {stats['avg_impact']:.2f}")
        print(f"  Avg citations: {stats['avg_citations']:.0f}")

if __name__ == "__main__":
    main()
