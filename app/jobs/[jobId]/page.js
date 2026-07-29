import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/requireAuth";
import { getJob } from "@/lib/db";
import JobBoardClient from "./JobBoardClient";
import styles from "./job-board.module.css";

export default async function JobBoardPage({ params }) {
  const email = await requireAuth();
  const { jobId } = await params;
  const job = getJob(email, jobId);

  if (!job) {
    notFound();
  }

  const candidates = Object.values(job.candidates || {});

  return (
    <div>
      <div className={styles.header}>
        <Link href="/" className={styles.backLink}>
          ← Back to dashboard
        </Link>
        <h1 className={styles.title}>{job.title}</h1>
        <p className={styles.description}>{job.description}</p>
      </div>
      <JobBoardClient jobId={jobId} initialCandidates={candidates} />
    </div>
  );
}
