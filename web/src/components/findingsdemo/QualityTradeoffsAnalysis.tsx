"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ScatterChart, Scatter, ZAxis } from "recharts";
import { getQualityTradeoffsData } from "@/data/validationDataLoader";

export function QualityTradeoffsAnalysis() {
  const data = getQualityTradeoffsData();

  // Sort reproducibility comparison by delta
  const reproducibilityChart = [...data.reproducibilityComparison]
    .sort((a, b) => b.delta - a.delta);

  // Prepare code availability by ML level
  const codeByLevel = [...data.codeAvailabilityByLevel]
    .sort((a, b) => {
      const order = ["None", "Minimal", "Moderate", "Substantial", "Core"];
      return order.indexOf(a.level) - order.indexOf(b.level);
    });

  // Top frameworks
  const topFrameworksChart = data.topFrameworks.slice(0, 12);

  // Prepare scatter data for ML adoption vs code availability
  const scatterData = data.reproducibilityComparison.map(d => ({
    mlAdoption: d.mlAdoptionRate,
    codeAvailability: d.mlCodeAvailability,
    field: d.field,
    delta: d.delta,
  }));

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
          <div className="text-white/60 text-sm mb-1">Overall Code Availability</div>
          <div className="text-3xl font-bold text-white/95">
            {data.aggregate.aggregate_code_availability_rate.toFixed(1)}%
          </div>
          <div className="text-white/40 text-xs mt-2">
            Across all papers
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
          <div className="text-white/60 text-sm mb-1">Best Reproducibility Field</div>
          <div className="text-lg font-bold text-white/95">
            {reproducibilityChart[0]?.field.split(" ")[0]}
          </div>
          <div className="text-white/40 text-xs mt-2">
            +{reproducibilityChart[0]?.delta.toFixed(1)}% with ML
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
          <div className="text-white/60 text-sm mb-1">Core ML Papers</div>
          <div className="text-3xl font-bold text-white/95">
            {codeByLevel.find(d => d.level === "Core")?.rate.toFixed(1) || "0"}%
          </div>
          <div className="text-white/40 text-xs mt-2">
            Code availability rate
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
          <div className="text-white/60 text-sm mb-1">Most Used Framework</div>
          <div className="text-lg font-bold text-white/95">
            {topFrameworksChart[0]?.framework}
          </div>
          <div className="text-white/40 text-xs mt-2">
            {topFrameworksChart[0]?.count} mentions
          </div>
        </div>
      </div>

      {/* Reproducibility Comparison: ML vs Non-ML */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white/95 mb-2">
          Code Availability: ML vs Non-ML Papers
        </h3>
        <p className="text-white/60 text-sm mb-6">
          Comparing code availability rates between papers using ML and those not using ML by discipline
        </p>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reproducibilityChart} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis
                type="number"
                stroke="#ffffff60"
                style={{ fontSize: "11px" }}
                label={{ value: "Code Availability Rate (%)", position: "insideBottom", fill: "#ffffff60", offset: -5 }}
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
              <Bar dataKey="noMLCodeAvailability" fill="#6b7280" name="Non-ML Papers" />
              <Bar dataKey="mlCodeAvailability" fill="#8b5cf6" name="ML Papers" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-white/40 text-xs mt-4">
          Positive delta indicates ML papers have better code availability. Mixed results across fields: 
          some show improved reproducibility with ML, others show decline.
        </p>
      </div>

      {/* Code Availability by ML Integration Level */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white/95 mb-2">
          Code Availability by ML Integration Level
        </h3>
        <p className="text-white/60 text-sm mb-6">
          Reproducibility signal across different levels of ML usage (aggregate across all fields)
        </p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={codeByLevel}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis
                dataKey="level"
                stroke="#ffffff60"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                stroke="#ffffff60"
                style={{ fontSize: "12px" }}
                label={{ value: "Code Availability Rate (%)", angle: -90, position: "insideLeft", fill: "#ffffff60" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                formatter={(value: any, name: string) => {
                  if (name === "rate") return `${Number(value).toFixed(1)}%`;
                  return `${value.toLocaleString()} papers`;
                }}
              />
              <Legend />
              <Bar dataKey="rate" fill="#10b981" name="Code Availability Rate">
                {codeByLevel.map((entry, index) => {
                  const colors = ["#6b7280", "#3b82f6", "#8b5cf6", "#ec4899", "#ef4444"];
                  return <Bar key={index} fill={colors[index]} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-5 gap-2 text-xs">
          {codeByLevel.map((level, idx) => (
            <div key={idx} className="bg-white/5 rounded p-2 text-center">
              <div className="text-white/60">{level.level}</div>
              <div className="text-white/90 font-semibold">{level.totalPapers.toLocaleString()}</div>
              <div className="text-white/40">papers</div>
            </div>
          ))}
        </div>
        <p className="text-white/40 text-xs mt-4">
          Moderate ML usage shows highest code availability (11.4%), suggesting researchers who use ML 
          as a tool (not core focus) prioritize reproducibility. Core ML papers show surprisingly low rates.
        </p>
      </div>

      {/* Scatter Plot: ML Adoption vs Code Availability */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white/95 mb-2">
          ML Adoption vs Code Availability Correlation
        </h3>
        <p className="text-white/60 text-sm mb-6">
          Does higher ML adoption correlate with better reproducibility practices?
        </p>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis
                dataKey="mlAdoption"
                name="ML Adoption"
                stroke="#ffffff60"
                style={{ fontSize: "12px" }}
                label={{ value: "ML Adoption Rate (%)", position: "insideBottom", fill: "#ffffff60", offset: -5 }}
              />
              <YAxis
                dataKey="codeAvailability"
                name="Code Availability"
                stroke="#ffffff60"
                style={{ fontSize: "12px" }}
                label={{ value: "Code Availability (%)", angle: -90, position: "insideLeft", fill: "#ffffff60" }}
              />
              <ZAxis dataKey="delta" range={[50, 400]} name="Delta" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                formatter={(value: any, name: string) => [
                  `${Number(value).toFixed(1)}${name === "delta" ? "% delta" : "%"}`,
                  name === "mlAdoption" ? "ML Adoption" : name === "codeAvailability" ? "Code Avail." : "Delta"
                ]}
                labelFormatter={(label: any) => scatterData.find((_, i) => i === label)?.field || ""}
              />
              <Scatter
                data={scatterData}
                fill="#ec4899"
                fillOpacity={0.7}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <p className="text-white/40 text-xs mt-4">
          Bubble size represents the delta (difference) between ML and non-ML code availability. 
          No strong linear correlation visible, suggesting field-specific factors dominate reproducibility practices.
        </p>
      </div>

      {/* Top ML Frameworks */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white/95 mb-2">
          Most Cited ML Frameworks & Tools
        </h3>
        <p className="text-white/60 text-sm mb-6">
          Frequency of framework mentions across all analyzed papers (top 12)
        </p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topFrameworksChart} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis
                type="number"
                stroke="#ffffff60"
                style={{ fontSize: "11px" }}
              />
              <YAxis
                type="category"
                dataKey="framework"
                stroke="#ffffff60"
                style={{ fontSize: "10px" }}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                formatter={(value: any) => [`${value} mentions`, "Count"]}
              />
              <Bar dataKey="count" fill="#3b82f6" name="Mentions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-white/40 text-xs mt-4">
          SPSS dominates (traditional statistics), followed by R and MATLAB. Modern ML frameworks (Python, TensorFlow) 
          have lower visibility, possibly due to lower documentation or recency bias in older papers.
        </p>
      </div>

      {/* Detailed Reproducibility Table */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white/95 mb-2">
          Detailed Reproducibility Breakdown by Field
        </h3>
        <p className="text-white/60 text-sm mb-4">
          Field-by-field comparison of code availability between ML and non-ML papers
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left py-3 px-4 text-white/70 font-semibold">Field</th>
                <th className="text-right py-3 px-4 text-white/70 font-semibold">ML Adoption</th>
                <th className="text-right py-3 px-4 text-white/70 font-semibold">Non-ML Code %</th>
                <th className="text-right py-3 px-4 text-white/70 font-semibold">ML Code %</th>
                <th className="text-right py-3 px-4 text-white/70 font-semibold">Delta</th>
                <th className="text-center py-3 px-4 text-white/70 font-semibold">Impact</th>
              </tr>
            </thead>
            <tbody>
              {reproducibilityChart.map((row, idx) => (
                <tr key={idx} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 text-white/90">{row.field}</td>
                  <td className="py-3 px-4 text-right text-white/70">{row.mlAdoptionRate.toFixed(1)}%</td>
                  <td className="py-3 px-4 text-right text-white/70">{row.noMLCodeAvailability.toFixed(1)}%</td>
                  <td className="py-3 px-4 text-right text-white/70">{row.mlCodeAvailability.toFixed(1)}%</td>
                  <td className={`py-3 px-4 text-right font-semibold ${row.delta >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {row.delta >= 0 ? "+" : ""}{row.delta.toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.delta >= 5 ? "🟢" : row.delta >= 0 ? "🟡" : row.delta >= -5 ? "🟠" : "🔴"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-white/40 text-xs mt-4">
          🟢 Positive impact (+5% or more) | 🟡 Slight positive (0-5%) | 🟠 Slight negative (0 to -5%) | 🔴 Negative (-5% or more)
        </p>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-6">
          <div className="text-green-300 font-semibold mb-2">✅ Positive Signal</div>
          <p className="text-white/80 text-sm leading-relaxed">
            Moderate ML integration shows highest code availability (11.4%), suggesting that researchers who 
            use ML as a complementary tool prioritize reproducibility. Computer Science leads with 11.85% overall.
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg p-6">
          <div className="text-amber-300 font-semibold mb-2">⚠️ Trade-off Evidence</div>
          <p className="text-white/80 text-sm leading-relaxed">
            No consistent correlation between ML adoption and code availability across fields. Some fields show 
            improved reproducibility with ML (Computer Science, Psychology), while others show decline. 
            Field-specific culture dominates ML impact.
          </p>
        </div>
      </div>
    </div>
  );
}
