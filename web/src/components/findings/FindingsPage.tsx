"use client";

import { StatStrip } from "./StatStrip";
import { GlobalImpactOverview } from "./GlobalImpactOverview";
import { DisciplineComparison } from "./DisciplineComparison";
import { AdoptionDynamics } from "./AdoptionDynamics";
import { QualitySignals } from "./QualitySignals";
import { KeyTakeaways } from "./KeyTakeaways";
import { FINDINGS_DATA } from "@/data/findingsData";

export function FindingsPage() {
  const data = FINDINGS_DATA;

  return (
    <div className="pt-20 px-6 pb-12 min-h-screen custom-scrollbar">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-white/95 mb-3 tracking-tight">
            Summary of Findings
          </h1>
          <p className="text-lg text-white/60 max-w-3xl leading-relaxed">
            Quantifying Machine Learning's Real Impact on Scientific Progress
          </p>
          <p className="text-sm text-white/40 mt-4">
            Based on analysis of {data.globalMetrics.totalPapersAnalyzed.toLocaleString()}{" "}
            papers from arXiv, PubMed, and Semantic Scholar (2016-2024)
          </p>
        </header>

        {/* Headline Metrics Strip */}
        <div className="mb-16">
          <StatStrip metrics={data.globalMetrics} />
        </div>

        {/* Main Content Sections */}
        <GlobalImpactOverview
          attributionScore={data.attributionScore}
          efficiencyMetrics={data.efficiencyMetrics}
        />

        <DisciplineComparison disciplines={data.disciplineMetrics} />

        <AdoptionDynamics adoptionCurves={data.adoptionCurves} />

        <QualitySignals reproducibility={data.reproducibility} />

        <KeyTakeaways takeaways={data.keyTakeaways} />

        {/* Footer Note */}
        <footer className="mt-16 pt-8 border-t border-white/10">
          <p className="text-xs text-white/40 text-center leading-relaxed max-w-4xl mx-auto">
            This analysis represents a quantitative snapshot of machine learning's
            impact on scientific progress. Findings are derived from validated
            datasets and controlled comparisons. All metrics include confidence
            bounds where applicable. This is a research-grade analytical product,
            not promotional content.
          </p>
        </footer>
      </div>
    </div>
  );
}
