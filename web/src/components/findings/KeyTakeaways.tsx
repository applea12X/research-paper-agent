import { SectionHeader } from "./shared/SectionHeader";
import { KeyTakeaway } from "@/types/findings";
import { CheckCircle2, TrendingUp, HelpCircle } from "lucide-react";

interface KeyTakeawaysProps {
  takeaways: KeyTakeaway[];
}

export function KeyTakeaways({ takeaways }: KeyTakeawaysProps) {
  const groupedTakeaways = {
    strong: takeaways.filter((t) => t.category === "strong"),
    emerging: takeaways.filter((t) => t.category === "emerging"),
    open: takeaways.filter((t) => t.category === "open"),
  };

  return (
    <section className="mb-16">
      <SectionHeader
        subtitle="Section 5"
        title="Key Takeaways & Implications"
        description="Evidence-backed insights, emerging patterns, and open questions. Clear differentiation between signal strength levels."
      />

      <div className="space-y-6">
        {/* Strong Signals */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide">
              Strong Signals
            </h3>
            <span className="text-xs text-white/40">
              High confidence, robust evidence
            </span>
          </div>
          <div className="space-y-3">
            {groupedTakeaways.strong.map((takeaway, i) => (
              <TakeawayCard key={i} takeaway={takeaway} />
            ))}
          </div>
        </div>

        {/* Emerging Patterns */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-yellow-400" />
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide">
              Emerging Patterns
            </h3>
            <span className="text-xs text-white/40">
              Medium confidence, developing evidence
            </span>
          </div>
          <div className="space-y-3">
            {groupedTakeaways.emerging.map((takeaway, i) => (
              <TakeawayCard key={i} takeaway={takeaway} />
            ))}
          </div>
        </div>

        {/* Open Questions */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide">
              Open Questions
            </h3>
            <span className="text-xs text-white/40">
              Low confidence, insufficient data
            </span>
          </div>
          <div className="space-y-3">
            {groupedTakeaways.open.map((takeaway, i) => (
              <TakeawayCard key={i} takeaway={takeaway} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

interface TakeawayCardProps {
  takeaway: KeyTakeaway;
}

function TakeawayCard({ takeaway }: TakeawayCardProps) {
  const categoryConfig = {
    strong: {
      borderColor: "border-green-500/30",
      bgColor: "bg-green-500/5",
      badgeColor: "bg-green-500/20 text-green-300 border-green-500/40",
    },
    emerging: {
      borderColor: "border-yellow-500/30",
      bgColor: "bg-yellow-500/5",
      badgeColor: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
    },
    open: {
      borderColor: "border-blue-500/30",
      bgColor: "bg-blue-500/5",
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    },
  };

  const evidenceConfig = {
    high: "text-green-400",
    medium: "text-yellow-400",
    low: "text-blue-400",
  };

  const config = categoryConfig[takeaway.category];

  return (
    <div
      className={`glass rounded-xl p-5 border ${config.borderColor} ${config.bgColor}`}
    >
      <div className="flex items-start justify-between gap-4 mb-2">
        <h4 className="text-sm font-semibold text-white/90 leading-relaxed flex-1">
          {takeaway.title}
        </h4>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full border whitespace-nowrap ${config.badgeColor}`}
        >
          {takeaway.evidenceStrength}
        </span>
      </div>
      <p className="text-sm text-white/60 leading-relaxed mb-3">
        {takeaway.description}
      </p>
      {takeaway.supportingData && (
        <p className="text-xs font-mono text-white/40 bg-black/20 px-3 py-2 rounded-lg border border-white/5">
          {takeaway.supportingData}
        </p>
      )}
    </div>
  );
}
