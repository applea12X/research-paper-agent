"use client";

import { useState, useMemo } from "react";
import { SectionHeader } from "./shared/SectionHeader";
import { DisciplineMetric } from "@/types/findings";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Tooltip } from "./shared/Tooltip";

interface DisciplineComparisonProps {
  disciplines: DisciplineMetric[];
}

type SortKey = keyof DisciplineMetric;
type SortDirection = "asc" | "desc";

export function DisciplineComparison({ disciplines }: DisciplineComparisonProps) {
  const [sortKey, setSortKey] = useState<SortKey>("netImpactRating");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const sortedDisciplines = useMemo(() => {
    return [...disciplines].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  }, [disciplines, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  return (
    <section className="mb-16">
      <SectionHeader
        subtitle="Cross-Discipline Impact Analysis"
        title="Discipline-by-Discipline Comparison"
        description="Compare ML adoption rates (%), estimated acceleration (months saved), citation lift multipliers, reproducibility scores (code availability scaled 0-100), and composite net impact ratings. Net impact combines adoption (40%), reproducibility (30%), and significant ML usage (30%). Click column headers to sort."
      />

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <TableHeader
                  label="Discipline"
                  sortKey="disciplineName"
                  currentSort={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
                <TableHeader
                  label="ML Penetration"
                  sortKey="mlPenetration"
                  currentSort={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                  tooltip="Percentage of papers in this discipline using ML methods (2016-2024)"
                />
                <TableHeader
                  label="Acceleration"
                  sortKey="accelerationScore"
                  currentSort={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                  tooltip="Average months saved in discovery process through ML integration"
                />
                <TableHeader
                  label="Citation Lift"
                  sortKey="citationLift"
                  currentSort={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                  tooltip="Citation multiplier for ML-enabled papers vs traditional methods"
                />
                <TableHeader
                  label="Reproducibility"
                  sortKey="reproducibilitySignal"
                  currentSort={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                  tooltip="Code and data availability score (0-100)"
                />
                <TableHeader
                  label="Net Impact"
                  sortKey="netImpactRating"
                  currentSort={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                  tooltip="Composite score combining all impact metrics (0-100)"
                />
              </tr>
            </thead>
            <tbody>
              {sortedDisciplines.map((discipline, i) => (
                <tr
                  key={i}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-white/90">
                        {discipline.disciplineName}
                      </p>
                      <p className="text-xs text-white/40">
                        {discipline.paperCount.toLocaleString()} papers
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-400 rounded-full"
                          style={{ width: `${discipline.mlPenetration}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-white/80">
                        {discipline.mlPenetration.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-medium text-white/80">
                      {discipline.accelerationScore.toFixed(1)} mo
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-medium text-white/80">
                      {discipline.citationLift.toFixed(1)}x
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <ScoreBadge score={discipline.reproducibilitySignal} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <ScoreBadge score={discipline.netImpactRating} emphasis />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

interface TableHeaderProps {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
  tooltip?: string;
}

function TableHeader({
  label,
  sortKey,
  currentSort,
  direction,
  onSort,
  tooltip,
}: TableHeaderProps) {
  const isActive = currentSort === sortKey;

  return (
    <th className="px-6 py-4 text-left">
      <button
        onClick={() => onSort(sortKey)}
        className="flex items-center gap-2 text-xs font-semibold text-white/60 uppercase tracking-wide hover:text-white/80 transition-colors group"
      >
        <span>{label}</span>
        {tooltip && <Tooltip content={tooltip} />}
        <span className={`transition-opacity ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40"}`}>
          {isActive && direction === "desc" ? (
            <ArrowDown className="w-3 h-3" />
          ) : isActive && direction === "asc" ? (
            <ArrowUp className="w-3 h-3" />
          ) : (
            <ArrowUpDown className="w-3 h-3" />
          )}
        </span>
      </button>
    </th>
  );
}

function ScoreBadge({ score, emphasis = false }: { score: number; emphasis?: boolean }) {
  const getColor = (score: number) => {
    if (score >= 80) return emphasis ? "bg-green-500/20 text-green-300 border-green-500/30" : "text-green-400";
    if (score >= 60) return emphasis ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" : "text-yellow-400";
    return emphasis ? "bg-red-500/20 text-red-300 border-red-500/30" : "text-red-400";
  };

  if (emphasis) {
    return (
      <span
        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getColor(score)}`}
      >
        {score}
      </span>
    );
  }

  return (
    <span className={`text-sm font-medium ${getColor(score)}`}>
      {score}
    </span>
  );
}
