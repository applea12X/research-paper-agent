"use client";

import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Sidebar } from "@/components/Sidebar";
import { CaseStudiesPage } from "@/components/caseStudies/CaseStudiesPage";
import { MOCK_PAPERS } from "@/data/papers";
import { FilterType } from "@/types";

export default function CaseStudies() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("impact");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <main className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      <Navigation
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onToggleSidebar={() => setIsSidebarOpen(true)}
      />

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        papers={MOCK_PAPERS}
      />

      <CaseStudiesPage />
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-[-1]">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 blur-[120px] rounded-full" />
      </div>
    </main>
  );
}