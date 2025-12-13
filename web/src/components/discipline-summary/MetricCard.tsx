import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
}

export function MetricCard({
  label,
  value,
  subtitle,
  color,
  trend,
  icon,
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (trend === "up")
      return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (trend === "down")
      return <TrendingDown className="w-4 h-4 text-red-400" />;
    if (trend === "neutral")
      return <Minus className="w-4 h-4 text-white/40" />;
    return null;
  };

  return (
    <div className="glass rounded-xl p-5 border border-white/5">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-medium text-white/50 uppercase tracking-wide">
          {label}
        </p>
        {icon || getTrendIcon()}
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <p
          className={`text-3xl font-bold ${
            color || "text-white/95"
          } tracking-tight`}
        >
          {value}
        </p>
      </div>
      {subtitle && (
        <p className="text-xs text-white/40 mt-1">{subtitle}</p>
      )}
    </div>
  );
}
