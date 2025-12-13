export interface Paper {
  id: string;
  title: string;
  impactScore: number; // 0 to 100
  codeAvailable: boolean;
  year: number;
  citations: number;
  domain: string;
  // Simulation properties
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  r?: number; // Radius
}

export type FilterType = "impact" | "code";
