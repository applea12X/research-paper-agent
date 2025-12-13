"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar } from "lucide-react";
import { CaseStudy, CaseEvent, CaseEventType } from "@/data/mockCaseStudies";

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
  const [currentYear, setCurrentYear] = useState(2018);
  const [selectedYear, setSelectedYear] = useState(2018);
  const [prevEventCount, setPrevEventCount] = useState(0);
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const eventRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  const sortedEvents = useMemo(() => {
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events]);

  const minYear = Math.min(...events.map(e => e.year), 2016);
  const maxYear = Math.max(...events.map(e => e.year), 2024);

  const visibleEvents = useMemo(() => {
    return sortedEvents.filter(event => event.year <= currentYear);
  }, [sortedEvents, currentYear]);

  // Get expanded event IDs (all events in the selected year)
  const expandedEventIds = useMemo(() => {
    return visibleEvents
      .filter(event => event.year === selectedYear)
      .map(event => event.id);
  }, [visibleEvents, selectedYear]);

  // Get priority event for the selected year (for details panel)
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

  // Get the default selected event for the year
  const defaultSelectedEvent = useMemo(() => {
    const eventsForSelectedYear = visibleEvents.filter(event => event.year === selectedYear);
    return getPriorityEvent(eventsForSelectedYear);
  }, [visibleEvents, selectedYear, getPriorityEvent]);

  // Control scroll behavior when events change
  useEffect(() => {
    if (visibleEvents.length !== prevEventCount) {
      if (visibleEvents.length > prevEventCount) {
        // New events added - scroll up to make room
        setIsScrollingUp(true);
        if (timelineScrollRef.current) {
          const scrollContainer = timelineScrollRef.current;
          const scrollUp = () => {
            // Scroll up to simulate old events moving out of view
            const currentScroll = scrollContainer.scrollTop;
            scrollContainer.scrollTo({
              top: currentScroll + 120, // Move up by roughly one event height
              behavior: 'smooth'
            });
          };
          
          setTimeout(scrollUp, 50);
          setTimeout(() => setIsScrollingUp(false), 600);
        }
      }
      setPrevEventCount(visibleEvents.length);
    }
  }, [visibleEvents.length, prevEventCount]);

  // Handle scrubber changes
  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newYear = Number(e.target.value);
    setCurrentYear(newYear);
    setSelectedYear(newYear);
  };

  // Handle event card clicks
  const handleEventClick = useCallback((event: CaseEvent) => {
    setCurrentYear(event.year);
    setSelectedYear(event.year);
    onEventSelect(event.id);
    
    // Gentle scroll to the clicked event
    setTimeout(() => {
      const eventElement = eventRefs.current[event.id];
      const scrollContainer = timelineScrollRef.current;
      
      if (eventElement && scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const elementRect = eventElement.getBoundingClientRect();
        const containerTop = containerRect.top;
        const elementTop = elementRect.top;
        const containerHeight = containerRect.height;
        
        // Calculate how much to scroll to center the element gently
        const currentScroll = scrollContainer.scrollTop;
        const elementOffset = elementTop - containerTop;
        const targetScroll = currentScroll + elementOffset - (containerHeight / 2) + (elementRect.height / 2);
        
        // Use a gentle easing function for smooth animation
        const startTime = performance.now();
        const startScroll = currentScroll;
        const scrollDistance = targetScroll - startScroll;
        const duration = 800; // Longer, more gentle duration
        
        const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
        
        const animateScroll = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easedProgress = easeOutQuart(progress);
          
          scrollContainer.scrollTo({
            top: startScroll + (scrollDistance * easedProgress),
            behavior: 'auto'
          });
          
          if (progress < 1) {
            requestAnimationFrame(animateScroll);
          }
        };
        
        requestAnimationFrame(animateScroll);
      }
    }, 200); // Slightly longer delay for expansion to settle
  }, [onEventSelect]);

  // Auto-select default event when selected year changes
  useEffect(() => {
    if (defaultSelectedEvent && (!selectedEventId || !expandedEventIds.includes(selectedEventId))) {
      onEventSelect(defaultSelectedEvent.id);
    }
  }, [defaultSelectedEvent, selectedEventId, expandedEventIds, onEventSelect]);

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
          <span className="text-lg font-bold text-white/90">{currentYear}</span>
        </div>
        
        <div className="relative">
          <input
            type="range"
            min={minYear}
            max={maxYear}
            value={currentYear}
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
              <span key={year} className={year === currentYear ? "text-blue-400 font-medium" : ""}>
                {year}
              </span>
            ))}
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mt-3 text-xs text-white/60">
          Showing {visibleEvents.length} of {sortedEvents.length} events
        </div>
      </div>

      {/* Timeline Events */}
      <div ref={timelineScrollRef} className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="relative min-h-[400px]">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500/50 via-purple-500/50 to-transparent"></div>
          
          <AnimatePresence mode="sync">
            <motion.div 
              className="space-y-6"
              layout
              transition={{
                layout: {
                  type: "spring",
                  stiffness: 500,
                  damping: 35
                }
              }}
            >
              {visibleEvents.map((event, index) => {
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
                    className="relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
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
              
              {/* Placeholder for future events */}
              {visibleEvents.length < sortedEvents.length && (
                <motion.div 
                  className="relative opacity-30"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="absolute left-6 w-4 h-4 rounded-full bg-gray-600 flex items-center justify-center z-10">
                    <span className="text-xs">⏳</span>
                  </div>
                  <div className="ml-16 p-4 rounded-xl border border-white/5 bg-white/5">
                    <p className="text-sm text-white/40 italic">
                      {sortedEvents.length - visibleEvents.length} more events to discover...
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}