"use client";

interface SkillTagsProps {
  skills: string[];
  variant?: "detected" | "missing";
}

export function SkillTags({ skills, variant = "detected" }: SkillTagsProps) {
  if (!skills?.length) {
    return <p className="text-sm text-slate-500 italic">None detected</p>;
  }

  const tagClass =
    variant === "detected"
      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
      : "bg-red-500/20 text-red-300 border border-red-500/30";

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill, i) => (
        <span key={i} className={`px-2.5 py-1 rounded-full text-xs font-medium ${tagClass}`}>
          {skill}
        </span>
      ))}
    </div>
  );
}
