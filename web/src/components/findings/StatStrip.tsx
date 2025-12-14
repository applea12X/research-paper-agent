import { GlobalMetrics } from "@/types/findings";

interface StatStripProps {
  metrics: GlobalMetrics;
}

export function StatStrip({ metrics }: StatStripProps) {
  const formatDecimal = (value: number) => Number(value.toFixed(3));

  const stats = [
    {
      label: "ML Penetration (2016-2024)",
      value: `${formatDecimal(metrics.mlPenetration)}%`,
      description: "of papers use machine learning methods",
    },
    {
      label: "Discovery Acceleration",
      value: `${formatDecimal(metrics.discoveryAcceleration)}`,
      unit: "months",
      description: "median time saved in discovery process",
    },
    {
      label: "Strongest Impact Field",
      value: metrics.strongestField,
      description: "discipline showing highest ML lift",
    },
    {
      label: "Reproducibility Delta",
      value: `${formatDecimal(metrics.reproducibilityDelta)}%`,
      description: "ML vs non-ML code availability gap",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <div key={i} className="glass rounded-xl p-5 border border-white/5">
          <div className="flex items-baseline gap-2 mb-2">
            <p className="text-2xl font-bold text-white/95">{stat.value}</p>
            {stat.unit && (
              <p className="text-sm text-white/50 font-medium">{stat.unit}</p>
            )}
          </div>
          <p className="text-xs font-medium text-white/50 uppercase tracking-wide mb-1">
            {stat.label}
          </p>
          <p className="text-xs text-white/40 leading-relaxed">
            {stat.description}
          </p>
        </div>
      ))}
    </div>
  );
}
