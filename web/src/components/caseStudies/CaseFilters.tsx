"use client";

interface CaseFiltersProps {
  domains: string[];
  selectedDomain: string;
  onDomainChange: (domain: string) => void;
  yearRange: [number, number];
  onYearRangeChange: (range: [number, number]) => void;
}

export function CaseFilters({
  domains,
  selectedDomain,
  onDomainChange,
  yearRange,
  onYearRangeChange
}: CaseFiltersProps) {
  return (
    <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
      <h3 className="text-sm font-medium text-white/80 mb-3">Filters</h3>
      
      {/* Domain Filter */}
      <div className="mb-4">
        <label className="block text-xs text-white/60 mb-2">Domain</label>
        <div className="flex flex-wrap gap-2">
          {domains.map((domain) => (
            <button
              key={domain}
              onClick={() => onDomainChange(domain)}
              className={`px-3 py-1 text-xs rounded-full border transition-all ${
                selectedDomain === domain
                  ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                  : "bg-white/5 text-white/60 border-white/20 hover:bg-white/10 hover:text-white/80"
              }`}
            >
              {domain}
            </button>
          ))}
        </div>
      </div>

      {/* Year Range Filter */}
      <div>
        <label className="block text-xs text-white/60 mb-2">Year Range</label>
        <div className="flex gap-2 items-center">
          <select
            value={yearRange[0]}
            onChange={(e) => onYearRangeChange([Number(e.target.value), yearRange[1]])}
            className="flex-1 px-2 py-1 text-xs bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
          >
            {[2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <span className="text-white/40 text-xs">to</span>
          <select
            value={yearRange[1]}
            onChange={(e) => onYearRangeChange([yearRange[0], Number(e.target.value)])}
            className="flex-1 px-2 py-1 text-xs bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
          >
            {[2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}