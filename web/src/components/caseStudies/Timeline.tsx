"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar } from "lucide-react";
import { CaseStudy, CaseEvent, CaseEventType } from "@/data/realCaseStudies";
import { useVirtualTimelineScroll } from "@/hooks/useVirtualTimelineScroll";

interface TimelineProps {
  caseStudy?: CaseStudy;
  events: CaseEvent[];
  selectedEventId: string | null;
  onEventSelect: (eventId: string | null) => void;
}

const EVENT_TYPE_CONFIG: Record<CaseEventType, { color: string; icon: string; label: string }> = {
  METHOD: { color: "bg-blue-500", icon: "🔬", label: "Method" },
  DOMAIN_APPLICATION: { color: "bg-green-500", icon: "🎯", label: "Application" },
  RELEASE: { color: "bg-purple-500", icon: "📦", label: "Release" },
  REPLICATION: { color: "bg-orange-500", icon: "🔄", label: "Replication" },
  CORRECTION: { color: "bg-red-500", icon: "⚠️", label: "Correction" },
  OUTCOME: { color: "bg-emerald-500", icon: "🏆", label: "Outcome" },
  MEDIA: { color: "bg-pink-500", icon: "📺", label: "Media" },
};

// Motion variants for card states
const cardVariants = {
  active: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
      duration: 0.35
    }
  },
  inactive: {
    opacity: 0.6,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
      duration: 0.35
    }
  },
  entering: {
    y: 16,
    opacity: 0.8,
    scale: 0.99
  }
};

// Content variants for description and metrics
const contentVariants = {
  visible: {
    opacity: 1,
    height: "auto",
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1] as const
    }
  },
  hidden: {
    opacity: 0,
    height: 0,
    y: -10,
    transition: {
      duration: 0.25,
      ease: [0.4, 0, 1, 1] as const
    }
  }
};

export function Timeline({ caseStudy, events, selectedEventId, onEventSelect }: TimelineProps) {
  // Initialize year state from events
  const initialYear = useMemo(() => {
    if (events.length === 0) return 2018;
    return Math.min(...events.map(e => e.year));
  }, [events]);
  
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const eventRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  // Virtual scroll refs
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const yearGroupRefs = useRef<HTMLDivElement[]>([]);
  const scrollToIndexRef = useRef<((idx: number, opts?: { immediate?: boolean }) => void) | null>(null);
  
  const sortedEvents = useMemo(() => {
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events]);

  const minYear = Math.min(...events.map(e => e.year), 2016);
  const maxYear = Math.max(...events.map(e => e.year), 2024);

  // Group events by year
  const eventsByYear = useMemo(() => {
    const grouped: Record<number, CaseEvent[]> = {};
    sortedEvents.forEach(event => {
      if (!grouped[event.year]) {
        grouped[event.year] = [];
      }
      grouped[event.year].push(event);
    });
    return grouped;
  }, [sortedEvents]);

  // Get unique event years for virtual scrolling
  const eventYears = useMemo(() => {
    if (events.length === 0) return [];
    return Array.from(new Set(events.map(e => e.year))).sort((a, b) => a - b);
  }, [events]);

  // Get priority event for a given year (for details panel)
  const getPriorityEvent = useCallback((yearEvents: typeof events) => {
    if (yearEvents.length === 0) return null;
    
    // Priority order: OUTCOME > RELEASE > DOMAIN_APPLICATION > METHOD > others
    const priorityOrder: Record<string, number> = {
      'OUTCOME': 5,
      'RELEASE': 4,
      'DOMAIN_APPLICATION': 3,
      'METHOD': 2,
    };
    
    return yearEvents.sort((a, b) => {
      // First by priority type
      const aPriority = priorityOrder[a.type] || 1;
      const bPriority = priorityOrder[b.type] || 1;
      if (aPriority !== bPriority) return bPriority - aPriority;
      
      // Then by ML impact score
      if (a.mlImpactScore !== b.mlImpactScore) return b.mlImpactScore - a.mlImpactScore;
      
      // Then by earlier date
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    })[0];
  }, []);

  // Single source of truth for year changes - handles all state updates
  const commitYear = useCallback((nextYear: number, opts?: { source?: "wheel" | "slider" | "click"; preferredEventId?: string }) => {
    // If same year, do nothing
    if (nextYear === selectedYear) return;
    
    const { source = "slider", preferredEventId } = opts || {};
    
    // Update selectedYear
    setSelectedYear(nextYear);
    
    // Get events for this year
    const yearEvents = eventsByYear[nextYear] || [];
    
    // Determine which event to select
    let eventToSelect: CaseEvent | null = null;
    
    if (preferredEventId) {
      // If preferred event ID provided and it belongs to this year, use it
      const preferredEvent = yearEvents.find(e => e.id === preferredEventId);
      if (preferredEvent) {
        eventToSelect = preferredEvent;
      }
    }
    
    // Otherwise, use priority event as default
    if (!eventToSelect) {
      eventToSelect = getPriorityEvent(yearEvents);
    }
    
    // Update selected event
    if (eventToSelect) {
      onEventSelect(eventToSelect.id);
    }
    
    // Notify scroll hook to align to this year
    // Use snapToYearIndex for proper ordering: expand -> measure -> clamp -> animate
    if (scrollToIndexRef.current) {
      const idx = eventYears.indexOf(nextYear);
      if (idx !== -1) {
        // For slider, use immediate; for wheel/click, animate
        // Wheel already sets visual position, but this ensures proper re-measurement
        scrollToIndexRef.current(idx, { immediate: source === "slider" });
      }
    }
  }, [selectedYear, eventsByYear, getPriorityEvent, onEventSelect, eventYears]);

  // Expanded years - only the selected year is expanded (single expanded year design)
  const expandedYears = useMemo(() => {
    return [selectedYear];
  }, [selectedYear]);

  // Update selected year when case study changes
  useEffect(() => {
    if (events.length > 0 && caseStudy?.id) {
      const firstYear = Math.min(...events.map(e => e.year));
      commitYear(firstYear, { source: "slider" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseStudy?.id, events.length]);

  // Get expanded event IDs (all events in the selected year)
  const expandedEventIds = useMemo(() => {
    const yearEvents = eventsByYear[selectedYear] || [];
    return yearEvents
      .filter(event => event.year === selectedYear)
      .map(event => event.id);
  }, [eventsByYear, selectedYear]);

  // Year-based virtual scroll hook
  const { ySpring, scrollToIndex } = useVirtualTimelineScroll({
    viewportRef,
    contentRef,
    yearGroupRefs,
    eventYears,
    selectedYear,
    selectedCaseId: caseStudy?.id || '',
    expandedYears,
    onRequestYearChange: (nextYear, meta) => {
      // Wheel scroll requests year change - go through commitYear
      // This ensures expand -> measure -> clamp -> animate ordering
      commitYear(nextYear, { source: meta.source });
    },
  });

  // Store scrollToIndex ref so commitYear can call it
  useEffect(() => {
    scrollToIndexRef.current = scrollToIndex;
  }, [scrollToIndex]);

  // Handle scrubber changes - use commitYear
  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newYear = Number(e.target.value);
    commitYear(newYear, { source: "slider" });
  };

  // Handle event card clicks - use commitYear
  const handleEventClick = useCallback((event: CaseEvent) => {
    commitYear(event.year, { source: "click", preferredEventId: event.id });
  }, [commitYear]);


  if (!caseStudy) {
    return (
      <div className="flex items-center justify-center h-full text-white/40">
        <p>Select a case study to view timeline</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white/90">{caseStudy.title}</h2>
          <p className="text-sm text-white/60 mt-1">{caseStudy.summary}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/70">
          <Calendar className="w-4 h-4" />
          <span>Timeline</span>
        </div>
      </div>

      {/* Year Scrubber */}
      <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-white/70 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Timeline Scrubber
          </span>
          <span className="text-lg font-bold text-white/90">{selectedYear}</span>
        </div>
        
        <div className="relative">
          <input
            type="range"
            min={minYear}
            max={maxYear}
            value={selectedYear}
            onChange={handleScrubberChange}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer 
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                     [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-300 [&::-webkit-slider-thumb]:shadow-lg
                     [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full 
                     [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-blue-300"
          />
          
          {/* Year markers */}
          <div className="flex justify-between mt-2 text-xs text-white/40">
            {Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i).map(year => (
              <span key={year} className={year === selectedYear ? "text-blue-400 font-medium" : ""}>
                {year}
              </span>
            ))}
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mt-3 text-xs text-white/60">
          Showing {sortedEvents.length} events
        </div>
      </div>

      {/* Timeline Events */}
      <div 
        ref={timelineScrollRef} 
        className="flex-1 overflow-hidden max-h-[calc(100vh-24rem)] relative"
      >
        {/* Timeline Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500/50 via-purple-500/50 to-transparent z-10"></div>
        
        {/* Virtual scroll viewport */}
        <div 
          ref={viewportRef}
          className="relative h-full overflow-hidden"
          style={{ 
            flex: '1', 
            minHeight: 0,
            overflow: 'hidden'
          }}
        >
          <motion.div 
            ref={contentRef}
            className="relative pb-6"
            style={{ y: ySpring }}
          >
            <AnimatePresence mode="sync">
              {eventYears.map((year, yearIndex) => {
                const yearEvents = (eventsByYear[year] || []).sort((a, b) => 
                  new Date(a.date).getTime() - new Date(b.date).getTime()
                );
                
                return (
                  <div
                    key={year}
                    ref={(el) => {
                      if (el) {
                        // Ensure array is sized correctly
                        if (!yearGroupRefs.current) {
                          yearGroupRefs.current = [];
                        }
                        yearGroupRefs.current[yearIndex] = el;
                      } else if (yearGroupRefs.current) {
                        // Clean up ref if element is unmounted
                        delete yearGroupRefs.current[yearIndex];
                      }
                    }}
                    className="year-group"
                  >
                    {yearEvents.map((event) => {
                      const config = EVENT_TYPE_CONFIG[event.type];
                      const isExpanded = expandedEventIds.includes(event.id);
                      const isSelected = selectedEventId === event.id;
                      const eventDate = new Date(event.date);
                      
                      return (
                        <motion.div
                          key={event.id}
                          ref={(el) => { eventRefs.current[event.id] = el; }}
                          layout
                          variants={cardVariants}
                          initial={isExpanded ? "entering" : "inactive"}
                          animate={isExpanded ? "active" : "inactive"}
                          onClick={() => handleEventClick(event)}
                          className="relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 mb-6"
                          style={{ zIndex: isExpanded ? 10 : 1 }}
                        >
                          {/* Timeline dot */}
                          <motion.div 
                            className={`absolute left-6 w-4 h-4 rounded-full ${config.color} flex items-center justify-center z-10`}
                            animate={{ 
                              scale: isExpanded ? 1.1 : 1
                            }}
                            transition={{ duration: 0.3 }}
                          >
                            <span className="text-xs">{config.icon}</span>
                          </motion.div>
                          
                          {/* Event card */}
                          <motion.div
                            className={`ml-16 rounded-xl border overflow-hidden transition-colors ${
                              isExpanded
                                ? "bg-blue-500/20 border-blue-500/30"
                                : "bg-white/3 border-white/8 hover:bg-white/6 hover:border-white/15"
                            } ${
                              isSelected ? "border-blue-500/50 shadow-[0_0_0_1px_rgba(59,130,246,0.35)] outline-none" : ""
                            }`}
                            animate={{
                              backdropFilter: isExpanded ? "blur(16px)" : "blur(6px)",
                              minHeight: isExpanded ? 220 : 58,
                              padding: isExpanded ? "24px" : "12px"
                            }}
                            transition={{ duration: 0.35, ease: "easeOut" }}
                          >

                            {/* Header section - Always visible */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {isExpanded && (
                                  <motion.span 
                                    className={`text-xs px-2 py-0.5 rounded-full ${config.color}/20 text-white/80 border border-white/20 whitespace-nowrap`}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    {config.label}
                                  </motion.span>
                                )}
                                
                                <motion.h3 
                                  className={`font-semibold truncate min-w-0 ${
                                    isExpanded ? "text-white/95" : "text-white/85"
                                  }`}
                                  animate={{
                                    fontSize: isExpanded ? "1.125rem" : "0.875rem",
                                    lineHeight: isExpanded ? "1.75rem" : "1.25rem",
                                  }}
                                  transition={{ duration: 0.3 }}
                                >
                                  {event.title}
                                </motion.h3>
                              </div>
                              
                              {isExpanded && (
                                <motion.span 
                                  className="text-xs text-white/40 ml-2 whitespace-nowrap"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ duration: 0.3, delay: 0.1 }}
                                >
                                  {eventDate.toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </motion.span>
                              )}
                            </div>
                            
                            {/* Description section - Only for expanded */}
                            <motion.div
                              variants={contentVariants}
                              animate={isExpanded ? "visible" : "hidden"}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 mb-3">
                                <p className="text-sm leading-relaxed text-white/80" style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: 'vertical' as const,
                                  overflow: 'hidden'
                                }}>
                                  {event.description}
                                </p>
                              </div>
                            </motion.div>
                            
                            {/* Metrics section - Only for expanded */}
                            <motion.div
                              variants={contentVariants}
                              animate={isExpanded ? "visible" : "hidden"}
                              className="overflow-hidden"
                            >
                              <div className="flex items-center gap-4 text-xs text-white/50">
                                <span>{event.citations} citations</span>
                                {event.codeAvailable && (
                                  <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                    Code Available
                                  </span>
                                )}
                                {event.patents > 0 && <span>{event.patents} patents</span>}
                                {event.mediaMentions > 0 && <span>{event.mediaMentions} media mentions</span>}
                              </div>
                            </motion.div>
                          </motion.div>
                        </motion.div>
                      );
                    })}
                  </div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </>
  );
}