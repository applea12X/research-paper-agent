"use client";

import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Sidebar } from "@/components/Sidebar";
import { BubbleHeatmap } from "@/components/BubbleHeatmap";
import { MOCK_PAPERS, MOCK_DISCIPLINES, getPapersByDiscipline } from "@/data/papers";
import { FilterType, Discipline } from "@/types";
import { ArrowLeft } from "lucide-react";

export default function Home() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("impact");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDiscipline, setSelectedDiscipline] = useState<Discipline | null>(null);

  const handleDisciplineClick = (discipline: Discipline) => {
    setSelectedDiscipline(discipline);
  };

  const handleBackToDisciplines = () => {
    setSelectedDiscipline(null);
  };

  const currentPapers = selectedDiscipline
    ? getPapersByDiscipline(selectedDiscipline.name, selectedDiscipline.startYear, selectedDiscipline.endYear)
    : MOCK_PAPERS;

  return (
    <main className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      <Navigation
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onToggleSidebar={() => setIsSidebarOpen(true)}
        showFilters={!selectedDiscipline}
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
          className="fixed top-28 left-8 z-10 flex items-center gap-2.5 px-5 py-2.5 bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl transition-all duration-200 active:scale-95 shadow-lg group"
        >
          <ArrowLeft className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" />
          <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">Back to Disciplines</span>
        </button>
      )}

      {/* Show discipline name when viewing papers */}
      {selectedDiscipline && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-10 px-8 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg">
          <h2 className="text-lg font-semibold text-white text-center">{selectedDiscipline.name}</h2>
          <p className="text-xs text-white/50 text-center mt-1">{selectedDiscipline.yearRange} • {currentPapers.length} papers</p>
        </div>
      )}

      <BubbleHeatmap
        papers={selectedDiscipline ? currentPapers : undefined}
        disciplines={selectedDiscipline ? undefined : MOCK_DISCIPLINES}
        activeFilter={activeFilter}
        mode={selectedDiscipline ? "papers" : "disciplines"}
        onDisciplineClick={handleDisciplineClick}
      />
    </main>
  );
}
