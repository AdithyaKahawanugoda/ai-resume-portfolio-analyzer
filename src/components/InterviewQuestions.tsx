"use client";

interface InterviewQuestionsProps {
  questions: string[];
}

export function InterviewQuestions({ questions }: InterviewQuestionsProps) {
  if (!questions?.length) return null;

  return (
    <ol className="space-y-3">
      {questions.map((q, i) => (
        <li key={i} className="flex gap-3 text-sm text-slate-300">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-semibold border border-indigo-500/30">
            {i + 1}
          </span>
          <span className="leading-relaxed">{q}</span>
        </li>
      ))}
    </ol>
  );
}
