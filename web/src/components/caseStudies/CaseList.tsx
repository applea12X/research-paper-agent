"use client";

import { useState, useMemo } from "react";
import { Search, Filter } from "lucide-react";
import { CaseStudy } from "@/data/mockCaseStudies";
import { CaseFilters } from "./CaseFilters";

interface CaseListProps {
  cases: CaseStudy[];
  selectedCaseId: string;
  onCaseSelect: (caseId: string) => void;
}

export function CaseList({ cases, selectedCaseId, onCaseSelect }: CaseListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string>("All");
  const [yearRange, setYearRange] = useState<[number, number]>([2016, 2024]);

  const domains = useMemo(() => {
    const uniqueDomains = Array.from(new Set(cases.map(c => c.domain)));
    return ["All", ...uniqueDomains];
  }, [cases]);

  const filteredCases = useMemo(() => {
    return cases.filter(caseStudy => {
      // Search filter
      const matchesSearch = !searchTerm || 
        caseStudy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caseStudy.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caseStudy.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()));

      // Domain filter
      const matchesDomain = selectedDomain === "All" || caseStudy.domain === selectedDomain;

      // Year range filter
      const matchesYear = caseStudy.startYear <= yearRange[1] && caseStudy.endYear >= yearRange[0];

      return matchesSearch && matchesDomain && matchesYear;
    });
  }, [cases, searchTerm, selectedDomain, yearRange]);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white/90">Case Studies</h2>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-lg transition-colors ${
            showFilters ? "bg-blue-500/20 text-blue-300" : "hover:bg-white/10 text-white/60"
          }`}
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          placeholder="Search cases..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-colors"
        />
      </div>

      {/* Filters */}
      {showFilters && (
        <CaseFilters
          domains={domains}
          selectedDomain={selectedDomain}
          onDomainChange={setSelectedDomain}
          yearRange={yearRange}
          onYearRangeChange={setYearRange}
        />
      )}

      {/* Case List */}
      <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">
        {filteredCases.map((caseStudy) => (
          <div
            key={caseStudy.id}
            onClick={() => onCaseSelect(caseStudy.id)}
            className={`p-4 rounded-xl cursor-pointer transition-all ${
              selectedCaseId === caseStudy.id
                ? "bg-blue-500/20 border border-blue-500/30"
                : "bg-white/5 border border-white/10 hover:bg-white/10"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {caseStudy.domain}
              </span>
              <span className="text-xs text-white/40">
                {caseStudy.startYear}-{caseStudy.endYear}
              </span>
            </div>
            
            <h3 className="text-sm font-semibold text-white/90 mb-2 line-clamp-2">
              {caseStudy.title}
            </h3>
            
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                <span className="text-white/60">
                  Impact: {Math.round(caseStudy.headlineMetrics.mlImpactScore)}
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${
                  caseStudy.headlineMetrics.codeAvailabilityRate > 0.7 ? "bg-green-400" : 
                  caseStudy.headlineMetrics.codeAvailabilityRate > 0.4 ? "bg-yellow-400" : "bg-red-400"
                }`}></span>
                <span className="text-white/60">
                  Code: {Math.round(caseStudy.headlineMetrics.codeAvailabilityRate * 100)}%
                </span>
              </div>
            </div>
          </div>
        ))}
        
        {filteredCases.length === 0 && (
          <div className="text-center py-8 text-white/40">
            <p>No case studies match your filters</p>
          </div>
        )}
      </div>
    </>
  );
}