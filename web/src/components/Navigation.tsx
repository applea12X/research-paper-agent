import { Menu } from "lucide-react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { FilterType, FilterOption } from "@/types";

interface NavigationProps {
  onToggleSidebar: () => void;
  activeFilters: FilterType;
  onFilterChange: (filters: FilterType) => void;
  showFilters?: boolean;
}

export function Navigation({ onToggleSidebar, activeFilters, onFilterChange, showFilters = true }: NavigationProps) {
  const handleFilterToggle = (filter: FilterOption) => {
    if (activeFilters.includes(filter)) {
      // Remove filter if already active
      onFilterChange(activeFilters.filter(f => f !== filter));
    } else {
      // Add filter if not active
      onFilterChange([...activeFilters, filter]);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-8 py-6 pointer-events-none">
      {/* Left: Hamburger */}
      <div className="pointer-events-auto">
        <button
          onClick={onToggleSidebar}
          className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 transition-all duration-200 active:scale-95 group shadow-lg"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-white/90 group-hover:text-white" />
        </button>
      </div>

      {/* Center/Right: Filters */}
      {showFilters && (
        <div className="pointer-events-auto flex gap-2 p-1.5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg">
          <FilterButton
            label="ML Impact"
            isActive={activeFilters.includes("impact")}
            onClick={() => handleFilterToggle("impact")}
          />
          <FilterButton
            label="Code Availability"
            isActive={activeFilters.includes("code")}
            onClick={() => handleFilterToggle("code")}
          />
        </div>
      )}
    </nav>
  );
}

interface FilterButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function FilterButton({ label, isActive, onClick }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "relative px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
        isActive ? "text-white" : "text-white/60 hover:text-white/80"
      )}
    >
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="absolute inset-0 bg-white/15 rounded-xl border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
      <span className="relative z-10">{label}</span>
    </button>
  );
}