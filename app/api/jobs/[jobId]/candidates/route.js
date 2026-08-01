import { NextResponse } from "next/server";
import { getCurrentEmail } from "@/lib/requireAuth";
import { getJob, addCandidate } from "@/lib/db";
import { extractTextFromFile, guessNameFromText } from "@/lib/extractText";
import { analyzeCandidate } from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(request, { params }) {
  try {
    const email = await getCurrentEmail();
    if (!email) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { jobId } = await params;
    const job = await getJob(email, jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    let formData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "Invalid upload data." }, { status: 400 });
    }

    const files = formData
      .getAll("files")
      .filter((f) => typeof f === "object" && "arrayBuffer" in f);
    if (files.length === 0) {
      return NextResponse.json({ error: "No files were uploaded." }, { status: 400 });
    }

    const candidates = [];
    const errors = [];

    for (const file of files) {
      const fileName = file.name || "candidate";
      const lower = fileName.toLowerCase();

      if (!lower.endsWith(".pdf") && !lower.endsWith(".docx")) {
        errors.push({ fileName, error: "Only .pdf and .docx files are supported." });
        continue;
      }

      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const cvText = await extractTextFromFile(buffer, fileName);
        if (!cvText) {
          errors.push({ fileName, error: "Could not extract any text from this file." });
          continue;
        }

        const analysis = await analyzeCandidate(job.description, cvText);
        const name = guessNameFromText(cvText, fileName);

        const candidate = await addCandidate(email, jobId, {
          name,
          fileName,
          cvText,
          ...analysis,
        });

        candidates.push(candidate);
      } catch (err) {
        errors.push({ fileName, error: err.message || "Failed to process this file." });
      }
    }

    return NextResponse.json({ candidates, errors });
  } catch (err) {
    console.error("Processing candidate upload failed:", err);
    return NextResponse.json(
      { error: "Something went wrong processing the upload." },
      { status: 500 }
    );
  }
}
