import { SectionHeader } from "./shared/SectionHeader";
import { MetricCard } from "./shared/MetricCard";
import { AttributionScore, EfficiencyMetric } from "@/types/findings";
import { Tooltip } from "./shared/Tooltip";

interface GlobalImpactOverviewProps {
  attributionScore: AttributionScore;
  efficiencyMetrics: EfficiencyMetric[];
}

export function GlobalImpactOverview({
  attributionScore,
  efficiencyMetrics,
}: GlobalImpactOverviewProps) {
  return (
    <section className="mb-16">
      <SectionHeader
        subtitle="Attribution & Efficiency Analysis"
        title="ML Impact Quantification"
        description="Attribution scoring estimates ML vs domain insight contribution using weighted analysis of integration levels. Efficiency metrics track reproducibility (code availability), ML adoption growth, and research output over time (2007-2022)."
      />

      {/* Attribution Score Visualization */}
      <div className="glass rounded-2xl p-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <h3 className="text-lg font-semibold text-white/90">
            Attribution Score: ML vs Domain Insight
          </h3>
          <Tooltip content="Estimated contribution of ML tooling vs domain-specific insight to scientific outcomes. Based on weighted analysis of ML integration levels across 7,200 papers." />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="flex items-baseline gap-3 mb-2">
              <p className="text-4xl font-bold text-blue-400">
                {attributionScore.mlContribution.toFixed(1)}%
              </p>
              <p className="text-sm text-white/60">ML Contribution</p>
            </div>
            <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                style={{ width: `${attributionScore.mlContribution}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-3 mb-2">
              <p className="text-4xl font-bold text-purple-400">
                {attributionScore.domainInsight.toFixed(1)}%
              </p>
              <p className="text-sm text-white/60">Domain Insight</p>
            </div>
            <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
                style={{ width: `${attributionScore.domainInsight}%` }}
              />
            </div>
          </div>
        </div>

        {/* Breakdown by ML Level */}
        <div className="border-t border-white/10 pt-4 mt-4">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-3">
            ML Contribution Breakdown by Integration Level
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="glass rounded-lg p-3">
              <p className="text-xs text-white/40 mb-1">Minimal</p>
              <p className="text-lg font-bold text-blue-300">
                {attributionScore.breakdown.minimal.toFixed(1)}%
              </p>
              <p className="text-xs text-white/30">Peripheral tool</p>
            </div>
            <div className="glass rounded-lg p-3">
              <p className="text-xs text-white/40 mb-1">Moderate</p>
              <p className="text-lg font-bold text-blue-400">
                {attributionScore.breakdown.moderate.toFixed(1)}%
              </p>
              <p className="text-xs text-white/30">Aids analysis</p>
            </div>
            <div className="glass rounded-lg p-3">
              <p className="text-xs text-white/40 mb-1">Substantial</p>
              <p className="text-lg font-bold text-blue-500">
                {attributionScore.breakdown.substantial.toFixed(1)}%
              </p>
              <p className="text-xs text-white/30">Key methodology</p>
            </div>
            <div className="glass rounded-lg p-3">
              <p className="text-xs text-white/40 mb-1">Core</p>
              <p className="text-lg font-bold text-blue-600">
                {attributionScore.breakdown.core.toFixed(1)}%
              </p>
              <p className="text-xs text-white/30">Research focus</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-white/40 mt-4 leading-relaxed">
          Confidence interval: [{attributionScore.confidenceInterval[0].toFixed(1)}%,{" "}
          {attributionScore.confidenceInterval[1].toFixed(1)}%] — Attribution weights: minimal=5%, moderate=15%, 
          substantial=40%, core=70% of research contribution. Domain insight remains primary driver across 
          all disciplines. Causal decomposition remains methodologically challenging.
        </p>
      </div>

      {/* Efficiency Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {efficiencyMetrics.map((metric, i) => (
          <MetricCard
            key={i}
            label={metric.label}
            value={metric.value.toLocaleString()}
            unit={metric.unit}
            tooltip={metric.description}
            sparkline={metric.trend}
          />
        ))}
      </div>
    </section>
  );
}
