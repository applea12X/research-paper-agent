import { HelpCircle } from "lucide-react";
import { useState } from "react";

interface TooltipProps {
  content: string;
}

export function Tooltip({ content }: TooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block">
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="text-white/40 hover:text-white/60 transition-colors cursor-help inline-flex"
        role="img"
        aria-label="More information"
      >
        <HelpCircle className="w-4 h-4" />
      </span>
      {show && (
        <div className="absolute left-1/2 -translate-x-1/2 top-6 z-20 w-64 p-3 bg-gray-900/95 backdrop-blur-lg border border-white/10 rounded-lg text-xs text-white/80 leading-relaxed shadow-xl">
          {content}
        </div>
      )}
    </div>
  );
}
