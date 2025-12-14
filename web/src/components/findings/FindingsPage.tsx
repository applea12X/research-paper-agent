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
          <p className="text-sm text-white/40 mt-4 leading-relaxed">
            Based on analysis of {data.globalMetrics.totalPapersAnalyzed.toLocaleString()}{" "}
            papers across 13 scientific disciplines (2007-2022). Comprehensive metrics include 
            ML adoption rates (12.8% overall), integration levels (minimal to core), reproducibility 
            indicators (code availability), temporal evolution, and cross-discipline comparisons. 
            Addresses three research questions: (1) Quantify ML Impact, (2) Visualize Adoption Dynamics, 
            (3) Analyze Quality Trade-offs.
          </p>
        </header>

        {/* Headline Metrics Strip */}
        <div className="mb-16">
          <StatStrip metrics={data.globalMetrics} />
        </div>

        {/* Research Question 1: Quantify ML Impact */}
        <section className="mb-20">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white/95 mb-2">
              Research Question 1: Quantify ML Impact
            </h2>
            <p className="text-white/60">
              Measure how much ML actually contributes to scientific breakthroughs and discovery efficiency.
              Attribution scoring, acceleration metrics, and efficiency measures.
            </p>
          </div>
          <GlobalImpactOverview
            attributionScore={data.attributionScore}
            efficiencyMetrics={data.efficiencyMetrics}
          />
          <div className="mt-8">
            <DisciplineComparison disciplines={data.disciplineMetrics} />
          </div>
        </section>

        {/* Research Question 2: Visualize Adoption Dynamics */}
        <section className="mb-20">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white/95 mb-2">
              Research Question 2: Visualize Adoption Dynamics
            </h2>
            <p className="text-white/60">
              Show how ML techniques spread across scientific disciplines over time.
              S-curves, citation flows, temporal evolution, and cross-discipline comparison.
            </p>
          </div>
          <AdoptionDynamics adoptionCurves={data.adoptionCurves} />
        </section>

        {/* Research Question 3: Analyze Quality Trade-offs */}
        <section className="mb-20">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white/95 mb-2">
              Research Question 3: Analyze Quality Trade-offs
            </h2>
            <p className="text-white/60">
              Investigate whether ML adoption correlates with better or worse research reproducibility.
              Reproducibility rates, retraction patterns, and code/data availability correlations.
            </p>
          </div>
          <QualitySignals reproducibility={data.reproducibility} />
        </section>

        {/* Key Takeaways */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white/95 mb-2">
              Key Takeaways & Implications
            </h2>
            <p className="text-white/60">
              Evidence-backed insights organized by strength, addressing all three research questions.
            </p>
          </div>
          <KeyTakeaways takeaways={data.keyTakeaways} />
        </section>

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
