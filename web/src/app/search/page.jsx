"use client";

import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Sidebar } from "@/components/Sidebar";
import SearchPaper from "@/components/search/SearchPage";

export default function Search() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <main className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      <Navigation
        activeFilters={[]}
        onFilterChange={() => {}}
        onToggleSidebar={() => setIsSidebarOpen(true)}
        showFilters={false}
      />

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        papers={[]}
      />

      <SearchPaper />
    </main>
  );
}
