"use client";

import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Sidebar } from "@/components/Sidebar";
import { BubbleHeatmap } from "@/components/BubbleHeatmap";
import { DisciplineSummaryPanel } from "@/components/DisciplineSummaryPanel";
import { REAL_PAPERS, REAL_DISCIPLINES, getPapersByDiscipline } from "@/data/paperDataLoader";
import { FilterType, Discipline } from "@/types";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

export default function Home() {
  const [activeFilters, setActiveFilters] = useState<FilterType>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDiscipline, setSelectedDiscipline] = useState<Discipline | null>(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  const handleDisciplineClick = (discipline: Discipline) => {
    setSelectedDiscipline(discipline);
  };

  const handleBackToDisciplines = () => {
    setSelectedDiscipline(null);
    setIsPanelCollapsed(false); // Reset collapsed state when going back
  };

  const currentPapers = selectedDiscipline
    ? getPapersByDiscipline(REAL_PAPERS, selectedDiscipline.name, selectedDiscipline.startYear, selectedDiscipline.endYear)
    : REAL_PAPERS;

  const [allowedCategories, setAllowedCategories] = useState<string[] | undefined>(
    REAL_DISCIPLINES.map(d => d.name)
  );

  const isPanelOpen = selectedDiscipline !== null;
  const panelWidth = isPanelCollapsed ? 48 : 384;

  return (
    <main className="min-h-screen bg-black text-white selection:bg-blue-500/30 m-0 relative">
      {/* Left Panel - Discipline Summary */}
      <DisciplineSummaryPanel
        discipline={selectedDiscipline}
        papers={currentPapers}
        isOpen={isPanelOpen}
        isCollapsed={isPanelCollapsed}
        onCollapsedChange={setIsPanelCollapsed}
      />

      {/* Main Content Container */}
      <div className="min-h-screen w-full">
        <Navigation
          activeFilters={activeFilters}
          onFilterChange={setActiveFilters}
          onToggleSidebar={() => setIsSidebarOpen(true)}
        />

        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          papers={currentPapers}
        />

        {/* Back button when viewing a discipline's papers */}
        {selectedDiscipline && (
          <button
            onClick={handleBackToDisciplines}
            className="fixed top-6 z-10 flex items-center gap-2.5 px-5 py-3.5 bg-white/5 hover:bg-white/10 backdrop-blur-xl rounded-2xl transition-all duration-300 active:scale-95 shadow-lg group"
            style={{
              left: isPanelOpen ? `calc(${panelWidth}px + 1.5rem)` : '1.5rem'
            }}
          >
            <ArrowLeft className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" />
            <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">Back to Disciplines</span>
          </button>
        )}

        {/* Collapse/Expand panel button */}
        {selectedDiscipline && (
          <button
            onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
            className="fixed top-24 z-10 flex items-center gap-2.5 px-4 py-3 bg-white/5 hover:bg-white/10 backdrop-blur-xl rounded-2xl transition-all duration-300 active:scale-95 shadow-lg group"
            style={{
              left: isPanelOpen ? `calc(${panelWidth}px + 1.5rem)` : '1.5rem'
            }}
            aria-label={isPanelCollapsed ? "Expand panel" : "Collapse panel"}
          >
            {isPanelCollapsed ? (
              <>
                <ChevronRight className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" />
                <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">Expand Panel</span>
              </>
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" />
                <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">Collapse Panel</span>
              </>
            )}
          </button>
        )}

        {/* Show discipline name when viewing papers */}
        {selectedDiscipline && (
          <div
            className="fixed top-28 z-10 px-8 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg transition-all duration-300"
            style={{
              left: isPanelOpen ? `calc(${panelWidth}px + 50%)` : '50%',
              transform: 'translateX(-50%)'
            }}
          >
            <h2 className="text-lg font-semibold text-white text-center">{selectedDiscipline.name}</h2>
            <p className="text-xs text-white/50 text-center mt-1">{selectedDiscipline.yearRange} • {currentPapers.length} papers</p>
          </div>
        )}

        <BubbleHeatmap
          papers={selectedDiscipline ? currentPapers : undefined}
          disciplines={selectedDiscipline ? undefined : REAL_DISCIPLINES}
          activeFilters={activeFilters}
          mode={selectedDiscipline ? "papers" : "disciplines"}
          onDisciplineClick={handleDisciplineClick}
          allowedCategories={allowedCategories}
        />
      </div>
    </main>
  );
}
