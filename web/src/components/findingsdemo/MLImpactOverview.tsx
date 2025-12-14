"use client";

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from "recharts";
import { getMLImpactData } from "@/data/validationDataLoader";

export function MLImpactOverview() {
  const data = getMLImpactData();

  // Prepare temporal data for line chart (ML adoption over time)
  const temporalByField = data.temporal.reduce((acc, item) => {
    if (!acc[item.field]) {
      acc[item.field] = [];
    }
    acc[item.field].push({ year: item.year, mlRate: item.mlRate });
    return acc;
  }, {} as Record<string, Array<{ year: number; mlRate: number }>>);

  // Get top 6 fields by average ML rate for cleaner visualization
  const topFields = Object.entries(temporalByField)
    .map(([field, values]) => ({
      field,
      avgRate: values.reduce((sum, v) => sum + v.mlRate, 0) / values.length,
    }))
    .sort((a, b) => b.avgRate - a.avgRate)
    .slice(0, 6)
    .map(d => d.field);

  // Create unified temporal data for top fields
  const allYears = [...new Set(data.temporal.map(d => d.year))].sort();
  const temporalChart = allYears.map(year => {
    const point: any = { year };
    topFields.forEach(field => {
      const fieldData = data.temporal.find(d => d.year === year && d.field === field);
      point[field] = fieldData?.mlRate || 0;
    });
    return point;
  });

  // Prepare attribution data for bar chart
  const attributionChart = data.attribution
    .sort((a, b) => b.mlAdoptionRate - a.mlAdoptionRate)
    .slice(0, 10);

  // Colors for fields
  const fieldColors = [
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#10b981", // green
    "#f59e0b", // amber
    "#3b82f6", // blue
    "#ef4444", // red
  ];

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
          <div className="text-white/60 text-sm mb-1">Aggregate ML Adoption</div>
          <div className="text-3xl font-bold text-white/95">
            {data.aggregate.aggregate_ml_adoption_rate.toFixed(1)}%
          </div>
          <div className="text-white/40 text-xs mt-2">
            Across {data.aggregate.total_fields} disciplines
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
          <div className="text-white/60 text-sm mb-1">Total Papers Analyzed</div>
          <div className="text-3xl font-bold text-white/95">
            {data.aggregate.total_papers_analyzed.toLocaleString()}
          </div>
          <div className="text-white/40 text-xs mt-2">
            Comprehensive dataset
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
          <div className="text-white/60 text-sm mb-1">Code Availability</div>
          <div className="text-3xl font-bold text-white/95">
            {data.aggregate.aggregate_code_availability_rate.toFixed(1)}%
          </div>
          <div className="text-white/40 text-xs mt-2">
            Overall reproducibility signal
          </div>
        </div>
      </div>

      {/* ML Adoption Over Time */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white/95 mb-2">
          ML Adoption Over Time
        </h3>
        <p className="text-white/60 text-sm mb-6">
          Temporal evolution of machine learning integration across top disciplines (2007-2022)
        </p>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={temporalChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis
                dataKey="year"
                stroke="#ffffff60"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                stroke="#ffffff60"
                style={{ fontSize: "12px" }}
                label={{ value: "ML Adoption Rate (%)", angle: -90, position: "insideLeft", fill: "#ffffff60" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                formatter={(value: any) => [`${Number(value).toFixed(1)}%`, ""]}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", color: "#ffffff90" }}
              />
              {topFields.map((field, index) => (
                <Line
                  key={field}
                  type="monotone"
                  dataKey={field}
                  stroke={fieldColors[index]}
                  strokeWidth={2}
                  dot={{ fill: fieldColors[index], r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-white/40 text-xs mt-4">
          Shows S-curve adoption patterns across disciplines. Computer Science and Psychology show highest adoption rates.
        </p>
      </div>

      {/* Attribution Scoring */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white/95 mb-2">
          ML Attribution Scoring
        </h3>
        <p className="text-white/60 text-sm mb-6">
          Estimated contribution of ML vs. domain insight in breakthrough discoveries by field
        </p>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={attributionChart}
              layout="vertical"
              margin={{ left: 120 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis
                type="number"
                stroke="#ffffff60"
                style={{ fontSize: "12px" }}
                label={{ value: "Contribution (%)", position: "insideBottom", fill: "#ffffff60", offset: -5 }}
              />
              <YAxis
                type="category"
                dataKey="field"
                stroke="#ffffff60"
                style={{ fontSize: "11px" }}
                width={120}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                formatter={(value: any) => `${Number(value).toFixed(1)}%`}
              />
              <Legend />
              <Bar dataKey="mlContribution" name="ML Contribution" fill="#8b5cf6" stackId="a" />
              <Bar dataKey="domainInsight" name="Domain Insight" fill="#10b981" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-white/40 text-xs mt-4">
          Attribution based on ML integration levels (minimal, moderate, substantial, core). Higher ML levels indicate greater ML contribution to research outcomes.
        </p>
      </div>

      {/* Efficiency Metrics Scatter */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white/95 mb-2">
          Discovery Efficiency: ML Adoption vs. Validation Rates
        </h3>
        <p className="text-white/60 text-sm mb-6">
          Correlation between ML adoption and research validation practices
        </p>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis
                dataKey="mlAdoptionRate"
                name="ML Adoption Rate"
                stroke="#ffffff60"
                style={{ fontSize: "12px" }}
                label={{ value: "ML Adoption Rate (%)", position: "insideBottom", fill: "#ffffff60", offset: -5 }}
              />
              <YAxis
                dataKey="validationRate"
                name="Validation Rate"
                stroke="#ffffff60"
                style={{ fontSize: "12px" }}
                label={{ value: "Validation Rate (%)", angle: -90, position: "insideLeft", fill: "#ffffff60" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                formatter={(value: any, name: string) => [
                  `${Number(value).toFixed(1)}%`,
                  name === "mlAdoptionRate" ? "ML Adoption" : "Validation Rate"
                ]}
                labelFormatter={(label: any) => data.efficiency.find(d => d.mlAdoptionRate === label)?.field || ""}
              />
              <Scatter
                data={data.efficiency}
                fill="#ec4899"
                fillOpacity={0.7}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <p className="text-white/40 text-xs mt-4">
          Each point represents a discipline. Shows whether fields with higher ML adoption also maintain strong validation practices.
        </p>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-6">
          <div className="text-purple-300 font-semibold mb-2">🚀 Acceleration Metrics</div>
          <p className="text-white/80 text-sm leading-relaxed">
            Computer Science shows 93.2% ML adoption in 2022, indicating near-complete integration. 
            Other fields like Psychology and Biology show rapid growth from ~10% to 50%+ in recent years.
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg p-6">
          <div className="text-green-300 font-semibold mb-2">📊 Attribution Insights</div>
          <p className="text-white/80 text-sm leading-relaxed">
            Fields with higher ML integration levels (substantial/core) show 50-75% ML contribution, 
            while minimal adopters show 25-40% contribution. Domain expertise remains critical across all fields.
          </p>
        </div>
      </div>
    </div>
  );
}
