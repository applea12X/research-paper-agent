import { Paper, Discipline } from "@/types";

export { type Paper, type Discipline };

const domains = [
  "Computer Vision",
  "NLP",
  "Robotics",
  "Bioinformatics",
  "Healthcare",
  "Finance",
  "Climate Science",
  "Physics"
];

const titles = [
  "Deep Learning for Protein Folding",
  "Transformer Models in Legal Text Analysis",
  "Reinforcement Learning for Autonomous Navigation",
  "Generative Adversarial Networks in Art",
  "Predicting Stock Market Trends with LSTM",
  "Climate Change Modeling using CNNs",
  "Automated Medical Diagnosis via Image Recognition",
  "Quantum State Tomography with Neural Networks",
  "Efficient Neural Architecture Search",
  "Self-Supervised Learning for Speech Recognition",
  "Graph Neural Networks for Drug Discovery",
  "Explainable AI in Credit Scoring",
  "Real-time Object Detection on Edge Devices",
  "Multi-Agent Reinforcement Learning in Games",
  "Zero-Shot Learning for Rare Disease Classification"
];

export const generateMockPapers = (count: number = 100): Paper[] => {
  return Array.from({ length: count }, (_, i) => {
    const impactScore = Math.random() * 100;
    // Higher impact score correlates slightly with code availability for realism, but not strictly
    const codeAvailable = Math.random() > 0.4 || (impactScore > 80 && Math.random() > 0.2);

    return {
      id: `paper-${i}`,
      title: titles[i % titles.length] + (i >= titles.length ? ` ${Math.floor(i / titles.length) + 1}` : ""),
      impactScore,
      codeAvailable,
      year: 2020 + Math.floor(Math.random() * 6),
      citations: Math.floor(Math.random() * 1000) + (impactScore * 10),
      domain: domains[Math.floor(Math.random() * domains.length)],
    };
  });
};

export const MOCK_PAPERS = generateMockPapers(150);

// Generate disciplines from papers with year ranges
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
    yearRanges.forEach(yearRange => {
      // Filter papers for this year range
      const papersInRange = domainPapers.filter(
        p => p.year >= yearRange.start && p.year <= yearRange.end
      );

      // Only create discipline if there are papers in this range
      if (papersInRange.length > 0) {
        const avgImpact = papersInRange.reduce((sum, p) => sum + p.impactScore, 0) / papersInRange.length;
        const codeCount = papersInRange.filter(p => p.codeAvailable).length;

        disciplines.push({
          id: `discipline-${domainName.toLowerCase().replace(/\s+/g, '-')}-${yearRange.label}`,
          name: domainName,
          yearRange: yearRange.label,
          startYear: yearRange.start,
          endYear: yearRange.end,
          impactScore: avgImpact,
          paperCount: papersInRange.length,
          codeAvailableCount: codeCount,
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