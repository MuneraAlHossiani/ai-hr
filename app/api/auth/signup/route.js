import { NextResponse } from "next/server";
import { getProfileByEmail, createProfile } from "@/lib/profiles";
import { createUserData } from "@/lib/db";
import { hashPassword, createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const { email, password, name, dob } = body || {};

    if (!email || !password || !name || !dob) {
      return NextResponse.json(
        { error: "Email, password, name, and date of birth are all required." },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (await getProfileByEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    await createProfile(normalizedEmail, passwordHash);
    await createUserData(normalizedEmail, name, dob);

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
      { error: "Something went wrong creating your account. Please try again." },
      { status: 500 }
    );
  }
}
