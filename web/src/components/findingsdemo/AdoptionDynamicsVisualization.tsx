"use client";

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell, PieChart, Pie } from "recharts";
import { getAdoptionDynamicsData } from "@/data/validationDataLoader";

export function AdoptionDynamicsVisualization() {
  const data = getAdoptionDynamicsData();

  // Prepare S-curve data - group by field and sort by year
  const sCurveData = data.adoptionCurves
    .filter(d => {
      // Only include fields with multiple years of data
      const fieldYears = data.adoptionCurves.filter(x => x.field === d.field);
      return fieldYears.length >= 2;
    })
    .sort((a, b) => a.year - b.year);

  // Get unique fields for S-curve
  const fieldsWithTemporal = [...new Set(sCurveData.map(d => d.field))];
  
  // Create year-indexed data
  const yearlyData = [...new Set(sCurveData.map(d => d.year))]
    .sort((a, b) => a - b)
    .map(year => {
      const point: any = { year };
      fieldsWithTemporal.forEach(field => {
        const fieldData = sCurveData.find(d => d.year === year && d.field === field);
        point[field] = fieldData?.adoptionRate || null;
      });
      return point;
    });

  // Colors for different fields
  const fieldColors: Record<string, string> = {
    "Computer Science": "#8b5cf6",
    "Psychology": "#ec4899",
    "Environmental Science": "#10b981",
    "Economics": "#f59e0b",
    "Biology": "#3b82f6",
    "Engineering": "#ef4444",
    "Mathematics": "#06b6d4",
    "Physics": "#84cc16",
    "Medicine": "#f97316",
  };

  // Prepare discipline comparison data
  const topDisciplines = data.disciplineComparison.slice(0, 10);

  // Prepare ML distribution data for stacked bar chart
  const distributionData = data.mlDistribution
    .filter(d => d.field !== "N/A")
    .sort((a, b) => {
      const totalML_a = a.minimal + a.moderate + a.substantial + a.core;
      const totalML_b = b.minimal + b.moderate + b.substantial + b.core;
      return totalML_b - totalML_a;
    })
    .slice(0, 10);

  // Prepare radar chart data for cross-discipline comparison
  const radarData = topDisciplines.slice(0, 6).map(d => ({
    field: d.field.length > 15 ? d.field.substring(0, 15) + "..." : d.field,
    "ML Adoption": d.mlAdoptionRate,
    "Significant ML": d.significantMLRate * 10, // Scale up for visibility
    "Core ML": d.coreMLRate * 20, // Scale up more for visibility
  }));

  // Pie chart for top fields by ML adoption
  const pieData = topDisciplines.slice(0, 8).map((d, i) => ({
    name: d.field,
    value: d.mlAdoptionRate,
    color: Object.values(fieldColors)[i] || "#6b7280",
  }));

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
          <div className="text-white/60 text-sm mb-1">Top Field by ML Adoption</div>
          <div className="text-2xl font-bold text-white/95">
            {topDisciplines[0].field}
          </div>
          <div className="text-white/40 text-xs mt-2">
            {topDisciplines[0].mlAdoptionRate.toFixed(1)}% adoption rate
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
          <div className="text-white/60 text-sm mb-1">Fields with Core ML Usage</div>
          <div className="text-3xl font-bold text-white/95">
            {data.disciplineComparison.filter(d => d.coreMLRate > 1).length}
          </div>
          <div className="text-white/40 text-xs mt-2">
            ML as central methodology
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
          <div className="text-white/60 text-sm mb-1">Average Adoption Growth</div>
          <div className="text-3xl font-bold text-white/95">
            {(() => {
              // Calculate average year-over-year growth
              const growthRates: number[] = [];
              fieldsWithTemporal.forEach(field => {
                const fieldData = sCurveData
                  .filter(d => d.field === field)
                  .sort((a, b) => a.year - b.year);
                
                for (let i = 1; i < fieldData.length; i++) {
                  const growth = fieldData[i].adoptionRate - fieldData[i-1].adoptionRate;
                  if (growth > 0) growthRates.push(growth);
                }
              });
              
              const avgGrowth = growthRates.length > 0 
                ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length
                : 0;
              
              return avgGrowth.toFixed(1);
            })()}%
          </div>
          <div className="text-white/40 text-xs mt-2">
            Per year across disciplines
          </div>
        </div>
      </div>

      {/* S-Curve Adoption Patterns */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white/95 mb-2">
          S-Curve Adoption Patterns (2007-2022)
        </h3>
        <p className="text-white/60 text-sm mb-6">
          Temporal evolution showing how ML techniques spread across scientific disciplines
        </p>
        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={yearlyData}>
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
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                formatter={(value: any) => value !== null ? `${Number(value).toFixed(1)}%` : "N/A"}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px" }}
              />
              {fieldsWithTemporal.map((field) => (
                <Line
                  key={field}
                  type="monotone"
                  dataKey={field}
                  stroke={fieldColors[field] || "#6b7280"}
                  strokeWidth={2}
                  dot={{ fill: fieldColors[field] || "#6b7280", r: 4 }}
                  activeDot={{ r: 6 }}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-white/40 text-xs mt-4">
          Classic S-curve patterns visible: early adoption phase (2007-2015), rapid growth phase (2016-2021), 
          and plateau/maturation phase (2022+). Computer Science and Psychology lead adoption.
        </p>
      </div>

      {/* Cross-Discipline Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Overall Adoption */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white/95 mb-2">
            Cross-Discipline ML Adoption
          </h3>
          <p className="text-white/60 text-sm mb-4">
            Overall ML adoption rates by field
          </p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topDisciplines} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis
                  type="number"
                  stroke="#ffffff60"
                  style={{ fontSize: "11px" }}
                />
                <YAxis
                  type="category"
                  dataKey="field"
                  stroke="#ffffff60"
                  style={{ fontSize: "10px" }}
                  width={100}
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
                <Bar dataKey="mlAdoptionRate" fill="#8b5cf6" name="ML Adoption Rate">
                  {topDisciplines.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(fieldColors)[index] || "#8b5cf6"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart - Distribution */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white/95 mb-2">
            ML Adoption Distribution
          </h3>
          <p className="text-white/60 text-sm mb-4">
            Relative adoption across top disciplines
          </p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name.split(" ")[0]}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(value: any) => `${Number(value).toFixed(1)}%`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ML Integration Depth - Stacked Bar */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white/95 mb-2">
          ML Integration Depth by Discipline
        </h3>
        <p className="text-white/60 text-sm mb-6">
          Distribution of ML usage levels: minimal, moderate, substantial, and core
        </p>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distributionData} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis
                type="number"
                stroke="#ffffff60"
                style={{ fontSize: "11px" }}
                label={{ value: "Distribution (%)", position: "insideBottom", fill: "#ffffff60", offset: -5 }}
              />
              <YAxis
                type="category"
                dataKey="field"
                stroke="#ffffff60"
                style={{ fontSize: "10px" }}
                width={100}
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
              <Bar dataKey="minimal" stackId="a" fill="#3b82f6" name="Minimal" />
              <Bar dataKey="moderate" stackId="a" fill="#8b5cf6" name="Moderate" />
              <Bar dataKey="substantial" stackId="a" fill="#ec4899" name="Substantial" />
              <Bar dataKey="core" stackId="a" fill="#ef4444" name="Core" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-white/40 text-xs mt-4">
          Integration depth indicates how central ML is to research methodology. 
          Computer Science shows highest core ML usage, while traditional sciences show more minimal/moderate adoption.
        </p>
      </div>

      {/* Radar Chart - Multi-dimensional Comparison */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white/95 mb-2">
          Multi-Dimensional ML Integration Profile
        </h3>
        <p className="text-white/60 text-sm mb-6">
          Comparing overall adoption, significant usage, and core integration across top fields
        </p>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="#ffffff30" />
              <PolarAngleAxis
                dataKey="field"
                stroke="#ffffff60"
                style={{ fontSize: "11px" }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                stroke="#ffffff40"
                style={{ fontSize: "10px" }}
              />
              <Radar
                name="ML Integration"
                dataKey="ML Adoption"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.6}
              />
              <Radar
                name="Significant ML"
                dataKey="Significant ML"
                stroke="#ec4899"
                fill="#ec4899"
                fillOpacity={0.4}
              />
              <Radar
                name="Core ML"
                dataKey="Core ML"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.4}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-white/40 text-xs mt-4">
          Note: Significant ML and Core ML values are scaled (10x and 20x respectively) for visualization clarity. 
          Computer Science dominates in all dimensions of ML integration.
        </p>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-6">
          <div className="text-blue-300 font-semibold mb-2">📈 S-Curve Maturation</div>
          <p className="text-white/80 text-sm leading-relaxed">
            Most disciplines show classic S-curve adoption: slow early growth (2007-2015), rapid acceleration (2016-2020), 
            and plateauing (2021+). This suggests ML is becoming standard rather than novel in many fields.
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-6">
          <div className="text-purple-300 font-semibold mb-2">🎯 Integration Depth</div>
          <p className="text-white/80 text-sm leading-relaxed">
            Computer Science leads with 6.4% core ML usage, followed by Psychology (1.0%). Most fields remain at 
            minimal/moderate integration, indicating ML is complementary rather than transformative for most disciplines.
          </p>
        </div>
      </div>
    </div>
  );
}
