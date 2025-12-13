import { motion, AnimatePresence } from "framer-motion";
import { X, Home, BarChart3, FileText, GitBranch, Search, Zap, MessageCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  papers: unknown[]; // Keep for compatibility but not used anymore
}

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Summary of Findings", href: "/findings", icon: FileText },
  { name: "Case Studies", href: "/case-studies", icon: BarChart3 },
  { name: "Dive", href: "/dive", icon: MessageCircle },
  { name: "Adoption Dynamics", href: "#", icon: GitBranch, disabled: true },
  { name: "Quality Trade-offs", href: "#", icon: Zap, disabled: true },
  { name: "Discovery Traces", href: "#", icon: Search, disabled: true },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />
          
          {/* Panel */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 z-50 h-full w-full max-w-md glass-panel p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-white/90">Navigation</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-6 h-6 text-white/70" />
              </button>
            </div>

            <nav className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                
                if (item.disabled) {
                  return (
                    <div
                      key={item.name}
                      className="flex items-center gap-3 px-4 py-3 text-white/40 cursor-not-allowed"
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                      <span className="ml-auto text-xs bg-white/10 px-2 py-0.5 rounded-full">
                        Soon
                      </span>
                    </div>
                  );
                }
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-white/5">
              <h4 className="font-medium text-white/80 mb-2">AI Research Impact Observatory</h4>
              <p className="text-sm text-white/60 leading-relaxed">
                Explore the relationship between machine learning advances and research outcomes through interactive visualizations and case study analysis.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}