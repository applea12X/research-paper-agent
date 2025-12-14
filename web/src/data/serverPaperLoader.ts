import * as fs from 'fs';
import * as path from 'path';
import { Paper, Discipline, MLImpact } from '@/types';

// Define the path to the data folder (relative to the project root)
const DATA_DIR = path.join(process.cwd(), '..', 'data');
const ML_OUTPUT_DIR = path.join(DATA_DIR, 'ml_output');
const NONML_OUTPUT_DIR = path.join(DATA_DIR, 'nonml_output');

interface RawPaperData {
  title: string;
  year: string;
  field: string;
  ml_impact: MLImpact;
  code_availability: boolean;
  summary: string;
  ml_frameworks: string[];
  methodology?: string;
  statistics?: string;
  research_outcomes?: string;
  sources_of_inspiration?: string[];
}

/**
 * Read all JSONL files from a directory
 */
function readJSONLFiles(directory: string): RawPaperData[] {
  const papers: RawPaperData[] = [];

  try {
    if (!fs.existsSync(directory)) {
      console.warn(`Directory does not exist: ${directory}`);
      return papers;
    }

    const files = fs.readdirSync(directory);

    for (const file of files) {
      if (file.endsWith('.jsonl')) {
        const filePath = path.join(directory, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const paper = JSON.parse(line) as RawPaperData;
            papers.push(paper);
          } catch (e) {
            console.warn(`Failed to parse line in ${file}:`, e);
          }
        }
      }
    }
  } catch (e) {
    console.error(`Error reading directory ${directory}:`, e);
  }

  return papers;
}

/**
 * Convert ML impact category to a numeric score for compatibility
 */
export function mlImpactToScore(impact: MLImpact): number {
  const scoreMap: Record<MLImpact, number> = {
    'none': 20,
    'minimal': 35,
    'moderate': 65,
    'substantial': 90,
    'core': 100,
  };
  return scoreMap[impact] || 20;
}

/**
 * Load all papers from the data folder (server-side only)
 */
export function loadPapersFromDataFolder(): Paper[] {
  const mlPapers = readJSONLFiles(ML_OUTPUT_DIR);
  const nonMlPapers = readJSONLFiles(NONML_OUTPUT_DIR);
  const allRawPapers = [...mlPapers, ...nonMlPapers];

  console.log(`Loaded ${allRawPapers.length} papers from data folder`);

  // Convert to Paper format
  const papers: Paper[] = allRawPapers.map((raw, index) => ({
    id: `paper-${raw.field}-${raw.year}-${index}`,
    title: raw.title,
    year: parseInt(raw.year),
    domain: raw.field.replace(/([A-Z])/g, ' $1').trim(),
    mlImpact: raw.ml_impact,
    impactScore: mlImpactToScore(raw.ml_impact),
    codeAvailable: raw.code_availability,
    citations: Math.floor(Math.random() * 500), // TODO: Get real citation data if available
    summary: raw.summary,
    mlFrameworks: raw.ml_frameworks && raw.ml_frameworks.length > 0 ? raw.ml_frameworks : undefined,
    statisticalMethods: raw.statistics ? [raw.statistics] : undefined,
  }));

  return papers;
}

/**
 * Generate disciplines from loaded papers
 */
export function generateDisciplinesFromPapers(papers: Paper[]): Discipline[] {
  const disciplines: Discipline[] = [];

  // Define year ranges for visualization
  const yearRanges = [
    { start: 2007, end: 2012, label: "2007-2012" },
    { start: 2013, end: 2018, label: "2013-2018" },
    { start: 2019, end: 2024, label: "2019-2024" },
  ];

  // Group papers by domain
  const papersByDomain = papers.reduce((acc, paper) => {
    if (!acc[paper.domain]) {
      acc[paper.domain] = [];
    }
    acc[paper.domain].push(paper);
    return acc;
  }, {} as Record<string, Paper[]>);

  // Create disciplines for each domain and year range
  for (const [domain, domainPapers] of Object.entries(papersByDomain)) {
    for (const yearRange of yearRanges) {
      const papersInRange = domainPapers.filter(
        p => p.year >= yearRange.start && p.year <= yearRange.end
      );

      if (papersInRange.length === 0) continue;

      const avgImpactScore = papersInRange.reduce((sum, p) => sum + p.impactScore, 0) / papersInRange.length;
      const codeAvailableCount = papersInRange.filter(p => p.codeAvailable).length;

      disciplines.push({
        id: `discipline-${domain.toLowerCase().replace(/\s+/g, '-')}-${yearRange.label}`,
        name: domain,
        yearRange: yearRange.label,
        startYear: yearRange.start,
        endYear: yearRange.end,
        impactScore: avgImpactScore,
        paperCount: papersInRange.length,
        codeAvailableCount,
      });
    }
  }

  return disciplines;
}

/**
 * Helper function to get papers by discipline and year range
 */
export function getPapersByDiscipline(
  papers: Paper[],
  disciplineName: string,
  startYear?: number,
  endYear?: number
): Paper[] {
  let filteredPapers = papers.filter(paper => paper.domain === disciplineName);

  if (startYear !== undefined && endYear !== undefined) {
    filteredPapers = filteredPapers.filter(
      paper => paper.year >= startYear && paper.year <= endYear
    );
  }

  return filteredPapers;
}
