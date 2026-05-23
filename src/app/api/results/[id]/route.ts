import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await prisma.analysisSession.findUnique({
      where: { id },
      include: { resume: true },
    });

    if (!session) {
      return Response.json({ error: "Analysis session not found" }, { status: 404 });
    }

    return Response.json({
      sessionId: session.id,
      jobRole: session.jobRole,
      createdAt: session.createdAt,
      resume: {
        id: session.resume.id,
        filename: session.resume.filename,
      },
      analysis: session.aiOutput,
    });
  } catch (error) {
    console.error("Results error:", error);
    return Response.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}
