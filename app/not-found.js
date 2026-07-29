import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card" style={{ padding: "3rem 2rem", textAlign: "center", maxWidth: 480, margin: "3rem auto" }}>
      <h1 style={{ marginBottom: "0.75rem" }}>Page not found</h1>
      <p style={{ color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
        The page you&apos;re looking for doesn&apos;t exist or may have been removed.
      </p>
      <Link href="/" className="btn-primary">
        Back to dashboard
      </Link>
    </div>
  );
}
