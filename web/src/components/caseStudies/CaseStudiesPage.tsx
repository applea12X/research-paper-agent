"use client";

import { useState } from "react";
import { CaseList } from "./CaseList";
import { Timeline } from "./Timeline";
import { EventDetails } from "./EventDetails";
import { MOCK_CASE_STUDIES, getEventsByCaseId, getEventById } from "@/data/mockCaseStudies";

export function CaseStudiesPage() {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(MOCK_CASE_STUDIES[0].id);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const selectedCase = MOCK_CASE_STUDIES.find(cs => cs.id === selectedCaseId);
  const caseEvents = getEventsByCaseId(selectedCaseId);
  const selectedEvent = selectedEventId ? getEventById(selectedEventId) || null : null;

  return (
    <div className="pt-20 px-6 pb-6 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-8rem)] max-w-7xl mx-auto">
        
        {/* Left Panel - Case List */}
        <div className="lg:col-span-3 order-2 lg:order-1">
          <div className="glass rounded-2xl p-6 h-full flex flex-col">
            <CaseList 
              cases={MOCK_CASE_STUDIES}
              selectedCaseId={selectedCaseId}
              onCaseSelect={setSelectedCaseId}
            />
          </div>
        </div>

        {/* Main Panel - Timeline */}
        <div className="lg:col-span-6 order-1 lg:order-2">
          <div className="glass rounded-2xl p-6 h-full flex flex-col">
            <Timeline 
              caseStudy={selectedCase}
              events={caseEvents}
              selectedEventId={selectedEventId}
              onEventSelect={setSelectedEventId}
            />
          </div>
        </div>

        {/* Right Panel - Event Details */}
        <div className="lg:col-span-3 order-3">
          <div className="glass rounded-2xl p-6 h-full flex flex-col">
            <EventDetails 
              event={selectedEvent}
            />
          </div>
        </div>
      </div>
    </div>
  );
}