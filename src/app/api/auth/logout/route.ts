import { NextResponse } from "next/server";
import { sessionCookie } from "@/lib/backend";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  response.headers.set("Cache-Control", "private, no-store");
  response.cookies.delete(sessionCookie);
  return response;
}
