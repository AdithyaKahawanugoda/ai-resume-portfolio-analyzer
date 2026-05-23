import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ATSScore } from "@/components/ATSScore";
import { SkillTags } from "@/components/SkillTags";
import { ATSBreakdown } from "@/components/ATSBreakdown";
import { RoleFitScores } from "@/components/RoleFitScores";
import { InterviewQuestions } from "@/components/InterviewQuestions";

interface AnalysisOutput {
  ats_score: number;
  jd_match_score?: number;
  jd_keywords_missing?: string[];
  skills_detected: string[];
  missing_skills: string[];
  improvements: string[];
  resume_rewrite: string;
  role_fit_scores: Record<string, number>;
  ats_breakdown: {
    keywords: number;
    formatting: number;
    experience: number;
    skills: number;
    education: number;
    role_match: number;
  };
  interview_questions: string[];
}

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await prisma.analysisSession.findUnique({
    where: { id },
    include: { resume: true },
  });

  if (!session) notFound();

  const analysis = session.aiOutput as unknown as AnalysisOutput;

  return (
    <main className="min-h-screen bg-[#0b0f1a]">
      <header className="border-b border-slate-800 px-6 py-4 sticky top-0 z-10 bg-[#0b0f1a]/95 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="font-semibold text-white text-sm">ResumeAI</span>
            </Link>
            <span className="text-slate-700">/</span>
            <span className="text-xs text-slate-500 truncate max-w-48">{session.resume.filename}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden sm:block">
              {session.jobRole} • {new Date(session.createdAt).toLocaleDateString()}
            </span>
            <Link href="/" className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:bg-slate-700 transition-colors">
              New Analysis
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Top row: ATS score + optional JD match + breakdown + role fit */}
        <div className={`grid grid-cols-1 gap-4 ${analysis.jd_match_score != null ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
          {/* ATS Score card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center gap-4">
            <div className="w-full">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">ATS Score</h2>
              <div className="flex justify-center">
                <ATSScore score={analysis.ats_score} />
              </div>
            </div>
            <div className="w-full pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-500 text-center">
                Analyzed for <span className="text-indigo-400 font-medium">{session.jobRole}</span>
              </p>
            </div>
          </div>

          {/* JD Match card — only when job description was provided */}
          {analysis.jd_match_score != null && (
            <div className="bg-slate-900 border border-indigo-500/20 rounded-2xl p-6 flex flex-col gap-4">
              <div className="w-full">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">JD Match</h2>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    vs posting
                  </span>
                </div>
                <div className="flex justify-center">
                  <ATSScore score={analysis.jd_match_score} />
                </div>
              </div>
              {analysis.jd_keywords_missing && analysis.jd_keywords_missing.length > 0 && (
                <div className="w-full pt-4 border-t border-slate-800">
                  <p className="text-xs text-slate-500 mb-2">Missing from JD</p>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.jd_keywords_missing.slice(0, 6).map((kw, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-red-500/10 text-red-400 border border-red-500/20">
                        {kw}
                      </span>
                    ))}
                    {analysis.jd_keywords_missing.length > 6 && (
                      <span className="px-2 py-0.5 rounded-full text-xs text-slate-500">
                        +{analysis.jd_keywords_missing.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ATS Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">ATS Breakdown</h2>
            <ATSBreakdown breakdown={analysis.ats_breakdown} />
          </div>

          {/* Role Fit */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Role Fit Scores</h2>
            <RoleFitScores scores={analysis.role_fit_scores} targetRole={session.jobRole} />
          </div>
        </div>

        {/* Skills row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Detected Skills
              <span className="ml-2 px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px]">
                {analysis.skills_detected?.length ?? 0}
              </span>
            </h2>
            <SkillTags skills={analysis.skills_detected} variant="detected" />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Missing Skills
              <span className="ml-2 px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px]">
                {analysis.missing_skills?.length ?? 0}
              </span>
            </h2>
            <SkillTags skills={analysis.missing_skills} variant="missing" />
          </div>
        </div>

        {/* Improvements */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Improvement Suggestions</h2>
          {analysis.improvements?.length ? (
            <ul className="space-y-3">
              {analysis.improvements.map((item, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-300">
                  <span className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 italic">No suggestions available</p>
          )}
        </div>

        {/* Interview Questions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Interview Prep — {session.jobRole}
          </h2>
          <InterviewQuestions questions={analysis.interview_questions} />
        </div>

        {/* Resume Rewrite */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              ATS-Optimized Resume Rewrite
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              AI Generated
            </span>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
            <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
              {analysis.resume_rewrite}
            </pre>
          </div>
        </div>
      </div>
    </main>
  );
}
