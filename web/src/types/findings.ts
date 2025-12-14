// Data interfaces for Findings Summary page

export interface GlobalMetrics {
  mlPenetration: number; // Percentage of papers using ML (2016-2024)
  discoveryAcceleration: number; // Median acceleration in months
  strongestField: string; // Field with highest ML lift
  reproducibilityDelta: number; // ML vs non-ML reproducibility difference
  totalPapersAnalyzed: number;
}

export interface AttributionScore {
  mlContribution: number; // 0-100 scale
  domainInsight: number; // 0-100 scale
  confidenceInterval: [number, number];
  breakdown: {
    minimal: number;
    moderate: number;
    substantial: number;
    core: number;
  };
}

export interface EfficiencyMetric {
  label: string;
  value: number;
  unit: string;
  trend?: number[]; // Sparkline data
  description: string;
}

export interface DisciplineMetric {
  disciplineName: string;
  mlPenetration: number; // Percentage
  accelerationScore: number; // Months saved
  citationLift: number; // Multiplier
  reproducibilitySignal: number; // 0-100 score
  netImpactRating: number; // Composite score 0-100
  paperCount: number;
}

export interface AdoptionCurve {
  year: number;
  penetration: number; // Percentage
  discipline: string;
}

export interface CitationFlow {
  fromMLMethod: string;
  toDomain: string;
  flowStrength: number; // Citation count or weight
  year: number;
}

export interface ReproducibilityComparison {
  mlPapers: {
    codeAvailable: number; // Percentage
    dataAvailable: number;
    retractionRate: number;
  };
  nonMLPapers: {
    codeAvailable: number;
    dataAvailable: number;
    retractionRate: number;
  };
  confidenceBounds: {
    lower: number;
    upper: number;
  };
}

export interface CaseTrace {
  id: string;
  title: string;
  mlMethod: string;
  domain: string;
  timeline: CaseTraceEvent[];
  impactMetric: {
    label: string;
    value: string;
  };
}

export interface CaseTraceEvent {
  phase: "method" | "adoption" | "impact";
  date: string;
  title: string;
  description: string;
  metric?: {
    label: string;
    value: string;
  };
}

export interface KeyTakeaway {
  category: "strong" | "emerging" | "open";
  title: string;
  description: string;
  evidenceStrength: "high" | "medium" | "low";
  supportingData?: string;
}

export interface FindingsData {
  globalMetrics: GlobalMetrics;
  attributionScore: AttributionScore;
  efficiencyMetrics: EfficiencyMetric[];
  disciplineMetrics: DisciplineMetric[];
  adoptionCurves: AdoptionCurve[];
  citationFlows: CitationFlow[];
  reproducibility: ReproducibilityComparison;
  caseTraces: CaseTrace[];
  keyTakeaways: KeyTakeaway[];
}
