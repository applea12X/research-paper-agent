import { Paper, DisciplineSummary, GlobalAverages } from "@/types";

/**
 * Compute comprehensive discipline-specific summary metrics
 */
export function computeDisciplineSummary(
  papers: Paper[],
  globalAverages: GlobalAverages
): DisciplineSummary {
  if (papers.length === 0) {
    return getEmptySummary(globalAverages);
  }

  // Basic Stats
  const totalPapers = papers.length;
  const papersWithCode = papers.filter((p) => p.codeAvailable).length;
  const codeAvailabilityRate = (papersWithCode / totalPapers) * 100;
  const avgImpactScore =
    papers.reduce((sum, p) => sum + p.impactScore, 0) / totalPapers;

  // Year Distribution
  const yearMap = new Map<number, number>();
  papers.forEach((p) => {
    yearMap.set(p.year, (yearMap.get(p.year) || 0) + 1);
  });
  const yearDistribution = Array.from(yearMap.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year - b.year);

  // Impact Distribution
  const low = papers.filter((p) => p.impactScore <= 33).length;
  const medium = papers.filter(
    (p) => p.impactScore > 33 && p.impactScore <= 66
  ).length;
  const high = papers.filter((p) => p.impactScore > 66).length;
  const impactDistribution = { low, medium, high };

  // Framework Analysis
  const frameworkCounts = new Map<string, number>();
  papers.forEach((paper) => {
    paper.mlFrameworks?.forEach((fw) => {
      frameworkCounts.set(fw, (frameworkCounts.get(fw) || 0) + 1);
    });
  });

  const allFrameworks = Array.from(frameworkCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const topFrameworks = allFrameworks.slice(0, 10).map((fw) => ({
    ...fw,
    percentage: (fw.count / totalPapers) * 100,
  }));

  // Methods Analysis
  const methodCounts = new Map<string, number>();
  papers.forEach((paper) => {
    paper.statisticalMethods?.forEach((method) => {
      methodCounts.set(method, (methodCounts.get(method) || 0) + 1);
    });
  });

  const allMethods = Array.from(methodCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const topMethods = allMethods.slice(0, 10).map((method) => ({
    ...method,
    percentage: (method.count / totalPapers) * 100,
  }));

  // Citation Stats
  const totalCitations = papers.reduce((sum, p) => sum + (p.citations || 0), 0);
  const avgCitations = totalCitations / totalPapers;

  const citationRanges = [
    { range: "0-10", min: 0, max: 10 },
    { range: "11-50", min: 11, max: 50 },
    { range: "51-100", min: 51, max: 100 },
    { range: "100+", min: 101, max: Infinity },
  ];

  const citationDistribution = citationRanges.map((r) => ({
    range: r.range,
    count: papers.filter(
      (p) => (p.citations || 0) >= r.min && (p.citations || 0) <= r.max
    ).length,
  }));

  // Temporal Trends - Impact Over Time
  const yearImpactMap = new Map<number, { sum: number; count: number }>();
  papers.forEach((p) => {
    const existing = yearImpactMap.get(p.year) || { sum: 0, count: 0 };
    yearImpactMap.set(p.year, {
      sum: existing.sum + p.impactScore,
      count: existing.count + 1,
    });
  });

  const impactOverTime = Array.from(yearImpactMap.entries())
    .map(([year, { sum, count }]) => ({
      year,
      avgImpact: sum / count,
    }))
    .sort((a, b) => a.year - b.year);

  // Temporal Trends - Code Availability Over Time
  const yearCodeMap = new Map<
    number,
    { withCode: number; total: number }
  >();
  papers.forEach((p) => {
    const existing = yearCodeMap.get(p.year) || { withCode: 0, total: 0 };
    yearCodeMap.set(p.year, {
      withCode: existing.withCode + (p.codeAvailable ? 1 : 0),
      total: existing.total + 1,
    });
  });

  const codeAvailabilityOverTime = Array.from(yearCodeMap.entries())
    .map(([year, { withCode, total }]) => ({
      year,
      percentage: (withCode / total) * 100,
    }))
    .sort((a, b) => a.year - b.year);

  // Comparative Metrics
  const vsGlobal = {
    impactDelta: avgImpactScore - globalAverages.avgImpactScore,
    codeDelta: codeAvailabilityRate - globalAverages.avgCodeAvailability,
    citationDelta: avgCitations - globalAverages.avgCitations,
  };

  return {
    totalPapers,
    papersWithCode,
    codeAvailabilityRate,
    avgImpactScore,
    yearDistribution,
    impactDistribution,
    topFrameworks,
    allFrameworks,
    topMethods,
    allMethods,
    totalCitations,
    avgCitations,
    citationDistribution,
    impactOverTime,
    codeAvailabilityOverTime,
    vsGlobal,
  };
}

/**
 * Compute global averages across all papers
 */
export function computeGlobalAverages(papers: Paper[]): GlobalAverages {
  if (papers.length === 0) {
    return {
      avgImpactScore: 0,
      avgCodeAvailability: 0,
      avgCitations: 0,
    };
  }

  const totalPapers = papers.length;
  const papersWithCode = papers.filter((p) => p.codeAvailable).length;

  const avgImpactScore =
    papers.reduce((sum, p) => sum + p.impactScore, 0) / totalPapers;
  const avgCodeAvailability = (papersWithCode / totalPapers) * 100;
  const totalCitations = papers.reduce((sum, p) => sum + (p.citations || 0), 0);
  const avgCitations = totalCitations / totalPapers;

  return {
    avgImpactScore,
    avgCodeAvailability,
    avgCitations,
  };
}

/**
 * Returns an empty summary for when no papers are available
 */
function getEmptySummary(globalAverages: GlobalAverages): DisciplineSummary {
  return {
    totalPapers: 0,
    papersWithCode: 0,
    codeAvailabilityRate: 0,
    avgImpactScore: 0,
    yearDistribution: [],
    impactDistribution: { low: 0, medium: 0, high: 0 },
    topFrameworks: [],
    allFrameworks: [],
    topMethods: [],
    allMethods: [],
    totalCitations: 0,
    avgCitations: 0,
    citationDistribution: [
      { range: "0-10", count: 0 },
      { range: "11-50", count: 0 },
      { range: "51-100", count: 0 },
      { range: "100+", count: 0 },
    ],
    impactOverTime: [],
    codeAvailabilityOverTime: [],
    vsGlobal: {
      impactDelta: -globalAverages.avgImpactScore,
      codeDelta: -globalAverages.avgCodeAvailability,
      citationDelta: -globalAverages.avgCitations,
    },
  };
}
