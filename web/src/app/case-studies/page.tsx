"use client";

import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Sidebar } from "@/components/Sidebar";
import { CaseStudiesPage } from "@/components/caseStudies/CaseStudiesPage";
import { REAL_PAPERS } from "@/data/paperDataLoader";
import { FilterType } from "@/types";

export default function CaseStudies() {
  const [activeFilters, setActiveFilters] = useState<FilterType>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <main className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      <Navigation
        activeFilters={activeFilters}
        onFilterChange={setActiveFilters}
        onToggleSidebar={() => setIsSidebarOpen(true)}
        showFilters={false}
      />

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        papers={REAL_PAPERS}
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