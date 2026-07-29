import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SESSION_COOKIE_NAME = "session";

export function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function createSessionToken(email) {
  return jwt.sign({ email }, process.env.AUTH_SECRET, { expiresIn: "7d" });
}

export function verifySessionToken(token) {
  try {
    const payload = jwt.verify(token, process.env.AUTH_SECRET);
    return payload.email || null;
  } catch {
    return null;
  }
}

// Accepts either a raw "Cookie" header string, or an object with a get(name)
// method (like Next.js's cookies() store), and returns the verified email
// or null if there is no valid session.
export function getSessionEmailFromCookies(cookieHeaderOrCookiesObject) {
  let token = null;

  if (!cookieHeaderOrCookiesObject) {
    return null;
  }

  if (typeof cookieHeaderOrCookiesObject.get === "function") {
    token = cookieHeaderOrCookiesObject.get(SESSION_COOKIE_NAME)?.value || null;
  } else if (typeof cookieHeaderOrCookiesObject === "string") {
    const match = cookieHeaderOrCookiesObject
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`));
    token = match ? decodeURIComponent(match.split("=")[1]) : null;
  }

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export { SESSION_COOKIE_NAME };
