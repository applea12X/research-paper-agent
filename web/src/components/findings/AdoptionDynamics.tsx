"use client";

import { useRef, useEffect } from "react";
import { SectionHeader } from "./shared/SectionHeader";
import { AdoptionCurve } from "@/types/findings";
import * as d3 from "d3";

interface AdoptionDynamicsProps {
  adoptionCurves: AdoptionCurve[];
}

export function AdoptionDynamics({ adoptionCurves }: AdoptionDynamicsProps) {
  const chartRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!chartRef.current || adoptionCurves.length === 0) return;

    const svg = d3.select(chartRef.current);
    svg.selectAll("*").remove();

    const container = chartRef.current.parentElement;
    if (!container) return;

    const width = container.clientWidth;
    const height = 400;
    const margin = { top: 20, right: 140, bottom: 50, left: 60 };

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Group data by discipline
    const disciplineGroups = d3.group(adoptionCurves, (d) => d.discipline);
    const disciplines = Array.from(disciplineGroups.keys());

    // Calculate actual year range from data
    const allYears = adoptionCurves.map(d => d.year);
    const minYear = Math.min(...allYears);
    const maxYear = Math.max(...allYears);
    const yearRange = [minYear, maxYear];

    // Calculate actual penetration range from data
    const allPenetrations = adoptionCurves.map(d => d.penetration);
    const maxPenetration = Math.max(...allPenetrations, 5); // At least 5% for visibility
    const minPenetration = Math.min(...allPenetrations, 0);
    // Add padding: 10% above max, ensure min is at least 0
    const penetrationRange = [
      Math.max(0, minPenetration - 2), 
      Math.ceil(maxPenetration * 1.15)
    ];

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain(yearRange)
      .range([0, chartWidth]);

    const yScale = d3
      .scaleLinear()
      .domain(penetrationRange)
      .range([chartHeight, 0]);

    // Extended color palette for all disciplines
    const colorPalette = [
      "#60a5fa", // blue
      "#a78bfa", // purple
      "#f472b6", // pink
      "#fbbf24", // yellow
      "#34d399", // green
      "#fb923c", // orange
      "#22d3ee", // cyan
      "#a855f7", // violet
      "#ec4899", // fuchsia
      "#14b8a6", // teal
      "#f59e0b", // amber
      "#8b5cf6", // indigo
      "#06b6d4", // sky
    ];
    
    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(disciplines)
      .range(colorPalette);

    // Grid lines
    g.append("g")
      .attr("class", "grid")
      .attr("opacity", 0.1)
      .call(
        d3.axisLeft(yScale)
          .tickSize(-chartWidth)
          .tickFormat(() => "")
      )
      .call((g) => g.select(".domain").remove());

    // Axes
    const yearSpan = maxYear - minYear;
    const numTicks = yearSpan <= 3 ? yearSpan + 1 : Math.min(9, yearSpan + 1);
    
    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale).tickFormat((d) => d.toString()).ticks(numTicks))
      .attr("color", "rgba(255,255,255,0.4)")
      .call((g) => g.select(".domain").attr("stroke", "rgba(255,255,255,0.1)"))
      .call((g) => g.selectAll(".tick line").attr("stroke", "rgba(255,255,255,0.1)"));

    g.append("g")
      .call(d3.axisLeft(yScale).tickFormat((d) => `${d}%`))
      .attr("color", "rgba(255,255,255,0.4)")
      .call((g) => g.select(".domain").attr("stroke", "rgba(255,255,255,0.1)"))
      .call((g) => g.selectAll(".tick line").attr("stroke", "rgba(255,255,255,0.1)"));

    // Axis labels
    g.append("text")
      .attr("x", chartWidth / 2)
      .attr("y", chartHeight + 40)
      .attr("text-anchor", "middle")
      .attr("fill", "rgba(255,255,255,0.5)")
      .attr("font-size", "12px")
      .text("Year");

    g.append("text")
      .attr("x", -chartHeight / 2)
      .attr("y", -45)
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("fill", "rgba(255,255,255,0.5)")
      .attr("font-size", "12px")
      .text("ML Penetration (%)");

    // Line generator
    const line = d3
      .line<AdoptionCurve>()
      .x((d) => xScale(d.year))
      .y((d) => yScale(d.penetration))
      .curve(d3.curveMonotoneX);

    // Draw lines for each discipline
    disciplineGroups.forEach((data, discipline) => {
      const sortedData = data.sort((a, b) => a.year - b.year);

      g.append("path")
        .datum(sortedData)
        .attr("fill", "none")
        .attr("stroke", colorScale(discipline))
        .attr("stroke-width", 2.5)
        .attr("stroke-opacity", 0.8)
        .attr("d", line);

      // Add points at all data points for better visibility
      sortedData.forEach((point) => {
        g.append("circle")
          .attr("cx", xScale(point.year))
          .attr("cy", yScale(point.penetration))
          .attr("r", 3)
          .attr("fill", colorScale(discipline))
          .attr("stroke", "rgba(255,255,255,0.3)")
          .attr("stroke-width", 1)
          .attr("opacity", 0.8);
      });

      // Highlight inflection points (years with significant jumps)
      if (sortedData.length >= 2) {
        for (let i = 1; i < sortedData.length; i++) {
          const prev = sortedData[i - 1];
          const curr = sortedData[i];
          const growth = curr.penetration - prev.penetration;
          const growthRate = prev.penetration > 0 ? (growth / prev.penetration) * 100 : 0;
          
          // Mark as inflection if growth rate > 50%
          if (growthRate > 50 && growth > 5) {
            g.append("circle")
              .attr("cx", xScale(curr.year))
              .attr("cy", yScale(curr.penetration))
              .attr("r", 5)
              .attr("fill", colorScale(discipline))
              .attr("stroke", "rgba(255,255,255,0.8)")
              .attr("stroke-width", 2);
          }
        }
      }
    });

    // Legend
    const legend = g
      .append("g")
      .attr("transform", `translate(${chartWidth + 15}, 0)`);

    disciplines.forEach((discipline, i) => {
      const legendRow = legend
        .append("g")
        .attr("transform", `translate(0, ${i * 24})`);

      legendRow
        .append("rect")
        .attr("width", 16)
        .attr("height", 3)
        .attr("fill", colorScale(discipline))
        .attr("rx", 1);

      legendRow
        .append("text")
        .attr("x", 22)
        .attr("y", 4)
        .attr("fill", "rgba(255,255,255,0.7)")
        .attr("font-size", "11px")
        .text(discipline);
    });
  }, [adoptionCurves]);

  return (
    <section className="mb-16">
      <SectionHeader
        subtitle="Temporal Evolution & S-Curves"
        title="Adoption Dynamics Across Disciplines"
        description="S-curve adoption patterns showing ML spread through scientific disciplines (2007-2022). Larger circles mark inflection points with >50% year-over-year growth. Note dramatic 2022 spike across multiple fields, suggesting watershed moment in ML accessibility and adoption."
      />

      <div className="glass rounded-2xl p-8">
        <svg ref={chartRef} className="w-full" />
      </div>

      <div className="mt-4 p-5 glass rounded-xl">
        <p className="text-sm text-white/60 leading-relaxed mb-3">
          <span className="font-semibold text-white/80">Key Observations:</span>
        </p>
        <ul className="text-sm text-white/60 leading-relaxed space-y-2 list-disc list-inside">
          <li>
            <span className="font-semibold text-blue-400">2022 Inflection Point:</span> Multiple 
            disciplines show dramatic adoption spikes (CS: 93%, Psych: 52%, Bio: 61%), suggesting 
            breakthrough in ML accessibility (likely transformer models, AutoML, cloud computing).
          </li>
          <li>
            <span className="font-semibold text-purple-400">Three-Tier Pattern:</span> Leaders 
            (CS 37%, Psych 17%), Emerging (Env Sci 15%, Econ 13%), Laggards (Math 3%, Eng 8%). 
            Reflects data availability, interpretability needs, and methodological traditions.
          </li>
          <li>
            <span className="font-semibold text-green-400">S-Curve Maturity:</span> Computer Science 
            shows mature adoption curve (early steep growth, pre-2022 plateau), while Biology/Psychology 
            exhibit classic S-curve acceleration phase. Math/Engineering remain in innovation stage.
          </li>
          <li>
            <span className="font-semibold text-yellow-400">Data Limitations:</span> Limited post-2022 
            data prevents validation of sustained adoption vs temporary spike. Some fields show sparse 
            temporal coverage due to dataset sampling.
          </li>
        </ul>
      </div>
    </section>
  );
}
