import Link from "next/link";
import { requireAuth } from "@/lib/requireAuth";
import { getUserData } from "@/lib/db";
import styles from "./dashboard.module.css";

export default async function Dashboard() {
  const email = await requireAuth();
  const userData = await getUserData(email);
  const jobs = userData ? Object.values(userData.jobs) : [];
  jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.heading}>Job Postings</h1>
        <Link href="/jobs/new" className="btn-primary">
          + New Job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className={`card ${styles.empty}`}>
          <div className={styles.emptyTitle}>No job postings yet</div>
          <p>Create your first job posting to start uploading and screening candidates.</p>
          <Link href="/jobs/new" className="btn-primary">
            + New Job
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {jobs.map((job) => {
            const candidateCount = Object.keys(job.candidates || {}).length;
            return (
              <Link key={job.id} href={`/jobs/${job.id}`} className={`card ${styles.jobCard}`}>
                <div className={styles.jobTitle}>{job.title}</div>
                <div className={styles.jobExcerpt}>{job.description}</div>
                <div className={styles.jobMeta}>
                  <span>
                    {candidateCount} candidate{candidateCount === 1 ? "" : "s"}
                  </span>
                  <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
