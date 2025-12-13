import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Paper, FilterType } from "@/types";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";

interface BubbleHeatmapProps {
  papers: Paper[];
  activeFilter: FilterType;
}

export function BubbleHeatmap({ papers, activeFilter }: BubbleHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simulationRef = useRef<d3.Simulation<Paper, undefined> | null>(null);
  const [hoveredNode, setHoveredNode] = useState<Paper | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Initialize simulation
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || papers.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = containerRef.current.clientWidth;
    let height = containerRef.current.clientHeight;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Initialize node positions if not set
    papers.forEach(p => {
      if (!p.x) {
        p.x = width * (p.impactScore / 100);
        p.y = height / 2 + (Math.random() - 0.5) * 50;
      }
      p.r = 4 + (p.impactScore / 100) * 8; // Radius based on impact (4 to 12)
    });

    // Color scale: Blue (low) -> Purple -> Red (high)
    // We can use interpolateSpectral reversed, or similar.
    // interpolateRdBu: Red (0) -> Blue (1). We want Blue (left) -> Red (right).
    // So we want input 1 (Blue) -> 0 (Red).
    const colorScale = d3.scaleSequential((t) => d3.interpolateRdBu(1 - t))
      .domain([0, width]);

    // Force simulation
    const simulation = d3.forceSimulation<Paper>(papers)
      .alphaDecay(0.01) // Low decay for gentle motion
      .velocityDecay(0.2); // Low friction for floaty feel

    simulationRef.current = simulation;

    // Forces will be updated in another effect based on filter
    
    // Interaction state
    let mouseX = -1000;
    let mouseY = -1000;

    // Render loop
    const tick = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Draw gradient background or keep it subtle in CSS? 
      // Requirement: "No default browser UI elements... No visible scrollbars"
      
      papers.forEach(node => {
        if (!node.x || !node.y || !node.r) return;

        // Gentle floaty motion - add noise to velocity
        node.vx = (node.vx || 0) + (Math.random() - 0.5) * 0.05;
        node.vy = (node.vy || 0) + (Math.random() - 0.5) * 0.05;

        // Mouse repulsion
        const dx = mouseX - node.x;
        const dy = mouseY - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const repulsionRadius = 100;
        
        if (dist < repulsionRadius) {
          const force = (1 - dist / repulsionRadius) * 0.5;
          node.vx = (node.vx || 0) - (dx / dist) * force;
          node.vy = (node.vy || 0) - (dy / dist) * force;
        }

        // Draw bubble
        ctx.beginPath();
        const isHovered = hoveredNode && hoveredNode.id === node.id;
        const radius = isHovered ? node.r * 1.5 : node.r;
        
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
        
        // Fill with gradient color based on X
        // We strictly follow X for color as per requirement
        ctx.fillStyle = colorScale(node.x);
        
        // Add glow/softness
        ctx.shadowBlur = isHovered ? 15 : 5;
        ctx.shadowColor = colorScale(node.x);
        
        // Opacity
        ctx.globalAlpha = isHovered ? 1 : 0.7;
        
        ctx.fill();
        
        // Optional stroke for code available if needed, but color is strict.
        // Maybe a white ring for code available?
        if (node.codeAvailable) {
           ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
           ctx.lineWidth = 1.5;
           ctx.stroke();
        }

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      });
    };

    simulation.on("tick", tick);

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current) return;
      width = containerRef.current.clientWidth;
      height = containerRef.current.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
      
      // Update forces for new dimensions
      updateForces();
      simulation.alpha(0.3).restart();
    };

    window.addEventListener("resize", handleResize);

    // Mouse handlers for canvas
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;

      // Find closest node
      let closest: Paper | null = null;
      let minDist = Infinity;

      papers.forEach(node => {
        if (!node.x || !node.y) return;
        const dx = mouseX - node.x;
        const dy = mouseY - node.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        
        if (d < (node.r || 10) + 5 && d < minDist) { // +5 hit tolerance
          minDist = d;
          closest = node;
        }
      });

      if (closest !== hoveredNode) {
        setHoveredNode(closest);
      }
      
      setTooltipPos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
      setHoveredNode(null);
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      simulation.stop();
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [papers]); // Re-run if papers change (init only)

  // Update forces when filter changes
  const updateForces = () => {
    if (!simulationRef.current || !containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const simulation = simulationRef.current;

    // Configure Forces
    
    // Force X: Always map impact score to X position
    simulation.force("x", d3.forceX<Paper>(d => width * 0.1 + (d.impactScore / 100) * width * 0.8).strength(0.5));

    // Force Y: Depends on filter
    if (activeFilter === "code") {
      // Split vertically
      simulation.force("y", d3.forceY<Paper>(d => d.codeAvailable ? height * 0.35 : height * 0.65).strength(0.2));
    } else {
      // Center vertically
      simulation.force("y", d3.forceY(height / 2).strength(0.1));
    }

    // Collision detection
    simulation.force("collide", d3.forceCollide<Paper>(d => (d.r || 5) + 2).strength(0.8));

    // Charge (repulsion)
    simulation.force("charge", d3.forceManyBody().strength(-2));

    simulation.alpha(0.5).restart();
  };

  useEffect(() => {
    updateForces();
  }, [activeFilter, papers]); // Update when filter changes

  return (
    <div className="relative w-full h-full flex items-center justify-center p-8">
      {/* Container */}
      <div 
        ref={containerRef}
        className="relative w-full h-[85vh] rounded-3xl glass shadow-2xl overflow-hidden border border-white/5"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
        />

        {/* Labels for Code Availability Filter */}
        <AnimatePresence>
          {activeFilter === "code" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none"
            >
              <div className="absolute top-[35%] left-8 text-white/30 text-sm font-medium tracking-wider uppercase -translate-y-1/2">
                Code Available
              </div>
              <div className="absolute top-[65%] left-8 text-white/30 text-sm font-medium tracking-wider uppercase -translate-y-1/2">
                No Code
              </div>
              {/* Divider line */}
              <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 border-t border-dashed border-white/10" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend / Axis Labels */}
        <div className="absolute bottom-6 left-12 right-12 flex justify-between text-xs text-white/40 uppercase tracking-widest font-medium pointer-events-none">
          <span>Low Impact</span>
          <span>High Impact</span>
        </div>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredNode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "fixed",
              left: tooltipPos.x + 20,
              top: tooltipPos.y - 20,
              pointerEvents: "none",
              zIndex: 50,
            }}
            className="bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-lg shadow-xl max-w-xs"
          >
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
                {hoveredNode.domain}
              </span>
              <h3 className="text-sm font-bold text-white leading-tight">
                {hoveredNode.title}
              </h3>
              <div className="flex items-center gap-3 mt-1 text-xs text-white/70">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  Impact: {Math.round(hoveredNode.impactScore)}
                </div>
                {hoveredNode.codeAvailable && (
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    Code
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
