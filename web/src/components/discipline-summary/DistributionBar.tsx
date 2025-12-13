interface Segment {
  label: string;
  value: number;
  color: string;
}

interface DistributionBarProps {
  segments: Segment[];
  total: number;
  showLabels?: boolean;
  height?: string;
}

export function DistributionBar({
  segments,
  total,
  showLabels = true,
  height = "h-8",
}: DistributionBarProps) {
  return (
    <div className="space-y-2">
      {/* Horizontal Stacked Bar */}
      <div className={`flex ${height} rounded-lg overflow-hidden bg-white/5`}>
        {segments.map((segment, index) => {
          const percentage = total > 0 ? (segment.value / total) * 100 : 0;
          return (
            <div
              key={index}
              className={`${segment.color} transition-all duration-300 flex items-center justify-center`}
              style={{ width: `${percentage}%` }}
            >
              {percentage > 10 && (
                <span className="text-xs font-semibold text-white/90">
                  {segment.value}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Labels */}
      {showLabels && (
        <div className="flex items-center gap-4 flex-wrap">
          {segments.map((segment, index) => {
            const percentage = total > 0 ? (segment.value / total) * 100 : 0;
            return (
              <div key={index} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-sm ${segment.color}`} />
                <span className="text-xs text-white/60">
                  {segment.label}: {segment.value} ({percentage.toFixed(1)}%)
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
