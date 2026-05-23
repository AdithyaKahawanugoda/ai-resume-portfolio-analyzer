import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("resume") as File | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const isPdf = fileName.endsWith(".pdf");
    const isDocx = fileName.endsWith(".docx");

    if (!isPdf && !isDocx) {
      return Response.json(
        { error: "Only PDF and DOCX files are supported" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let rawText = "";

    if (isPdf) {
      const pdfParse = (await import("pdf-parse")).default;
      const parsed = await pdfParse(buffer);
      rawText = parsed.text;
    } else {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value;
    }

    if (!rawText.trim()) {
      return Response.json(
        { error: "Could not extract text from the file. The file may be empty or image-based." },
        { status: 422 }
      );
    }

    const resume = await prisma.resume.create({
      data: {
        filename: file.name,
        rawText: rawText.trim(),
      },
    });

    return Response.json({
      resumeId: resume.id,
      filename: resume.filename,
      textLength: rawText.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json({ error: "Failed to process file" }, { status: 500 });
  }
}
