import { NextResponse } from "next/server";
import { getCurrentEmail } from "@/lib/requireAuth";
import { getUserData, createJob } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const email = await getCurrentEmail();
    if (!email) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const userData = await getUserData(email);
    const jobs = userData ? Object.values(userData.jobs) : [];
    return NextResponse.json({ jobs });
  } catch (err) {
    console.error("Loading jobs failed:", err);
    return NextResponse.json({ error: "Something went wrong loading jobs." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const email = await getCurrentEmail();
    if (!email) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const { title, description } = body || {};
    if (!title || !description) {
      return NextResponse.json(
        { error: "Job title and description are both required." },
        { status: 400 }
      );
    }

    const job = await createJob(email, title, description);
    return NextResponse.json({ job }, { status: 201 });
  } catch (err) {
    console.error("Creating job failed:", err);
    return NextResponse.json({ error: "Something went wrong creating the job." }, { status: 500 });
  }
}
