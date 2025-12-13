import { Menu } from "lucide-react";
import { clsx } from "clsx";
import { motion } from "framer-motion";
import { FilterType } from "@/types";

interface NavigationProps {
  onToggleSidebar: () => void;
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  showFilters?: boolean;
}

export function Navigation({ onToggleSidebar, activeFilter, onFilterChange, showFilters = true }: NavigationProps) {
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
            isActive={activeFilter === "impact"}
            onClick={() => onFilterChange("impact")}
          />
          <FilterButton
            label="Code Availability"
            isActive={activeFilter === "code"}
            onClick={() => onFilterChange("code")}
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
      {isActive && (
        <motion.div
          layoutId="activeFilter"
          className="absolute inset-0 bg-white/15 rounded-xl border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
          initial={false}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
      <span className="relative z-10">{label}</span>
    </button>
  );
}