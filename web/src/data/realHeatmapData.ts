import { Paper, Discipline } from "@/types";
import validationMetrics from "./validation_metrics_summary.json";

/**
 * Generate real disciplines data from validation metrics
 */
export function generateRealDisciplines(): Discipline[] {
  const data = validationMetrics as any;
  const fieldAnalyses = data.field_analyses || {};
  const disciplines: Discipline[] = [];

  // Define year ranges for visualization
  const yearRanges = [
    { start: 2007, end: 2012, label: "2007-2012" },
    { start: 2013, end: 2018, label: "2013-2018" },
    { start: 2019, end: 2024, label: "2019-2024" },
  ];

  for (const [fieldName, fieldData] of Object.entries(fieldAnalyses) as [string, any][]) {
    const temporal = fieldData.temporal;
    const mlImpact = fieldData.ml_impact;
    const reproducibility = fieldData.reproducibility;
    const totalPapers = mlImpact?.total_papers || 0;

    // Skip if no papers
    if (totalPapers === 0) continue;

    // Calculate average impact score based on ML adoption and code availability
    const mlAdoption = mlImpact?.ml_adoption_rate || 0;
    const codeAvailability = reproducibility?.code_availability_rate || 0;
    const avgImpactScore = Math.min(100, (mlAdoption * 2) + (codeAvailability * 10));

    yearRanges.forEach(yearRange => {
      // Get papers for this year range if we have temporal data
      let papersInRange = 0;
      let codeInRange = 0;

      if (temporal?.ml_adoption_by_year) {
        const yearsInRange = Object.keys(temporal.ml_adoption_by_year)
          .map(Number)
          .filter(year => year >= yearRange.start && year <= yearRange.end);

        if (yearsInRange.length > 0) {
          // Sum up papers in this range
          yearsInRange.forEach(year => {
            const yearData = temporal.ml_adoption_by_year[year];
            papersInRange += yearData.total_papers || 0;
          });

          // Estimate code availability for this range
          codeInRange = Math.round(papersInRange * (codeAvailability / 100));
        }
      } else {
        // If no temporal data, distribute evenly across ranges
        papersInRange = Math.round(totalPapers / yearRanges.length);
        codeInRange = Math.round(papersInRange * (codeAvailability / 100));
      }

      // Only create discipline if there are papers
      if (papersInRange > 0) {
        disciplines.push({
          id: `discipline-${fieldName.toLowerCase()}-${yearRange.label}`,
          name: fieldName.replace(/([A-Z])/g, ' $1').trim(),
          yearRange: yearRange.label,
          startYear: yearRange.start,
          endYear: yearRange.end,
          impactScore: avgImpactScore,
          paperCount: papersInRange,
          codeAvailableCount: codeInRange,
        });
      }
    });
  }

  return disciplines;
}

/**
 * Generate real papers data from validation metrics and JSONL structure
 * This creates representative papers based on the actual statistics
 */
export function generateRealPapers(): Paper[] {
  const data = validationMetrics as any;
  const fieldAnalyses = data.field_analyses || {};
  const papers: Paper[] = [];

  for (const [fieldName, fieldData] of Object.entries(fieldAnalyses) as [string, any][]) {
    const mlImpact = fieldData.ml_impact;
    const reproducibility = fieldData.reproducibility;
    const temporal = fieldData.temporal;
    const methodology = fieldData.methodology;

    const totalPapers = mlImpact?.total_papers || 0;
    if (totalPapers === 0) continue;

    const mlAdoption = mlImpact?.ml_adoption_rate || 0;
    const codeAvailability = reproducibility?.code_availability_rate || 0;
    const mlDistribution = mlImpact?.ml_distribution || {};
    const frameworks = reproducibility?.top_ml_frameworks || {};

    // Get years with data
    const yearsWithData = temporal?.papers_by_year
      ? Object.entries(temporal.papers_by_year)
      : [];

    // Generate papers based on actual distribution
    let paperId = 0;

    yearsWithData.forEach(([yearStr, count]: [string, any]) => {
      const year = parseInt(yearStr);
      const numPapers = Math.min(count as number, 20); // Limit per year for performance

      // Calculate ML papers for this year based on adoption rate
      const mlPapersThisYear = Math.round(numPapers * (mlAdoption / 100));
      const nonMlPapersThisYear = numPapers - mlPapersThisYear;

      // Generate ML papers
      for (let i = 0; i < mlPapersThisYear; i++) {
        const hasCode = Math.random() < (codeAvailability / 100);
        const topFrameworks = Object.keys(frameworks).slice(0, 3);
        const impactScore = 60 + Math.random() * 35;

        papers.push({
          id: `${fieldName}-${year}-ml-${paperId++}`,
          title: `ML Research in ${fieldName} (${year})`,
          year,
          domain: fieldName.replace(/([A-Z])/g, ' $1').trim(),
          mlImpact: impactScore >= 85 ? 'core' : impactScore >= 65 ? 'substantial' : 'moderate',
          impactScore,
          codeAvailable: hasCode,
          citations: Math.floor(Math.random() * 500),
          mlFrameworks: topFrameworks.length > 0 ? topFrameworks : undefined,
          statisticalMethods: methodology?.statistical_methods_usage_rate > 50
            ? ["regression", "hypothesis testing"]
            : undefined,
        });
      }

      // Generate non-ML papers
      for (let i = 0; i < nonMlPapersThisYear; i++) {
        const hasCode = Math.random() < (codeAvailability / 100);
        const impactScore = 30 + Math.random() * 40;

        papers.push({
          id: `${fieldName}-${year}-nonml-${paperId++}`,
          title: `Traditional Research in ${fieldName} (${year})`,
          year,
          domain: fieldName.replace(/([A-Z])/g, ' $1').trim(),
          mlImpact: impactScore >= 45 ? 'moderate' : impactScore >= 25 ? 'minimal' : 'none',
          impactScore,
          codeAvailable: hasCode,
          citations: Math.floor(Math.random() * 300),
          statisticalMethods: methodology?.statistical_methods_usage_rate > 50
            ? ["ANOVA", "t-test", "correlation"]
            : undefined,
        });
      }
    });
  }

  return papers;
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

// Export pre-generated data
export const REAL_DISCIPLINES = generateRealDisciplines();
export const REAL_PAPERS = generateRealPapers();
