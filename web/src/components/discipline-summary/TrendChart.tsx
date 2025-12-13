interface DataPoint {
  x: number;
  y: number;
}

interface TrendChartProps {
  data: DataPoint[];
  title?: string;
  color?: string;
  height?: number;
  yLabel?: string;
  xLabel?: string;
}

export function TrendChart({
  data,
  title,
  color = "#3b82f6",
  height = 120,
  yLabel = "",
  xLabel = "",
}: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-white/5 rounded-lg"
        style={{ height }}
      >
        <p className="text-xs text-white/40">No data available</p>
      </div>
    );
  }

  const padding = 30;
  const width = 320;

  // Find min/max for scaling
  const xValues = data.map((d) => d.x);
  const yValues = data.map((d) => d.y);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues, 0);
  const maxY = Math.max(...yValues);

  // Add padding to Y axis
  const yRange = maxY - minY;
  const paddedMinY = minY - yRange * 0.1;
  const paddedMaxY = maxY + yRange * 0.1;

  // Scale functions with NaN protection
  const scaleX = (x: number) => {
    if (maxX === minX) {
      // All x values are the same, center horizontally
      return width / 2;
    }
    return padding + ((x - minX) / (maxX - minX)) * (width - 2 * padding);
  };

  const scaleY = (y: number) => {
    if (paddedMaxY === paddedMinY || yRange === 0) {
      // All y values are the same, center vertically
      return height / 2;
    }
    return height - padding - ((y - paddedMinY) / (paddedMaxY - paddedMinY)) * (height - 2 * padding);
  };

  // Generate SVG path
  const pathData = data
    .map((d, i) => {
      const x = scaleX(d.x);
      const y = scaleY(d.y);
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(" ");

  // Generate area fill path
  const areaPath = data.length > 0
    ? `${pathData} L ${scaleX(data[data.length - 1].x)} ${height - padding} L ${scaleX(data[0].x)} ${height - padding} Z`
    : "";

  return (
    <div className="bg-white/5 rounded-lg p-3">
      {title && (
        <p className="text-xs text-white/60 mb-2 font-medium">{title}</p>
      )}
      <svg width={width} height={height} className="overflow-visible">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = height - padding - ratio * (height - 2 * padding);
          return (
            <line
              key={ratio}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="1"
            />
          );
        })}

        {/* Area fill */}
        {areaPath && (
          <path
            d={areaPath}
            fill={color}
            fillOpacity="0.1"
          />
        )}

        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={scaleX(d.x)}
            cy={scaleY(d.y)}
            r="4"
            fill={color}
            stroke="rgba(0, 0, 0, 0.5)"
            strokeWidth="2"
          />
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => {
          // Show every label for small datasets, or every other for larger ones
          const showLabel = data.length <= 5 || i % Math.ceil(data.length / 5) === 0;
          if (!showLabel) return null;

          return (
            <text
              key={`x-${i}`}
              x={scaleX(d.x)}
              y={height - 10}
              textAnchor="middle"
              className="text-[10px] fill-white/40"
            >
              {d.x}
            </text>
          );
        })}

        {/* Y-axis labels */}
        {[paddedMinY, paddedMaxY].map((value, i) => (
          <text
            key={`y-${i}`}
            x={padding - 5}
            y={i === 0 ? height - padding : padding}
            textAnchor="end"
            alignmentBaseline="middle"
            className="text-[10px] fill-white/40"
          >
            {isNaN(value) ? '0' : value.toFixed(0)}
          </text>
        ))}
      </svg>
    </div>
  );
}
