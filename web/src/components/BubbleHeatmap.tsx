import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Paper, Discipline, FilterType } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface BubbleHeatmapProps {
  papers?: Paper[];
  disciplines?: Discipline[];
  activeFilters: FilterType;
  mode: "papers" | "disciplines";
  onDisciplineClick?: (discipline: Discipline) => void;
  allowedCategories?: string[];
}

// Extended types for dynamic expansion
interface ExtendedPaper extends Paper {
  targetRadius?: number;
  currentRadius?: number;
}

interface ExtendedDiscipline extends Discipline {
  targetRadius?: number;
  currentRadius?: number;
}

type ExtendedNode = ExtendedPaper | ExtendedDiscipline;

export function BubbleHeatmap({ papers, disciplines, activeFilters, mode, onDisciplineClick, allowedCategories }: BubbleHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simulationRef = useRef<d3.Simulation<ExtendedNode, undefined> | null>(null);
  const [hoveredNode, setHoveredNode] = useState<ExtendedNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const isLowPowerDevice = useRef<boolean>(false);

  // Detect device capabilities on mount (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Heuristics for detecting low-power devices:
    // 1. Low CPU core count (<=4 cores)
    // 2. Mobile device (touch + small screen)
    const cores = navigator.hardwareConcurrency || 4;
    const isMobile = 'ontouchstart' in window && window.innerWidth < 768;
    const isLowEndMobile = isMobile && cores <= 4;

    isLowPowerDevice.current = isLowEndMobile || cores <= 2;
  }, []);

  // Performance-aware rendering constants
  const performanceMode = {
    // Low-power devices: reduce visual effects
    dprMultiplier: isLowPowerDevice.current ? 1 : (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1),
    shadowBlur: isLowPowerDevice.current ? 2 : 5,
    shadowBlurHover: isLowPowerDevice.current ? 5 : 15,
    shadowBlurExpanded: isLowPowerDevice.current ? 3 : 8,
    enableFloatyMotion: !isLowPowerDevice.current, // Disable subtle motion on low-end devices
    simulationAlphaDecay: isLowPowerDevice.current ? 0.02 : 0.01, // Faster settling on low-end
    simulationVelocityDecay: isLowPowerDevice.current ? 0.4 : 0.2, // More damping on low-end
  };

  // === VISUALIZATION MODE STATE MACHINE ===
  // Prevents state collision between parent and nested systems
  type VisualizationMode = 'MODE_OVERVIEW' | 'MODE_EXPANDING' | 'MODE_EXPANDED' | 'MODE_COLLAPSING';
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>('MODE_OVERVIEW');

  // Expansion state management
  const [selectedPaper, setSelectedPaper] = useState<ExtendedPaper | null>(null);
  const [expandProgress, setExpandProgress] = useState(0);
  const expandProgressRef = useRef(0); // Ref for accessing current progress in render loop
  const expandAnimationRef = useRef<number | null>(null);

  // Preserved state for reverse transition
  const preservedStateRef = useRef<ExtendedNode[] | null>(null);

  // Sync expandProgress to ref for render loop access
  useEffect(() => {
    expandProgressRef.current = expandProgress;
  }, [expandProgress]);

  // Initialize simulation
  useEffect(() => {
    const allowed = Array.isArray(allowedCategories) && allowedCategories.length > 0 ? allowedCategories : undefined;

    const dataSource = (() => {
      const src = mode === "disciplines" ? (disciplines || []) : (papers || []);
      if (!allowed) return src;
      return src.filter(item => {
        if (mode === "disciplines") return allowed.includes((item as Discipline).name);
        return allowed.includes((item as Paper).domain);
      });
    })();
    if (!canvasRef.current || !containerRef.current || !dataSource || dataSource.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = containerRef.current.clientWidth;
    let height = containerRef.current.clientHeight;

    // Handle high DPI displays (reduced on low-power devices for performance)
    const dpr = performanceMode.dprMultiplier;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // === STATE ISOLATION: Create deep copy to avoid mutating props ===
    // This prevents corruption when transitioning between modes
    const extendedNodes: ExtendedNode[] = mode === "disciplines"
      ? (disciplines || []).map(d => ({
          ...d,
          x: d.x || width * 0.1 + (d.impactScore / 100) * width * 0.8 + (Math.random() - 0.5) * 30, // Match force X positioning
          y: d.y || height / 2 + (Math.random() - 0.5) * 20,
          r: Math.min(16 + (d.paperCount / 30) * 12, 40), // Increased size: base 16, multiplier 12, max 40
          vx: d.vx || 0,
          vy: d.vy || 0,
          targetRadius: undefined,
          currentRadius: undefined,
        } as ExtendedDiscipline))
      : (papers || []).map(p => ({
          ...p,
          x: p.x || width * 0.1 + (p.impactScore / 100) * width * 0.8 + (Math.random() - 0.5) * 30, // Match force X positioning
          y: p.y || height / 2 + (Math.random() - 0.5) * 50, // Further reduced vertical spread to 50
          r: Math.min(8 + (p.impactScore / 100) * 12, 50), // Increased size: base 8, multiplier 12, max 50
          vx: p.vx || 0,
          vy: p.vy || 0,
          targetRadius: undefined,
          currentRadius: undefined,
        } as ExtendedPaper));

    // Initialize dynamic properties
    extendedNodes.forEach(node => {
      node.targetRadius = node.r;
      node.currentRadius = node.r;
    });

    // Color scale: Blue (low) -> Purple -> Red (high)
    // We can use interpolateSpectral reversed, or similar.
    // interpolateRdBu: Red (0) -> Blue (1). We want Blue (left) -> Red (right).
    // So we want input 1 (Blue) -> 0 (Red).
    const colorScale = d3.scaleSequential((t) => d3.interpolateRdBu(1 - t))
      .domain([0, width]);

    // Force simulation with extended nodes
    // Performance-aware: faster settling on low-power devices
    const simulation = d3.forceSimulation<ExtendedNode>(extendedNodes)
      .alphaDecay(performanceMode.simulationAlphaDecay)
      .velocityDecay(performanceMode.simulationVelocityDecay);

    simulationRef.current = simulation;

    // Forces will be updated in another effect based on filter

    // Interaction state
    let mouseX = -1000;
    let mouseY = -1000;

    // === TUNABLE CONSTANTS ===
    const EXPANSION_INFLUENCE_RADIUS = 150; // Cursor proximity detection
    const MAX_EXPANSION_FACTOR = 1.4; // Maximum bubble expansion (1.4x base radius)
    const EXPANSION_SMOOTHING = 0.15; // Spring interpolation factor (lower = smoother)
    const EXPANSION_FALLOFF_POWER = 2; // Non-linear distance falloff (higher = sharper)

    // Render loop with cursor-driven expansion
    const tick = () => {
      // === MODE-AWARE RENDERING ===
      // Only render if in overview mode or expanding (not when fully expanded)
      const currentMode = visualizationMode;
      if (currentMode === 'MODE_EXPANDED') {
        // Fully expanded - nested view is active, parent system is frozen
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // === CURSOR-DRIVEN EXPANSION WITH FORCE PROPAGATION ===
      // First pass: Update all bubble target radii based on cursor (disabled during expansion)
      if (currentMode === 'MODE_OVERVIEW') {
        extendedNodes.forEach(node => {
          if (!node.x || !node.y || !node.r) return;

          // Calculate distance from cursor to bubble
          const dx = mouseX - node.x;
          const dy = mouseY - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Determine target radius based on cursor proximity
          if (dist < EXPANSION_INFLUENCE_RADIUS) {
            // Non-linear falloff: closer = bigger expansion
            const proximityFactor = 1 - Math.pow(dist / EXPANSION_INFLUENCE_RADIUS, EXPANSION_FALLOFF_POWER);
            const expansionMultiplier = 1 + (MAX_EXPANSION_FACTOR - 1) * proximityFactor;
            node.targetRadius = node.r * expansionMultiplier;
          } else {
            // Outside influence radius: return to base size
            node.targetRadius = node.r;
          }

          // Smoothly interpolate current radius toward target (critically damped spring)
          const radiusDiff = (node.targetRadius || node.r) - (node.currentRadius || node.r);
          node.currentRadius = (node.currentRadius || node.r) + radiusDiff * EXPANSION_SMOOTHING;
        });
      }

      // Second pass: Apply collision forces based on currentRadius
      // This makes expanding bubbles actively push neighbors away
      extendedNodes.forEach(nodeA => {
        if (!nodeA.x || !nodeA.y || !nodeA.r) return;
        const axPos = nodeA.x;
        const ayPos = nodeA.y;
        const aRadius = nodeA.currentRadius || nodeA.r;

        extendedNodes.forEach(nodeB => {
          if (nodeA === nodeB || !nodeB.x || !nodeB.y || !nodeB.r) return;

          const dx = nodeB.x - axPos;
          const dy = nodeB.y - ayPos;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const bRadius = nodeB.currentRadius || nodeB.r;          // Increase padding so bubbles sit slightly further apart
          const minDist = aRadius + bRadius + 12; // Increased padding from 6 to 12

          // If bubbles are overlapping, push them apart
          if (dist < minDist && dist > 0) {
            const force = (minDist - dist) / dist * 0.5;
            const fx = dx * force;
            const fy = dy * force;

            nodeB.vx = (nodeB.vx || 0) + fx;
            nodeB.vy = (nodeB.vy || 0) + fy;
            nodeA.vx = (nodeA.vx || 0) - fx;
            nodeA.vy = (nodeA.vy || 0) - fy;
          }
        });
      });

      // Third pass: Render all bubbles
      // Apply fade and blur effects during expansion
      const currentExpandProgress = expandProgressRef.current;
      const isExpanding = currentMode === 'MODE_EXPANDING' || currentMode === 'MODE_COLLAPSING';
      const fadeOpacity = isExpanding ? Math.max(0, 1 - currentExpandProgress * 1.2) : 1;
      const blurAmount = isExpanding ? currentExpandProgress * 8 : 0; // Gradually blur up to 8px

      extendedNodes.forEach(node => {
        if (!node.x || !node.y || !node.r) return;

        // Gentle floaty motion - add noise to velocity (disabled during expansion or on low-power devices)
        if (currentMode === 'MODE_OVERVIEW' && performanceMode.enableFloatyMotion) {
          node.vx = (node.vx || 0) + (Math.random() - 0.5) * 0.05;
          node.vy = (node.vy || 0) + (Math.random() - 0.5) * 0.05;
        }

        // Draw bubble
        ctx.beginPath();
        const isHovered = hoveredNode && hoveredNode.id === node.id && currentMode === 'MODE_OVERVIEW';

        // Use currentRadius for rendering (smooth expansion)
        const radius = isHovered
          ? (node.currentRadius || node.r) * 1.2  // Additional hover scale
          : (node.currentRadius || node.r);

        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);

        // Fill with gradient color based on X position
        ctx.fillStyle = colorScale(node.x);

        // Add glow/softness (performance-aware blur, enhanced during expansion)
        const baseBlur = isHovered ? performanceMode.shadowBlurHover : performanceMode.shadowBlur;
        const expandedBlur = performanceMode.shadowBlurExpanded;
        ctx.shadowBlur = blurAmount > 0 ? expandedBlur : baseBlur;
        ctx.shadowColor = colorScale(node.x);

        // Opacity (fade during expansion, normal otherwise)
        const baseOpacity = isHovered ? 1 : 0.7;
        ctx.globalAlpha = baseOpacity * fadeOpacity;

        ctx.fill();

        // White ring for code available (papers mode) or paper count indicator (disciplines mode)
        const isPaper = 'codeAvailable' in node;
        const isDiscipline = 'paperCount' in node;

        if (isPaper && node.codeAvailable) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 * fadeOpacity})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else if (isDiscipline) {
          // Show a thicker ring for disciplines
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 * fadeOpacity})`;
          ctx.lineWidth = 2;
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
      const resizeDpr = performanceMode.dprMultiplier; // Use performance-aware DPR
      canvas.width = width * resizeDpr;
      canvas.height = height * resizeDpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(resizeDpr, resizeDpr);
      
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
      let closest: ExtendedNode | null = null;
      let minDist = Infinity;

      extendedNodes.forEach(node => {
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

    // Click handler for bubble expansion
    const handleClick = (e: MouseEvent) => {
      // MODE-AWARE: Only handle clicks in overview mode
      if (visualizationMode !== 'MODE_OVERVIEW') return;

      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Find clicked bubble
      let clickedBubble: ExtendedNode | null = null;
      let minDist = Infinity;

      extendedNodes.forEach(node => {
        if (!node.x || !node.y) return;
        const dx = clickX - node.x;
        const dy = clickY - node.y;
        const d = Math.sqrt(dx * dx + dy * dy);

        if (d < (node.currentRadius || node.r || 10) && d < minDist) {
          minDist = d;
          clickedBubble = node;
        }
      });

      if (clickedBubble) {
        // Check if it's a discipline or a paper
        if (mode === 'disciplines' && 'paperCount' in clickedBubble && onDisciplineClick) {
          // In discipline mode, clicking should navigate to that discipline's papers
          onDisciplineClick(clickedBubble as ExtendedDiscipline);
        } else if (mode === 'papers') {
          // In paper mode, show the expanded view
          // === TRANSITION SEQUENCING: Step 1 - Preserve state ===
          preservedStateRef.current = extendedNodes.map(p => ({ ...p }));

          // === Step 2 - Freeze parent physics ===
          simulation.stop();

          // === Step 3 - Set selected paper and trigger expansion ===
          setSelectedPaper(clickedBubble as ExtendedPaper);
          setVisualizationMode('MODE_EXPANDING');
          startExpansionAnimation();
        }
      }
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("click", handleClick);

    return () => {
      // === CLEANUP SEQUENCING ===
      // Stop simulation first to prevent ticks during cleanup
      simulation.stop();

      // Remove event listeners
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      canvas.removeEventListener("click", handleClick);

      // Cancel any pending animation frames
      if (expandAnimationRef.current) {
        cancelAnimationFrame(expandAnimationRef.current);
      }
    };
    // CRITICAL: Only depend on data sources and mode
    // DO NOT add isExpanded or visualizationMode - causes infinite loop
  }, [papers, disciplines, mode]);

  // Update forces when filter changes
  const updateForces = () => {
    if (!simulationRef.current || !containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const simulation = simulationRef.current;

    // Determine which view to show based on active filters
    const hasCodeFilter = activeFilters.includes("code");
    const hasImpactFilter = activeFilters.includes("impact");
    const hasBothFilters = hasCodeFilter && hasImpactFilter;

    // Configure Forces based on active filters
    if (hasImpactFilter && !hasCodeFilter) {
      // Only ML Impact filter: Split horizontally into two clumps (<=50 left, >50 right)
      simulation.force("x", d3.forceX<ExtendedNode>(d => {
        return d.impactScore <= 50 ? width * 0.30 : width * 0.70;
      }).strength(0.15));

      // Center vertically
      simulation.force("y", d3.forceY(height / 2).strength(0.20));
    } else if (hasCodeFilter && !hasImpactFilter) {
      // Only Code Availability filter: Split vertically, spread horizontally by impact
      simulation.force("x", d3.forceX<ExtendedNode>(d => width * 0.1 + (d.impactScore / 100) * width * 0.8).strength(0.04));

      if (mode === "papers") {
        // Split vertically by code availability (papers mode)
        simulation.force("y", d3.forceY<ExtendedNode>(d => {
          const isPaper = 'codeAvailable' in d;
          return isPaper && d.codeAvailable ? height * 0.35 : height * 0.65;
        }).strength(0.25));
      } else {
        // Split vertically by exact code availability count (disciplines mode)
        const disciplineNodes = (disciplines || []) as ExtendedDiscipline[];
        const codeCounts = disciplineNodes.map(d => d.codeAvailableCount);
        const minCode = Math.min(...codeCounts);
        const maxCode = Math.max(...codeCounts);

        simulation.force("y", d3.forceY<ExtendedNode>(d => {
          const isDiscipline = 'paperCount' in d && 'codeAvailableCount' in d;
          if (isDiscipline) {
            const codeCount = d.codeAvailableCount;
            if (maxCode === minCode) {
              return height / 2;
            }
            const normalized = 1 - ((codeCount - minCode) / (maxCode - minCode));
            return height * 0.35 + normalized * height * 0.3;
          }
          return height / 2;
        }).strength(0.8));
      }
    } else if (hasBothFilters) {
      // Both filters: Split horizontally by ML impact AND vertically by code availability
      simulation.force("x", d3.forceX<ExtendedNode>(d => {
        return d.impactScore <= 50 ? width * 0.30 : width * 0.70;
      }).strength(0.15));

      if (mode === "papers") {
        simulation.force("y", d3.forceY<ExtendedNode>(d => {
          const isPaper = 'codeAvailable' in d;
          return isPaper && d.codeAvailable ? height * 0.35 : height * 0.65;
        }).strength(0.25));
      } else {
        const disciplineNodes = (disciplines || []) as ExtendedDiscipline[];
        const codeCounts = disciplineNodes.map(d => d.codeAvailableCount);
        const minCode = Math.min(...codeCounts);
        const maxCode = Math.max(...codeCounts);

        simulation.force("y", d3.forceY<ExtendedNode>(d => {
          const isDiscipline = 'paperCount' in d && 'codeAvailableCount' in d;
          if (isDiscipline) {
            const codeCount = d.codeAvailableCount;
            if (maxCode === minCode) {
              return height / 2;
            }
            const normalized = 1 - ((codeCount - minCode) / (maxCode - minCode));
            return height * 0.35 + normalized * height * 0.3;
          }
          return height / 2;
        }).strength(0.8));
      }
    } else {
      // No filters: Default view - spread horizontally by impact score, centered vertically
      simulation.force("x", d3.forceX<ExtendedNode>(d => width * 0.1 + (d.impactScore / 100) * width * 0.8).strength(0.04));
      simulation.force("y", d3.forceY(height / 2).strength(0.20));
    }

    simulation.force("collide", d3.forceCollide<ExtendedNode>(d => (d.currentRadius || d.r || 5) + 12).strength(0.7));
    simulation.force("charge", d3.forceManyBody().strength(-20));

    simulation.alpha(0.5).restart();
  };

  useEffect(() => {
    updateForces();
  }, [activeFilters, papers, disciplines, mode]); // Update when filter or data changes

  // === EXPANSION ANIMATION FUNCTIONS ===
  // Manages transition from MODE_EXPANDING → MODE_EXPANDED
  const startExpansionAnimation = () => {
    // Cancel any existing animation first
    if (expandAnimationRef.current) {
      cancelAnimationFrame(expandAnimationRef.current);
      expandAnimationRef.current = null;
    }

    let startTime: number | null = null;
    const duration = 600; // 600ms as per spec

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic for smooth deceleration
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setExpandProgress(easedProgress);

      if (progress < 1) {
        expandAnimationRef.current = requestAnimationFrame(animate);
      } else {
        // === TRANSITION SEQUENCING: Animation complete ===
        expandAnimationRef.current = null;
        // Transition to fully expanded mode - nested view takes over
        setVisualizationMode('MODE_EXPANDED');
      }
    };

    expandAnimationRef.current = requestAnimationFrame(animate);
  };

  // Manages transition from MODE_EXPANDED → MODE_OVERVIEW
  const handleCollapse = () => {
    // === TRANSITION SEQUENCING: Step 1 - Enter collapsing mode ===
    setVisualizationMode('MODE_COLLAPSING');

    // Cancel any existing animation
    if (expandAnimationRef.current) {
      cancelAnimationFrame(expandAnimationRef.current);
      expandAnimationRef.current = null;
    }

    let startTime: number | null = null;
    const duration = 600;
    const startProgress = expandProgress;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease in cubic for smooth acceleration back
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setExpandProgress(startProgress * (1 - easedProgress));

      if (progress < 1) {
        expandAnimationRef.current = requestAnimationFrame(animate);
      } else {
        // === TRANSITION SEQUENCING: Step 2 - Animation complete ===
        expandAnimationRef.current = null;
        setExpandProgress(0);
        setSelectedPaper(null);

        // === Step 3 - Restore parent system ===
        // Restore preserved state if available
        if (preservedStateRef.current && simulationRef.current) {
          // Restore positions (state is already preserved in simulation)
          // Restart parent physics loop
          simulationRef.current.alpha(0.3).restart();
        }

        // === Step 4 - Return to overview mode ===
        setVisualizationMode('MODE_OVERVIEW');
      }
    };

    expandAnimationRef.current = requestAnimationFrame(animate);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center p-8">
      {/* Container */}
      <div
        ref={containerRef}
        className="relative w-full h-[85vh] rounded-3xl glass shadow-2xl overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
        />

        {/* Labels for Split Views */}
        <AnimatePresence>
          {activeFilters.includes("impact") && !activeFilters.includes("code") && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none"
            >
              <div className="absolute top-1/2 left-[30%] -translate-x-1/2 -translate-y-1/2 text-white/30 text-sm font-medium tracking-wider uppercase">
                Low ML Impact (≤50)
              </div>
              <div className="absolute top-1/2 left-[70%] -translate-x-1/2 -translate-y-1/2 text-white/30 text-sm font-medium tracking-wider uppercase">
                High ML Impact (&gt;50)
              </div>
              {/* Vertical divider line */}
              <div className="absolute top-0 left-1/2 w-px h-full bg-white/5 border-l border-dashed border-white/10" />
            </motion.div>
          )}
          {activeFilters.includes("code") && activeFilters.includes("impact") && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none"
            >
              {/* Vertical labels for code availability */}
              <div className="absolute top-[35%] left-8 text-white/30 text-sm font-medium tracking-wider uppercase -translate-y-1/2">
                Code Available
              </div>
              <div className="absolute top-[65%] left-8 text-white/30 text-sm font-medium tracking-wider uppercase -translate-y-1/2">
                No Code
              </div>
              {/* Horizontal labels for ML impact */}
              <div className="absolute top-8 left-[30%] -translate-x-1/2 text-white/30 text-xs font-medium tracking-wider uppercase">
                Low ML (≤50)
              </div>
              <div className="absolute top-8 left-[70%] -translate-x-1/2 text-white/30 text-xs font-medium tracking-wider uppercase">
                High ML (&gt;50)
              </div>
              {/* Horizontal divider line */}
              <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 border-t border-dashed border-white/10" />
              {/* Vertical divider line */}
              <div className="absolute top-0 left-1/2 w-px h-full bg-white/5 border-l border-dashed border-white/10" />
            </motion.div>
          )}
          {activeFilters.includes("code") && !activeFilters.includes("impact") && (
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
              {/* Horizontal divider line */}
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
        {hoveredNode && visualizationMode === 'MODE_OVERVIEW' && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "fixed",
              left: (() => {
                // Smart positioning: check if tooltip would go off-screen
                if (typeof window === 'undefined') return tooltipPos.x + 20;
                const tooltipWidth = tooltipRef.current?.offsetWidth || 320; // max-w-xs ~ 320px
                const offset = 20;
                const wouldOverflowRight = tooltipPos.x + offset + tooltipWidth > window.innerWidth;
                return wouldOverflowRight ? tooltipPos.x - tooltipWidth - offset : tooltipPos.x + offset;
              })(),
              top: (() => {
                // Smart positioning: check if tooltip would go off-screen vertically
                if (typeof window === 'undefined') return tooltipPos.y - 20;
                const tooltipHeight = tooltipRef.current?.offsetHeight || 200;
                const offset = 20;
                const wouldOverflowBottom = tooltipPos.y + tooltipHeight > window.innerHeight;
                return wouldOverflowBottom ? tooltipPos.y - tooltipHeight - offset : tooltipPos.y - offset;
              })(),
              pointerEvents: "none",
              zIndex: 50,
            }}
            className="bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-lg shadow-xl max-w-xs"
          >
            {'paperCount' in hoveredNode ? (
              // Discipline tooltip
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
                  {'yearRange' in hoveredNode ? hoveredNode.yearRange : 'Discipline'}
                </span>
                <h3 className="text-sm font-bold text-white leading-tight">
                  {hoveredNode.name}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-white/70">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    {hoveredNode.paperCount} papers
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    Impact: {Math.round(hoveredNode.impactScore)}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    {hoveredNode.codeAvailableCount} with code
                  </div>
                </div>
              </div>
            ) : (
              // Paper tooltip
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
                  {'domain' in hoveredNode ? hoveredNode.domain : 'Paper'}
                </span>
                <h3 className="text-sm font-bold text-white leading-tight">
                  {'title' in hoveredNode ? hoveredNode.title : 'Unknown'}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-white/70">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    Impact: {Math.round(hoveredNode.impactScore)}
                  </div>
                  {'codeAvailable' in hoveredNode && hoveredNode.codeAvailable && (
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      Code
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded View Overlay */}
      <AnimatePresence>
        {selectedPaper && visualizationMode !== 'MODE_OVERVIEW' && (
          <ExpandedView
            paper={selectedPaper}
            containerRef={containerRef}
            progress={expandProgress}
            onClose={handleCollapse}
            isFullyExpanded={visualizationMode === 'MODE_EXPANDED'}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// === EXPANDED VIEW COMPONENT ===
interface ExpandedViewProps {
  paper: ExtendedPaper;
  containerRef: React.RefObject<HTMLDivElement | null>;
  progress: number;
  onClose: () => void;
  isFullyExpanded: boolean;
}

function ExpandedView({ paper, containerRef, progress, onClose, isFullyExpanded }: ExpandedViewProps) {
  // Calculate bubble color based on position
  const getBubbleColor = () => {
    if (!containerRef.current || !paper.x) return "#3b82f6";
    const width = containerRef.current.clientWidth;
    const colorScale = d3.scaleSequential((t) => d3.interpolateRdBu(1 - t)).domain([0, width]);
    return colorScale(paper.x);
  };

  const bubbleColor = getBubbleColor();

  // Get container rect (fixed viewport) - SSR safe
  const containerRect = typeof window !== 'undefined' ? containerRef.current?.getBoundingClientRect() : null;

  // Bubble starting position (relative to container)
  const startX = paper.x || 0;
  const startY = paper.y || 0;
  const startRadius = paper.currentRadius || paper.r || 10;

  // Calculate viewport center (where bubble should move to) - SSR safe
  const viewportCenterX = typeof window !== 'undefined' ? window.innerWidth / 2 : 0;
  const viewportCenterY = typeof window !== 'undefined' ? window.innerHeight / 2 : 0;

  // Container offset (bubble coords are relative to container, but we need screen coords)
  const containerOffsetX = containerRect?.left || 0;
  const containerOffsetY = containerRect?.top || 0;

  // Bubble center in screen coordinates
  const bubbleScreenX = containerOffsetX + startX;
  const bubbleScreenY = containerOffsetY + startY;

  // Calculate scale factor to fill viewport - SSR safe
  const viewportSize = typeof window !== 'undefined' ? Math.max(window.innerWidth, window.innerHeight) : 1000;
  const scaleMultiplier = viewportSize / (startRadius * 2);

  // Interpolated position: bubble moves from original position to viewport center
  const currentX = bubbleScreenX + (viewportCenterX - bubbleScreenX) * progress;
  const currentY = bubbleScreenY + (viewportCenterY - bubbleScreenY) * progress;

  // Interpolated scale
  const currentScale = 1 + (scaleMultiplier - 1) * progress;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50"
      style={{ pointerEvents: isFullyExpanded ? "auto" : "none" }}
    >
      {/* Expanding circle that fills the screen */}
      <div
        className="absolute"
        style={{
          left: 0,
          top: 0,
          width: `${startRadius * 2}px`,
          height: `${startRadius * 2}px`,
          transform: `translate(${currentX - startRadius}px, ${currentY - startRadius}px) scale(${currentScale})`,
          transformOrigin: 'center center',
          borderRadius: `${50 - progress * 40}%`, // Circle (50%) → slight rounding (10%)
          background: `linear-gradient(135deg, ${bubbleColor}90, ${bubbleColor}40)`,
          transition: 'none',
          willChange: 'transform',
        }}
      />

      {/* Dimmed background behind expanded view */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{ opacity: progress }}
      />

      {/* Content panel that appears after zoom */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{
          opacity: progress > 0.7 ? 1 : 0,
          scale: progress > 0.7 ? 1 : 0.95
        }}
        transition={{ duration: 0.3 }}
        className="absolute inset-8 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
        style={{ pointerEvents: progress > 0.7 ? 'auto' : 'none' }}
      >
        {/* Header */}
        <div className="p-8 border-b border-white/10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3">
                <h2 className="text-3xl font-bold text-white leading-tight">
                  {paper.title}
                </h2>
              </div>
              <div className="flex items-center gap-4 text-base text-white/80 font-medium">
                <span>{paper.year}</span>
                <span>•</span>
                <span
                  style={{ color: bubbleColor }}
                >
                  {paper.domain}
                </span>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md border border-white/20"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-auto h-[calc(100%-160px)] space-y-6">
          {/* Top Grid Section - ML Impact, Code Availability, Frameworks, Methods */}
          <div className="grid grid-cols-2 gap-6">
            {/* ML Impact */}
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3">ML Impact</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">{Math.round(paper.impactScore)}</span>
                <span className="text-lg text-white/60">/ 100</span>
              </div>
              {/* Impact bar visualization */}
              <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${paper.impactScore}%`,
                    background: `linear-gradient(90deg, ${bubbleColor}, ${bubbleColor}dd)`
                  }}
                />
              </div>
            </div>

            {/* Code Availability */}
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3">Code Availability</h3>
              <div className="flex items-center gap-3">
                {paper.codeAvailable ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-xl font-semibold text-green-400">Available</span>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <span className="text-xl font-semibold text-red-400">Not Available</span>
                  </>
                )}
              </div>
            </div>

            {/* ML Frameworks */}
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3">ML Frameworks</h3>
              <div className="flex flex-wrap gap-2">
                {paper.mlFrameworks && paper.mlFrameworks.length > 0 ? (
                  paper.mlFrameworks.map((framework, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-lg bg-white/10 text-white/90 text-sm font-medium border border-white/10"
                    >
                      {framework}
                    </span>
                  ))
                ) : (
                  <span className="text-white/40 text-sm italic">Not specified</span>
                )}
              </div>
            </div>

            {/* Statistical Methods */}
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3">Statistical Methods</h3>
              <div className="flex flex-wrap gap-2">
                {paper.statisticalMethods && paper.statisticalMethods.length > 0 ? (
                  paper.statisticalMethods.map((method, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-lg bg-white/10 text-white/90 text-sm font-medium border border-white/10"
                    >
                      {method}
                    </span>
                  ))
                ) : (
                  <span className="text-white/40 text-sm italic">Not specified</span>
                )}
              </div>
            </div>
          </div>

          {/* Graph Visualization */}
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-4">Impact Metrics</h3>
            <ImpactMetricsChart paper={paper} bubbleColor={bubbleColor} />
          </div>

          {/* Summary Box at Bottom */}
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3">Summary</h3>
            <p className="text-white/90 text-base leading-relaxed">
              {paper.summary || "No summary available for this paper."}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// === IMPACT METRICS CHART ===
interface ImpactMetricsChartProps {
  paper: Paper;
  bubbleColor: string;
}

function ImpactMetricsChart({ paper, bubbleColor }: ImpactMetricsChartProps) {
  // Metrics to visualize
  const metrics = [
    {
      label: "ML Impact",
      value: paper.impactScore,
      maxValue: 100,
      color: bubbleColor,
    },
    {
      label: "Citations",
      value: Math.min((paper.citations / 100) * 100, 100), // Normalize to 100
      maxValue: 100,
      color: d3.interpolateRgb(bubbleColor, "#8b5cf6")(0.4),
    },
    {
      label: "Code Availability",
      value: paper.codeAvailable ? 100 : 0,
      maxValue: 100,
      color: paper.codeAvailable ? "#22c55e" : "#ef4444",
    },
  ];

  return (
    <div className="space-y-4">
      {metrics.map((metric, idx) => (
        <div key={idx} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/80 font-medium">{metric.label}</span>
            <span className="text-white/60">{Math.round(metric.value)}</span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(metric.value / metric.maxValue) * 100}%` }}
              transition={{ duration: 0.8, delay: idx * 0.1, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${metric.color}, ${metric.color}dd)`
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}