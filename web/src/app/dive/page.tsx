"use client";

import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Sidebar } from "@/components/Sidebar";
import { ChatInterface } from "@/components/dive/ChatInterface";
import { REAL_PAPERS } from "@/data/paperDataLoader";

export default function DivePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <main className="h-screen bg-black text-white selection:bg-blue-500/30 overflow-hidden">
      <Navigation
        activeFilters={[]}
        onFilterChange={() => {}}
        onToggleSidebar={() => setIsSidebarOpen(true)}
        showFilters={false}
      />

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        papers={REAL_PAPERS}
      />

      <div className="h-full pt-24">
        <ChatInterface />
      </div>
    </main>
  );
}
