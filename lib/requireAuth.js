import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionEmailFromCookies } from "./auth";

export async function getCurrentEmail() {
  const cookieStore = await cookies();
  return getSessionEmailFromCookies(cookieStore);
}

// For use in protected Server Component pages. Redirects to /login if no
// valid session is present, otherwise returns the logged-in email.
export async function requireAuth() {
  const email = await getCurrentEmail();
  if (!email) {
    redirect("/login");
  }
  return email;
}
