"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Code,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Award,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Discipline, Paper } from "@/types";
import { computeDisciplineSummary, computeGlobalAverages } from "@/utils/disciplineStats";
import { REAL_PAPERS } from "@/data/paperDataLoader";
import { MetricCard } from "./discipline-summary/MetricCard";
import { DistributionBar } from "./discipline-summary/DistributionBar";
import { TrendChart } from "./discipline-summary/TrendChart";
import { FrameworkBadge } from "./discipline-summary/FrameworkBadge";

interface DisciplineSummaryPanelProps {
  discipline: Discipline | null;
  papers: Paper[];
  isOpen: boolean;
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function DisciplineSummaryPanel({
  discipline,
  papers,
  isOpen,
  isCollapsed = false,
  onCollapsedChange,
}: DisciplineSummaryPanelProps) {
  const [showAllFrameworks, setShowAllFrameworks] = useState(false);
  const [showAllMethods, setShowAllMethods] = useState(false);

  const handleCollapsedChange = (collapsed: boolean) => {
    onCollapsedChange?.(collapsed);
  };

  const globalAverages = useMemo(() => computeGlobalAverages(REAL_PAPERS), []);

  const summary = useMemo(() => {
    if (!discipline || papers.length === 0) {
      return null;
    }
    return computeDisciplineSummary(papers, globalAverages);
  }, [papers, discipline, globalAverages]);

  if (!isOpen || !discipline || !summary) {
    return null;
  }

  const getImpactColor = (score: number) => {
    if (score <= 33) return "text-blue-400";
    if (score <= 66) return "text-purple-400";
    return "text-red-400";
  };

  const getDeltaColor = (delta: number) => {
    if (delta > 0) return "text-green-400";
    if (delta < 0) return "text-red-400";
    return "text-white/60";
  };

  const getDeltaIcon = (delta: number) => {
    if (delta > 0) return "↑";
    if (delta < 0) return "↓";
    return "→";
  };

  // Generate key insights
  const insights: string[] = [];
  if (summary.codeAvailabilityRate > 75) {
    insights.push(`High code availability (${summary.codeAvailabilityRate.toFixed(1)}%)`);
  }
  if (summary.yearDistribution.length > 0) {
    const recentYears = summary.yearDistribution.filter(
      (d) => d.year >= new Date().getFullYear() - 3
    );
    const recentPapers = recentYears.reduce((sum, d) => sum + d.count, 0);
    if (recentPapers / summary.totalPapers > 0.6) {
      insights.push("Emerging field with recent growth");
    } else {
      insights.push("Mature discipline with established history");
    }
  }
  if (summary.topFrameworks.length > 0 && summary.topFrameworks[0].percentage > 50) {
    insights.push(`${summary.topFrameworks[0].name} dominated (${summary.topFrameworks[0].percentage.toFixed(0)}%)`);
  }
  if (summary.avgImpactScore > globalAverages.avgImpactScore) {
    insights.push("Above average impact scores");
  }

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: isOpen ? (isCollapsed ? 48 : 384) : 0, opacity: isOpen ? 1 : 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed top-0 left-0 h-full z-20 glass-panel overflow-hidden"
    >
      {/* Collapsed State - Vertical Tab */}
      {isCollapsed && (
        <div className="h-full flex items-center justify-center p-2">
          <button
            onClick={() => handleCollapsedChange(false)}
            className="p-3 rounded-lg hover:bg-white/10 transition-colors group"
            aria-label="Expand panel"
          >
            <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-white/90" />
          </button>
        </div>
      )}

      {/* Expanded State - Full Panel */}
      {!isCollapsed && (
        <div className="h-full overflow-y-auto custom-scrollbar p-6">
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex items-center justify-end gap-2 mb-2">
              <h2 className="text-xl font-bold text-white/95 text-right">{discipline.name}</h2>
              <FileText className="w-5 h-5 text-white/70" />
            </div>
            <p className="text-xs text-white/50 text-right">
              {discipline.yearRange} • {summary.totalPapers} papers
            </p>
          </div>

        {/* Hero Metrics Cards */}
        <div className="space-y-3 mb-6">
          <MetricCard
            label="Total Papers"
            value={summary.totalPapers.toLocaleString()}
            subtitle={discipline.yearRange}
            icon={<FileText className="w-4 h-4 text-white/50" />}
          />
          <MetricCard
            label="Code Availability"
            value={`${summary.codeAvailabilityRate.toFixed(1)}%`}
            subtitle={`${summary.papersWithCode} of ${summary.totalPapers} papers`}
            icon={<Code className="w-4 h-4 text-white/50" />}
          />
          <MetricCard
            label="Avg Impact Score"
            value={summary.avgImpactScore.toFixed(1)}
            color={getImpactColor(summary.avgImpactScore)}
            icon={<Award className="w-4 h-4 text-white/50" />}
          />
        </div>

        {/* Impact Score Distribution */}
        <section className="mb-6">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3">
            Impact Distribution
          </h3>
          <DistributionBar
            segments={[
              {
                label: "Low (0-33)",
                value: summary.impactDistribution.low,
                color: "bg-blue-500",
              },
              {
                label: "Medium (34-66)",
                value: summary.impactDistribution.medium,
                color: "bg-purple-500",
              },
              {
                label: "High (67-100)",
                value: summary.impactDistribution.high,
                color: "bg-red-500",
              },
            ]}
            total={summary.totalPapers}
          />
        </section>

        {/* Papers Over Time */}
        <section className="mb-6">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3">
            Papers Over Time
          </h3>
          <TrendChart
            data={summary.yearDistribution.map((d) => ({ x: d.year, y: d.count }))}
            color="#3b82f6"
          />
        </section>

        {/* Impact Trends */}
        {summary.impactOverTime.length > 1 && (
          <section className="mb-6">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3">
              Impact Trend
            </h3>
            <TrendChart
              data={summary.impactOverTime.map((d) => ({ x: d.year, y: d.avgImpact }))}
              color="#8b5cf6"
            />
          </section>
        )}

        {/* Code Availability Trends */}
        {summary.codeAvailabilityOverTime.length > 1 && (
          <section className="mb-6">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3">
              Code Availability Trend
            </h3>
            <TrendChart
              data={summary.codeAvailabilityOverTime.map((d) => ({
                x: d.year,
                y: d.percentage,
              }))}
              color="#10b981"
            />
          </section>
        )}

        {/* Top ML Frameworks */}
        {summary.topFrameworks.length > 0 && (
          <section className="mb-6">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3">
              Top ML Frameworks
            </h3>
            <div className="space-y-3">
              {summary.topFrameworks.map((fw) => (
                <FrameworkBadge
                  key={fw.name}
                  name={fw.name}
                  count={fw.count}
                  percentage={fw.percentage}
                  maxPercentage={Math.max(...summary.topFrameworks.map((f) => f.percentage))}
                />
              ))}
            </div>
          </section>
        )}

        {/* Top Statistical Methods */}
        {summary.topMethods.length > 0 && (
          <section className="mb-6">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3">
              Top Statistical Methods
            </h3>
            <div className="space-y-3">
              {summary.topMethods.map((method) => (
                <FrameworkBadge
                  key={method.name}
                  name={method.name}
                  count={method.count}
                  percentage={method.percentage}
                  maxPercentage={Math.max(...summary.topMethods.map((m) => m.percentage))}
                />
              ))}
            </div>
          </section>
        )}

        {/* All Frameworks Overview */}
        {summary.allFrameworks.length > 10 && (
          <section className="mb-6">
            <button
              onClick={() => setShowAllFrameworks(!showAllFrameworks)}
              className="w-full flex items-center justify-between text-sm font-semibold text-white/60 uppercase tracking-wide mb-3 hover:text-white/80 transition-colors"
            >
              <span>All Frameworks ({summary.allFrameworks.length})</span>
              {showAllFrameworks ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {showAllFrameworks && (
              <div className="glass rounded-lg p-4 max-h-60 overflow-y-auto custom-scrollbar">
                <div className="space-y-2">
                  {summary.allFrameworks.map((fw) => (
                    <div
                      key={fw.name}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-white/70">{fw.name}</span>
                      <span className="text-white/50">{fw.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* All Methods Overview */}
        {summary.allMethods.length > 10 && (
          <section className="mb-6">
            <button
              onClick={() => setShowAllMethods(!showAllMethods)}
              className="w-full flex items-center justify-between text-sm font-semibold text-white/60 uppercase tracking-wide mb-3 hover:text-white/80 transition-colors"
            >
              <span>All Methods ({summary.allMethods.length})</span>
              {showAllMethods ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {showAllMethods && (
              <div className="glass rounded-lg p-4 max-h-60 overflow-y-auto custom-scrollbar">
                <div className="space-y-2">
                  {summary.allMethods.map((method) => (
                    <div
                      key={method.name}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-white/70">{method.name}</span>
                      <span className="text-white/50">{method.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Comparative Performance */}
        <section className="mb-6">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3">
            vs Global Average
          </h3>
          <div className="space-y-3">
            <div className="glass rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">Impact Score</span>
                <span className={`text-lg font-bold ${getDeltaColor(summary.vsGlobal.impactDelta)}`}>
                  {getDeltaIcon(summary.vsGlobal.impactDelta)} {Math.abs(summary.vsGlobal.impactDelta).toFixed(1)}
                </span>
              </div>
            </div>
            <div className="glass rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">Code Availability</span>
                <span className={`text-lg font-bold ${getDeltaColor(summary.vsGlobal.codeDelta)}`}>
                  {getDeltaIcon(summary.vsGlobal.codeDelta)} {Math.abs(summary.vsGlobal.codeDelta).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Key Insights Summary */}
        {insights.length > 0 && (
          <section className="mb-6">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3">
              Key Insights
            </h3>
            <div className="glass rounded-lg p-4">
              <ul className="space-y-2">
                {insights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-white/70">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
        </div>
      )}
    </motion.div>
  );
}
