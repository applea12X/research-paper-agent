"use client";

import { HelpCircle, Calendar, Quote, Award, Code, Database, RotateCcw, AlertTriangle, Building, Microscope, Newspaper, Scale } from "lucide-react";
import { CaseEvent } from "@/data/realCaseStudies";

interface EventDetailsProps {
  event: CaseEvent | null;
}

export function EventDetails({ event }: EventDetailsProps) {
  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/40">
        <Calendar className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-center">Select an event to view details</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    if (score >= 40) return "text-orange-400";
    return "text-red-400";
  };

  const signals = [
    { icon: Quote, label: "Citations", value: event.citations.toLocaleString(), color: "text-blue-400" },
    { icon: Code, label: "Code Available", value: event.codeAvailable ? "Yes" : "No", color: event.codeAvailable ? "text-green-400" : "text-red-400" },
    { icon: Database, label: "Data Available", value: event.dataAvailable ? "Yes" : "No", color: event.dataAvailable ? "text-green-400" : "text-red-400" },
    { icon: RotateCcw, label: "Replication Attempts", value: event.replicationAttempts.toString(), color: "text-purple-400" },
    { icon: AlertTriangle, label: "Corrections", value: event.corrections.toString(), color: event.corrections > 0 ? "text-yellow-400" : "text-gray-400" },
    { icon: Building, label: "Patents", value: event.patents.toString(), color: "text-indigo-400" },
    { icon: Newspaper, label: "Media Mentions", value: event.mediaMentions.toString(), color: "text-pink-400" },
    { icon: Scale, label: "Policy Mentions", value: event.policyMentions.toString(), color: "text-cyan-400" },
  ];

  if (event.clinicalStage) {
    signals.push({
      icon: Microscope,
      label: "Clinical Stage",
      value: event.clinicalStage,
      color: "text-emerald-400"
    });
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white/90">Event Details</h2>
      </div>

      <div className="space-y-6 overflow-y-auto custom-scrollbar flex-1">
        {/* Event Header */}
        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
          <h3 className="font-bold text-white/90 mb-2">{event.title}</h3>
          <p className="text-sm text-white/70 mb-3">{formatDate(event.date)}</p>
          <p className="text-sm text-white/60 leading-relaxed">{event.description}</p>
        </div>

        {/* Signals Section */}
        <div>
          <h4 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
            Signals
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {signals.map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="text-sm text-white/70">{label}</span>
                </div>
                <span className={`text-sm font-medium ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ML Impact Card */}
        <div className="p-4 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl border border-white/10">
          <h4 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-400" />
            ML Impact Metrics
          </h4>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/70">Attribution Score</span>
              <span className={`font-mono ${getScoreColor(event.attribution * 100)}`}>
                {event.attribution.toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/70">Acceleration</span>
              <span className={`font-mono ${event.accelerationMonths > 0 ? "text-green-400" : "text-red-400"}`}>
                {event.accelerationMonths > 0 ? "+" : ""}{Number(event.accelerationMonths.toFixed(3))} months
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/70">Efficiency Proxy</span>
              <span className="font-mono text-blue-400">
                {event.efficiencyProxy.toLocaleString()}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/70">ML Impact Score</span>
              <span className={`font-mono font-bold ${getScoreColor(event.mlImpactScore)}`}>
                {event.mlImpactScore}/100
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/70">Repro Score</span>
              <span className={`font-mono font-bold ${getScoreColor(event.codeReproScore)}`}>
                {event.codeReproScore}/100
              </span>
            </div>
          </div>
        </div>

        {/* Future Feature Button */}
        <button 
          disabled
          className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white/40 cursor-not-allowed flex items-center justify-center gap-2 hover:bg-white/10 transition-colors group relative"
          title="Coming soon"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Explain this score</span>
          
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white/80 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Coming soon
          </div>
        </button>
      </div>
    </>
  );
}