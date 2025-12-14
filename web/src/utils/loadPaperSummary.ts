import { Paper } from "@/types";
import mlSummaries from "@/data/ml_summaries.json";

// Type for ML summary data
interface MLSummaryData {
  title: string;
  year: string;
  field: string;
  ml_impact: string;
  code_availability: boolean;
  summary: string;
  ml_frameworks?: string[];
  methodology?: string;
  statistics?: string;
  research_outcomes?: string;
}

// ML summaries indexed by lowercase title
const summaryData = mlSummaries as Record<string, MLSummaryData>;

export function getPaperSummary(paper: Paper): string {
  const titleKey = paper.title.toLowerCase();
  const mlData = summaryData[titleKey];

  return mlData?.summary || paper.summary || "No summary available for this paper.";
}

export function getPaperMLFrameworks(paper: Paper): string[] {
  const titleKey = paper.title.toLowerCase();
  const mlData = summaryData[titleKey];

  return mlData?.ml_frameworks || paper.mlFrameworks || [];
}

export function getPaperMethodology(paper: Paper): string {
  const titleKey = paper.title.toLowerCase();
  const mlData = summaryData[titleKey];

  return mlData?.methodology || "";
}

export function getPaperMLData(paper: Paper): MLSummaryData | null {
  const titleKey = paper.title.toLowerCase();
  return summaryData[titleKey] || null;
}
