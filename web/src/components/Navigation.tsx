import { Menu } from "lucide-react";
import { clsx } from "clsx";
import { motion } from "framer-motion";
import { FilterType } from "@/types";

interface NavigationProps {
  onToggleSidebar: () => void;
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export function Navigation({ onToggleSidebar, activeFilter, onFilterChange }: NavigationProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-4 pointer-events-none">
      {/* Left: Hamburger */}
      <div className="pointer-events-auto">
        <button
          onClick={onToggleSidebar}
          className="p-3 rounded-full glass hover:bg-white/10 transition-all active:scale-95 group"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6 text-white/80 group-hover:text-white" />
        </button>
      </div>

      {/* Center/Right: Filters */}
      <div className="pointer-events-auto flex gap-3 p-1.5 rounded-full glass">
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
        "relative px-6 py-2 rounded-full text-sm font-medium transition-colors duration-300",
        isActive ? "text-white" : "text-white/60 hover:text-white/80 hover:bg-white/5"
      )}
    >
      {isActive && (
        <motion.div
          layoutId="activeFilter"
          className="absolute inset-0 bg-white/10 rounded-full border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          initial={false}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
      <span className="relative z-10">{label}</span>
    </button>
  );
}