import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { anthropic, MODEL, buildAnalysisPrompt } from "@/lib/anthropic";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resumeId, jobRole, jobDescription } = body;

    if (!resumeId || !jobRole) {
      return Response.json(
        { error: "resumeId and jobRole are required" },
        { status: 400 }
      );
    }

    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume) {
      return Response.json({ error: "Resume not found" }, { status: 404 });
    }

    const prompt = buildAnalysisPrompt(resume.rawText, jobRole, jobDescription || undefined);

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const rawContent = message.content[0];
    if (rawContent.type !== "text") {
      return Response.json({ error: "Unexpected response from AI" }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let aiOutput: any;
    try {
      const text = rawContent.text.trim();
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}");
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error("No JSON found in response");
      }
      aiOutput = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    } catch {
      return Response.json(
        { error: "AI returned invalid JSON response" },
        { status: 500 }
      );
    }

    const session = await prisma.analysisSession.create({
      data: {
        resumeId: resume.id,
        jobRole,
        jobDescription: jobDescription?.trim() || null,
        aiOutput,
      },
    });

    return Response.json({ sessionId: session.id });
  } catch (error) {
    console.error("Analyze error:", error);
    return Response.json({ error: "Analysis failed" }, { status: 500 });
  }
}
