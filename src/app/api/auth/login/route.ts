import { NextResponse } from "next/server";
import { issueSessionToken, verifyPassword, SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  const form = await request.formData();
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/matches/new");

  if (!verifyPassword(password)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "1");
    url.searchParams.set("next", next);
    return NextResponse.redirect(url, { status: 303 });
  }

  const token = issueSessionToken();
  const response = NextResponse.redirect(new URL(next, request.url), {
    status: 303,
  });
  response.cookies.set({
    name: SESSION_COOKIE.name,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_COOKIE.maxAge,
  });
  return response;
}
