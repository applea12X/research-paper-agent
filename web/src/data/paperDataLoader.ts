import { Paper, Discipline, MLImpact } from '@/types';
import generatedPapers from './generatedPapers.json';

/**
 * Convert ML impact category to a numeric score for compatibility
 * This maintains backward compatibility while using word-based categories
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
 * Convert numeric score to ML impact category
 */
export function scoreToMLImpact(score: number): MLImpact {
  if (score >= 85) return 'core';
  if (score >= 65) return 'substantial';
  if (score >= 45) return 'moderate';
  if (score >= 25) return 'minimal';
  return 'none';
}

/**
 * Load all papers from the generated static data
 */
export function loadPapersFromDataFolder(): Paper[] {
  return generatedPapers as Paper[];
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

// Export data - these will be loaded on demand
let cachedPapers: Paper[] | null = null;
let cachedDisciplines: Discipline[] | null = null;

export function getLoadedPapers(): Paper[] {
  if (!cachedPapers) {
    cachedPapers = loadPapersFromDataFolder();
  }
  return cachedPapers;
}

export function getLoadedDisciplines(): Discipline[] {
  if (!cachedDisciplines) {
    const papers = getLoadedPapers();
    cachedDisciplines = generateDisciplinesFromPapers(papers);
  }
  return cachedDisciplines;
}

// Export constants for backward compatibility
export const REAL_PAPERS = getLoadedPapers();
export const REAL_DISCIPLINES = getLoadedDisciplines();
