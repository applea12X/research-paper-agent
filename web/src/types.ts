export interface Paper {
  id: string;
  title: string;
  impactScore: number; // 0 to 100
  codeAvailable: boolean;
  year: number;
  citations: number;
  domain: string;
  summary?: string; // 2 sentence summary
  mlFrameworks?: string[]; // ML frameworks mentioned
  statisticalMethods?: string[]; // Statistical methods described
  // Simulation properties
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  r?: number; // Radius
}

export interface Discipline {
  id: string;
  name: string;
  yearRange: string; // e.g., "2020-2022"
  startYear: number;
  endYear: number;
  impactScore: number; // Average impact of papers in this discipline
  paperCount: number;
  codeAvailableCount: number; // Number of papers with code available
  // Simulation properties
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  r?: number; // Radius
}

export type FilterOption = "impact" | "code";
export type FilterType = FilterOption[];
