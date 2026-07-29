"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./new-job.module.css";

export default function NewJobPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      router.push(`/jobs/${data.job.id}`);
    } catch {
      setError("Could not reach the server. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={`card ${styles.card}`}>
        <h1 className={styles.title}>New Job Posting</h1>

        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="title">
              Job Title
            </label>
            <input
              id="title"
              type="text"
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Frontend Developer"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="description">
              Job Description
            </label>
            <textarea
              id="description"
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="Paste or write the full job description here..."
            />
          </div>

          <div className={styles.actions}>
            <button
              type="submit"
              className={`btn-primary ${styles.submit}`}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Job"}
            </button>
            <Link href="/" className={styles.backLink}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
