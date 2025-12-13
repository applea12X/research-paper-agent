import { Paper, Discipline } from "@/types";
// Note: This file is deprecated - use realHeatmapData.ts instead
// import realPapersData from "./real_papers.json";
// import disciplineStatsData from "./discipline_stats.json";

export { type Paper, type Discipline };

// Load real papers from extracted data
export const MOCK_PAPERS: Paper[] = [];

// Load full discipline statistics (based on ALL papers, not just samples)
const disciplineStats = {} as Record<string, {
  paperCount: number;
  avgImpact: number;
  codeAvailableCount: number;
}>;

// Generate disciplines from papers with year ranges
// Uses full statistics from all papers, not just the sampled subset
export const generateDisciplines = (papers: Paper[]): Discipline[] => {
  const disciplineMap = new Map<string, Paper[]>();

  // Group papers by domain
  papers.forEach(paper => {
    if (!disciplineMap.has(paper.domain)) {
      disciplineMap.set(paper.domain, []);
    }
    disciplineMap.get(paper.domain)!.push(paper);
  });

  // Define 3 year ranges to split the data
  const yearRanges = [
    { start: 2020, end: 2021, label: "2020-2021" },
    { start: 2022, end: 2023, label: "2022-2023" },
    { start: 2024, end: 2025, label: "2024-2025" },
  ];

  const disciplines: Discipline[] = [];

  // Create discipline objects for each domain and year range
  disciplineMap.forEach((domainPapers, domainName) => {
    // Get full statistics for this discipline
    const fullStats = disciplineStats[domainName];
    if (!fullStats) return;

    yearRanges.forEach(yearRange => {
      // Filter papers for this year range
      const papersInRange = domainPapers.filter(
        p => p.year >= yearRange.start && p.year <= yearRange.end
      );

      // Only create discipline if there are papers in this range
      if (papersInRange.length > 0) {
        // Calculate what proportion of papers are in this year range
        const yearRatioBySample = papersInRange.length / domainPapers.length;

        // Estimate actual paper count and code count based on full statistics
        const estimatedPaperCount = Math.round(fullStats.paperCount * yearRatioBySample);
        const estimatedCodeCount = Math.round(fullStats.codeAvailableCount * yearRatioBySample);

        disciplines.push({
          id: `discipline-${domainName.toLowerCase().replace(/\s+/g, '-')}-${yearRange.label}`,
          name: domainName,
          yearRange: yearRange.label,
          startYear: yearRange.start,
          endYear: yearRange.end,
          impactScore: fullStats.avgImpact, // Use full dataset average
          paperCount: estimatedPaperCount, // Estimated based on year range distribution
          codeAvailableCount: estimatedCodeCount, // Estimated based on year range distribution
        });
      }
    });
  });

  return disciplines;
};

export const MOCK_DISCIPLINES = generateDisciplines(MOCK_PAPERS);

// Helper function to get papers by discipline and year range
export const getPapersByDiscipline = (disciplineName: string, startYear?: number, endYear?: number): Paper[] => {
  let filteredPapers = MOCK_PAPERS.filter(paper => paper.domain === disciplineName);

  if (startYear !== undefined && endYear !== undefined) {
    filteredPapers = filteredPapers.filter(
      paper => paper.year >= startYear && paper.year <= endYear
    );
  }

  return filteredPapers;
};