interface FrameworkBadgeProps {
  name: string;
  count: number;
  percentage: number;
  maxPercentage?: number;
}

export function FrameworkBadge({
  name,
  count,
  percentage,
  maxPercentage = 100,
}: FrameworkBadgeProps) {
  const barWidth = (percentage / maxPercentage) * 100;

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-white/80 font-medium">{name}</span>
        <span className="text-xs text-white/50">
          {count} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}
