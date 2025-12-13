#!/usr/bin/env python3
"""
Count papers by year across all categories.
"""

import json
import gzip
from pathlib import Path
from collections import Counter

INPUT_DIR = Path("data/combined_compressed")

def count_papers_by_year():
    """Count papers by year across all categories."""
    year_counts = Counter()
    category_year_counts = {}
    total_papers = 0

    # Process each category file
    for category_file in sorted(INPUT_DIR.glob("*.jsonl.gz")):
        category = category_file.stem
        category_years = Counter()

        print(f"Processing {category}...")

        with gzip.open(category_file, 'rt', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    try:
                        paper = json.loads(line)

                        # Try to get year from different locations
                        year = paper.get('_year')
                        if not year:
                            metadata = paper.get('metadata', {})
                            year = metadata.get('year')

                        if year and year != 'unknown':
                            year_counts[year] += 1
                            category_years[year] += 1
                            total_papers += 1
                    except json.JSONDecodeError:
                        continue

        category_year_counts[category] = dict(category_years)
        print(f"  {category}: {sum(category_years.values()):,} papers")

    return year_counts, category_year_counts, total_papers


def main():
    print("=" * 60)
    print("Counting Papers by Year")
    print("=" * 60)

    year_counts, category_year_counts, total_papers = count_papers_by_year()

    print("\n" + "=" * 60)
    print("Year Distribution (All Categories)")
    print("=" * 60)

    for year in sorted(year_counts.keys()):
        count = year_counts[year]
        percentage = (count / total_papers * 100) if total_papers > 0 else 0
        print(f"{year}: {count:>8,} papers ({percentage:>5.1f}%)")

    # Calculate papers after 2022
    papers_after_2022 = sum(count for year, count in year_counts.items() if year >= 2022)
    papers_2022_onwards = sum(count for year, count in year_counts.items() if year >= 2022)

    print("\n" + "=" * 60)
    print("Filtered Counts")
    print("=" * 60)
    print(f"Total papers: {total_papers:,}")
    print(f"Papers from 2022 onwards: {papers_2022_onwards:,}")

    if papers_2022_onwards < 10000:
        print(f"\n✓ Papers from 2022+ ({papers_2022_onwards:,}) is LESS than 10,000")
    else:
        print(f"\n✗ Papers from 2022+ ({papers_2022_onwards:,}) is MORE than 10,000")

        # Try 2023+
        papers_2023_onwards = sum(count for year, count in year_counts.items() if year >= 2023)
        print(f"\nAlternative: Papers from 2023 onwards: {papers_2023_onwards:,}")

        if papers_2023_onwards < 10000:
            print(f"✓ Papers from 2023+ ({papers_2023_onwards:,}) is LESS than 10,000")

    print("=" * 60)

    # Save detailed breakdown
    output_file = Path("paper_year_counts.json")
    with open(output_file, 'w') as f:
        json.dump({
            'total_papers': total_papers,
            'year_counts': dict(sorted(year_counts.items())),
            'category_year_counts': category_year_counts,
            'papers_2022_onwards': papers_2022_onwards
        }, f, indent=2)

    print(f"\n✓ Detailed counts saved to: {output_file}")


if __name__ == "__main__":
    main()
