import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { backendUrl, sessionCookie } from "@/lib/backend";

export async function POST(request: Request) {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (token) {
    try {
      await fetch(`${backendUrl}/api/v1/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(5_000),
      });
    } catch {
      // Cookie tetap dihapus saat backend sedang tidak tersedia.
    }
  }
  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  response.cookies.delete(sessionCookie);
  return response;
}
