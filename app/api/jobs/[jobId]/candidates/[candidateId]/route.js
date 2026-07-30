import { NextResponse } from "next/server";
import { getCurrentEmail } from "@/lib/requireAuth";
import { getJob, updateCandidateStatus } from "@/lib/db";

const VALID_STATUSES = ["new", "screening", "interview", "offer", "closed", "rejected"];

export async function PATCH(request, { params }) {
  try {
    const email = await getCurrentEmail();
    if (!email) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { jobId, candidateId } = await params;

    const job = await getJob(email, jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }
    if (!job.candidates[candidateId]) {
      return NextResponse.json({ error: "Candidate not found." }, { status: 404 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const { status } = body || {};
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
    }

    await updateCandidateStatus(email, jobId, candidateId, status);
    const updatedJob = await getJob(email, jobId);

    return NextResponse.json({ candidates: updatedJob.candidates });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong updating this candidate." },
      { status: 500 }
    );
  }
}
