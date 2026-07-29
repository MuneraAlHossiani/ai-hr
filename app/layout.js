import { Inter } from "next/font/google";
import "./globals.css";
import styles from "./layout.module.css";
import NavBar from "./NavBar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "HR AI Assistant",
  description: "Local HR AI assistant for candidate screening and pipeline management.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <NavBar />
        <main className={styles.main}>{children}</main>
      </body>
    </html>
  );
}
