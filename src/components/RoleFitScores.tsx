"use client";

interface RoleFitScoresProps {
  scores: Record<string, number>;
  targetRole?: string;
}

const ROLE_LABELS: Record<string, string> = {
  frontend: "Frontend",
  backend: "Backend",
  fullstack: "Full Stack",
  devops: "DevOps",
  data_science: "Data Science",
};

export function RoleFitScores({ scores, targetRole }: RoleFitScoresProps) {
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);

  return (
    <div className="space-y-3">
      {sorted.map(([role, score]) => {
        const label = ROLE_LABELS[role] ?? role;
        const isTarget =
          targetRole?.toLowerCase().includes(role) ||
          role.includes(targetRole?.toLowerCase().split(" ")[0] ?? "");
        const barColor =
          score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-red-500";

        return (
          <div key={role}>
            <div className="flex justify-between text-xs mb-1">
              <span className={`font-medium ${isTarget ? "text-indigo-300" : "text-slate-400"}`}>
                {label}
                {isTarget && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    Target
                  </span>
                )}
              </span>
              <span className="text-slate-300 font-medium">{score}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-700">
              <div
                className={`h-2 rounded-full ${barColor} transition-all duration-700`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
