import { NextResponse } from "next/server";
import { backendUrl, sessionCookie } from "@/lib/backend";

type LoginResult = {
  access_token: string;
  expires_in: number;
};

export async function POST(request: Request) {
  let payload: { email?: string; password?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Data login tidak valid." }, { status: 400 });
  }

  if (!payload.email || !payload.password) {
    return NextResponse.json({ error: "Isi email dan kata sandi." }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${backendUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: payload.email, password: payload.password }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: upstream.status === 401 ? "Email atau kata sandi salah." : "Login gagal. Coba lagi." },
        { status: upstream.status === 401 ? 401 : 502 },
      );
    }

    const result = (await upstream.json()) as LoginResult;
    const response = NextResponse.json({ ok: true });
    response.cookies.set(sessionCookie, result.access_token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true" || (process.env.COOKIE_SECURE !== "false" && process.env.NODE_ENV === "production"),
      sameSite: "strict",
      path: "/",
      maxAge: result.expires_in,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Backend NETRA belum dapat dihubungi." }, { status: 503 });
  }
}
