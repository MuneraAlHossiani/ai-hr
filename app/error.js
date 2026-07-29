"use client";

export default function GlobalError({ error, reset }) {
  return (
    <div
      className="card"
      style={{ padding: "3rem 2rem", textAlign: "center", maxWidth: 480, margin: "3rem auto" }}
    >
      <h1 style={{ marginBottom: "0.75rem" }}>Something went wrong</h1>
      <p style={{ color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
        {error?.message || "An unexpected error occurred."}
      </p>
      <button type="button" className="btn-primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
