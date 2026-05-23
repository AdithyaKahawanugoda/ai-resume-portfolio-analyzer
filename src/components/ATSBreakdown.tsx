"use client";

interface ATSBreakdownProps {
  breakdown: {
    keywords: number;
    formatting: number;
    experience: number;
    skills: number;
    education: number;
    role_match: number;
  };
}

const LABELS: Record<string, string> = {
  keywords: "Keywords",
  formatting: "Formatting",
  experience: "Experience",
  skills: "Skills",
  education: "Education",
  role_match: "Role Match",
};

export function ATSBreakdown({ breakdown }: ATSBreakdownProps) {
  return (
    <div className="space-y-3">
      {Object.entries(breakdown).map(([key, value]) => {
        const barColor =
          value >= 80 ? "bg-emerald-500" : value >= 60 ? "bg-amber-500" : "bg-red-500";
        return (
          <div key={key}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">{LABELS[key] ?? key}</span>
              <span className="text-slate-300 font-medium">{value}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-700">
              <div
                className={`h-1.5 rounded-full ${barColor} transition-all duration-700`}
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
