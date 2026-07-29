"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./layout.module.css";

export default function NavBar() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <nav className={styles.nav}>
      <span className={styles.brand}>HR AI Assistant</span>
      <button className={styles.logoutBtn} onClick={handleLogout} disabled={loggingOut}>
        {loggingOut ? "Logging out..." : "Logout"}
      </button>
    </nav>
  );
}
