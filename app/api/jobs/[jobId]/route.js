import { NextResponse } from "next/server";
import { getCurrentEmail } from "@/lib/requireAuth";
import { getJob } from "@/lib/db";

export async function GET(request, { params }) {
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

    return NextResponse.json({ job });
  } catch {
    return NextResponse.json({ error: "Something went wrong loading the job." }, { status: 500 });
  }
}
