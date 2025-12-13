#!/usr/bin/env python3

import gzip
import shutil
from pathlib import Path
from tqdm import tqdm

# Configuration
INPUT_DIR = Path("data/combined")
OUTPUT_DIR = Path("data/combined_compressed")
COMPRESSION_LEVEL = 9  # 1-9, where 9 is maximum compression

def setup_output_dir():
    """Create the output directory if it doesn't exist."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"✓ Output directory: {OUTPUT_DIR}")

def compress_file(input_file, output_file, compression_level=9):
    """Compress a file using gzip."""
    try:
        with open(input_file, 'rb') as f_in:
            with gzip.open(output_file, 'wb', compresslevel=compression_level) as f_out:
                shutil.copyfileobj(f_in, f_out)
        return True
    except Exception as e:
        print(f"  ✗ Error compressing {input_file.name}: {e}")
        return False

def get_file_size_mb(file_path):
    """Get file size in MB."""
    return file_path.stat().st_size / (1024 * 1024)

def compress_all_files():
    """Compress all JSON/JSONL files in the input directory."""
    files = list(INPUT_DIR.glob("*.json")) + list(INPUT_DIR.glob("*.jsonl"))

    if not files:
        print(f"\n✗ No files found in {INPUT_DIR}")
        return

    print(f"\n✓ Found {len(files)} files to compress")

    stats = {
        'total_original_size': 0,
        'total_compressed_size': 0,
        'files_compressed': 0,
        'files_failed': 0
    }

    print(f"\nCompressing files (level {COMPRESSION_LEVEL})...")

    for input_file in tqdm(files, desc="Compressing"):
        output_file = OUTPUT_DIR / f"{input_file.name}.gz"

        original_size = get_file_size_mb(input_file)
        stats['total_original_size'] += original_size

        if compress_file(input_file, output_file, COMPRESSION_LEVEL):
            compressed_size = get_file_size_mb(output_file)
            stats['total_compressed_size'] += compressed_size
            stats['files_compressed'] += 1

            compression_ratio = (1 - compressed_size / original_size) * 100
            print(f"  ✓ {input_file.name}: {original_size:.1f} MB → {compressed_size:.1f} MB ({compression_ratio:.1f}% reduction)")
        else:
            stats['files_failed'] += 1

    return stats

def copy_summary_file():
    """Copy the summary.txt file if it exists."""
    summary_file = INPUT_DIR / "summary.txt"
    if summary_file.exists():
        shutil.copy2(summary_file, OUTPUT_DIR / "summary.txt")
        print(f"  ✓ Copied summary.txt")

def create_readme():
    """Create a README for the compressed data."""
    readme_file = OUTPUT_DIR / "README.md"

    with open(readme_file, 'w') as f:
        f.write("# Compressed Research Paper Data\n\n")
        f.write("This directory contains compressed category files for research papers.\n\n")
        f.write("## Files\n\n")
        f.write("Each `.jsonl.gz` file contains all papers for a specific category:\n\n")

        # List all compressed files
        gz_files = sorted(OUTPUT_DIR.glob("*.gz"))
        for gz_file in gz_files:
            size_mb = get_file_size_mb(gz_file)
            f.write(f"- `{gz_file.name}` ({size_mb:.1f} MB)\n")

        f.write("\n## Usage\n\n")
        f.write("To decompress a file:\n\n")
        f.write("```bash\n")
        f.write("gunzip category_name.jsonl.gz\n")
        f.write("```\n\n")
        f.write("Or to read directly in Python:\n\n")
        f.write("```python\n")
        f.write("import gzip\n")
        f.write("import json\n\n")
        f.write("with gzip.open('category_name.jsonl.gz', 'rt', encoding='utf-8') as f:\n")
        f.write("    for line in f:\n")
        f.write("        paper = json.loads(line)\n")
        f.write("        # Process paper...\n")
        f.write("```\n")

    print(f"  ✓ Created README.md")

def print_summary(stats):
    """Print compression summary."""
    print("\n" + "=" * 60)
    print("Compression Summary")
    print("=" * 60)
    print(f"  Files compressed: {stats['files_compressed']}")
    print(f"  Files failed: {stats['files_failed']}")
    print(f"  Original size: {stats['total_original_size']:.1f} MB")
    print(f"  Compressed size: {stats['total_compressed_size']:.1f} MB")

    if stats['total_original_size'] > 0:
        total_reduction = (1 - stats['total_compressed_size'] / stats['total_original_size']) * 100
        print(f"  Total reduction: {total_reduction:.1f}%")

    print("=" * 60)

def main():
    print("=" * 60)
    print("Compress Category Files for Git")
    print("=" * 60)

    # Check if input directory exists
    if not INPUT_DIR.exists():
        print(f"\n✗ Error: Input directory {INPUT_DIR} does not exist!")
        print(f"  Please run combine_categories.py first to create it.")
        return

    # Setup
    setup_output_dir()

    # Compress files
    stats = compress_all_files()

    if stats:
        # Copy summary and create README
        print("\nCreating documentation...")
        copy_summary_file()
        create_readme()

        # Print summary
        print_summary(stats)

        print(f"\n✓ Compressed files ready in: {OUTPUT_DIR}")
        print(f"\n💡 You can now add this directory to git:")
        print(f"   git add {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
