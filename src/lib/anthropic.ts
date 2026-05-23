import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const MODEL = "claude-sonnet-4-6";

export function buildAnalysisPrompt(resumeText: string, jobRole: string): string {
  return `You are an expert ATS (Applicant Tracking System) analyzer and career coach. Analyze the following resume for the role of "${jobRole}".

RESUME TEXT:
${resumeText}

Analyze this resume specifically for the "${jobRole}" role and return ONLY valid JSON. Do not include markdown, explanations, or extra text.

The JSON must match this exact structure:
{
  "ats_score": <integer 0-100>,
  "skills_detected": [<array of skills found in resume>],
  "missing_skills": [<array of skills expected for ${jobRole} but not found>],
  "improvements": [<array of 5-8 actionable improvement suggestions>],
  "resume_rewrite": "<ATS-optimized rewritten version of the resume>",
  "role_fit_scores": {
    "frontend": <integer 0-100>,
    "backend": <integer 0-100>,
    "fullstack": <integer 0-100>,
    "devops": <integer 0-100>,
    "data_science": <integer 0-100>
  },
  "ats_breakdown": {
    "keywords": <integer 0-100>,
    "formatting": <integer 0-100>,
    "experience": <integer 0-100>,
    "skills": <integer 0-100>,
    "education": <integer 0-100>,
    "role_match": <integer 0-100>
  },
  "interview_questions": [<array of 8-10 role-specific technical interview questions for ${jobRole}>]
}

Return ONLY valid JSON. Do not include markdown, explanations, or extra text.`;
}
