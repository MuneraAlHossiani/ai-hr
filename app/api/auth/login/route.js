import { NextResponse } from "next/server";
import { getProfileByEmail } from "@/lib/profiles";
import { verifyPassword, createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

const GENERIC_ERROR = "Invalid email or password.";

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const profile = getProfileByEmail(normalizedEmail);

    if (!profile) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    const valid = await verifyPassword(password, profile.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    const token = createSessionToken(normalizedEmail);
    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "Something went wrong logging in. Please try again." },
      { status: 500 }
    );
  }
}
