import { SectionHeader } from "./shared/SectionHeader";
import { ReproducibilityComparison } from "@/types/findings";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

interface QualitySignalsProps {
  reproducibility: ReproducibilityComparison;
}

export function QualitySignals({ reproducibility }: QualitySignalsProps) {
  const metrics = [
    {
      label: "Code Available",
      mlValue: reproducibility.mlPapers.codeAvailable,
      nonMLValue: reproducibility.nonMLPapers.codeAvailable,
      unit: "%",
    },
    {
      label: "Data Available",
      mlValue: reproducibility.mlPapers.dataAvailable,
      nonMLValue: reproducibility.nonMLPapers.dataAvailable,
      unit: "%",
    },
    {
      label: "Retraction Rate",
      mlValue: reproducibility.mlPapers.retractionRate,
      nonMLValue: reproducibility.nonMLPapers.retractionRate,
      unit: "%",
      inverted: true, // Lower is better
    },
  ];

  return (
    <section className="mb-16">
      <SectionHeader
        subtitle="Reproducibility & Quality Analysis"
        title="Quality Trade-offs: ML vs Non-ML Papers"
        description="Comparative analysis of code availability by ML integration level. Examines correlation between ML adoption depth and reproducibility practices. Overall code availability critically low (<3%) across all disciplines, but deeper ML integration shows consistently better sharing rates."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {metrics.map((metric, i) => {
          const delta = metric.mlValue - metric.nonMLValue;
          const isPositive = metric.inverted ? delta < 0 : delta > 0;
          const isNeutral = Math.abs(delta) < 2;

          return (
            <div key={i} className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide">
                  {metric.label}
                </h3>
                {isNeutral ? (
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                ) : isPositive ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-baseline justify-between mb-1">
                    <p className="text-xs text-white/50">ML Papers</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {metric.mlValue.toFixed(1)}
                      {metric.unit}
                    </p>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-blue-400 rounded-full"
                      style={{ width: `${metric.mlValue}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline justify-between mb-1">
                    <p className="text-xs text-white/50">Non-ML Papers</p>
                    <p className="text-2xl font-bold text-purple-400">
                      {metric.nonMLValue.toFixed(1)}
                      {metric.unit}
                    </p>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-purple-400 rounded-full"
                      style={{ width: `${metric.nonMLValue}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <p className={`text-xs font-medium ${
                    isNeutral
                      ? "text-white/50"
                      : isPositive
                      ? "text-green-400"
                      : "text-red-400"
                  }`}>
                    {delta > 0 ? "+" : ""}
                    {delta.toFixed(1)}
                    {metric.unit} {metric.inverted ? "(ML higher)" : "(ML advantage)"}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confidence bounds and caveats */}
      <div className="glass rounded-xl p-6 border border-yellow-500/20">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-white/90 mb-2">
              Critical Context & Limitations
            </h4>
            <div className="space-y-2 text-sm text-white/60 leading-relaxed">
              <p>
                <span className="font-semibold text-white/80">Reproducibility Crisis:</span> Overall 
                code availability is catastrophically low at {reproducibility.mlPapers.codeAvailable.toFixed(2)}% 
                for ML papers and {reproducibility.nonMLPapers.codeAvailable.toFixed(2)}% for non-ML papers. 
                Even leading fields (Computer Science: 11.85%) fall far below acceptable standards.
              </p>
              <p>
                <span className="font-semibold text-white/80">ML Level Matters:</span> Within-field 
                analysis reveals nuanced pattern: core ML papers (21.05% in CS) &gt; moderate ML papers 
                (12.24%) &gt; minimal ML (10.07%) &gt; non-ML (11.41%). This suggests ML practitioners, 
                especially those using ML as core methodology, prioritize reproducibility despite 
                overall low rates.
              </p>
              <p>
                <span className="font-semibold text-white/80">Field-Specific Culture:</span> Cross-field 
                patterns weaker than within-field patterns, suggesting cultural factors dominate. Medicine 
                (0.47% code availability) and Business (0%) show systemic barriers beyond ML adoption.
              </p>
              <p>
                <span className="font-semibold text-white/80">Data Limitations:</span> Data availability 
                estimated from code availability (not directly measured). Retraction rates shown are 
                industry averages, not from dataset. Actual retraction pattern analysis requires external 
                databases (e.g., Retraction Watch).
              </p>
            </div>
            <p className="text-xs text-white/40 leading-relaxed mt-3">
              Confidence bounds: [{reproducibility.confidenceBounds.lower.toFixed(1)}%, 
              {reproducibility.confidenceBounds.upper.toFixed(1)}%] — Based on actual 
              code_availability_by_ml_level data from 7,200 papers across 13 disciplines. 
              Statistical significance varies by field (larger fields more reliable).
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
