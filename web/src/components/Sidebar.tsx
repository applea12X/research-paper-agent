import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Paper } from "@/types";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  papers: Paper[]; // Pass top papers or case studies
}

export function Sidebar({ isOpen, onClose, papers }: SidebarProps) {
  // Select top 5 high impact papers for case studies
  const caseStudies = [...papers]
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, 5);

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
              <h2 className="text-2xl font-bold tracking-tight text-white/90">Case Studies</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-6 h-6 text-white/70" />
              </button>
            </div>

            <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-120px)] custom-scrollbar pr-2">
              {caseStudies.map((paper) => (
                <div
                  key={paper.id}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {paper.domain}
                    </span>
                    <span className="text-xs text-white/40">{paper.year}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white/90 mb-2 group-hover:text-blue-200 transition-colors">
                    {paper.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-white/60">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-400"></span>
                      Impact: {Math.round(paper.impactScore)}
                    </div>
                    {paper.codeAvailable && (
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-400"></span>
                        Code Available
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-white/5">
                <h4 className="font-medium text-white/80 mb-2">About this Visualization</h4>
                <p className="text-sm text-white/60 leading-relaxed">
                  This interactive heatmap explores the relationship between machine learning impact scores and research reproducibility (code availability). 
                  Entities are positioned by impact magnitude and color-coded to reveal patterns in open science adoption.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}