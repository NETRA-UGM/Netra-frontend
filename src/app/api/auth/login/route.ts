import { NextResponse } from "next/server";
import { backendEndpoint, sessionCookie } from "@/lib/backend";

type LoginResult = {
  access_token: string;
  expires_in: number;
};

export async function POST(request: Request) {
  let payload: { username?: string; password?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Data login tidak valid." },
      { status: 400 },
    );
  }

  if (
    typeof payload?.username !== "string" ||
    !payload.username ||
    typeof payload.password !== "string" ||
    !payload.password
  ) {
    return NextResponse.json(
      { error: "Isi username dan kata sandi." },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(backendEndpoint("auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: payload.username,
        password: payload.password,
      }),
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!upstream.ok) {
      return NextResponse.json(
        {
          error:
            upstream.status === 401
              ? "Username atau kata sandi salah."
              : "Login gagal. Coba lagi.",
        },
        { status: upstream.status === 401 ? 401 : 502 },
      );
    }

    const result = (await upstream.json()) as LoginResult;
    if (
      typeof result.access_token !== "string" ||
      !result.access_token ||
      !Number.isFinite(result.expires_in) ||
      result.expires_in <= 0
    ) {
      throw new Error("Sesi tidak valid.");
    }
    const response = NextResponse.json(
      { ok: true },
      {
        headers: { "Cache-Control": "private, no-store" },
      },
    );
    response.cookies.set(sessionCookie, result.access_token, {
      httpOnly: true,
      secure:
        process.env.COOKIE_SECURE === "true" ||
        (process.env.COOKIE_SECURE !== "false" &&
          process.env.NODE_ENV === "production"),
      sameSite: "strict",
      path: "/",
      maxAge: result.expires_in,
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "Layanan NETRA belum dapat dihubungi." },
      { status: 503 },
    );
  }
}
