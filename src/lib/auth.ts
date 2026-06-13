import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "mj_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET must be set in .env.local (16+ chars). See README.",
    );
  }
  return secret;
}

function getPassword(): string {
  const pwd = process.env.ADMIN_PASSWORD;
  if (!pwd) {
    throw new Error("ADMIN_PASSWORD must be set in .env.local. See README.");
  }
  return pwd;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyPassword(input: string): boolean {
  const expected = getPassword();
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function issueSessionToken(): string {
  return sign("admin", getSecret());
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  try {
    const expected = issueSessionToken();
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE_NAME)?.value);
}

export const SESSION_COOKIE = {
  name: COOKIE_NAME,
  maxAge: COOKIE_MAX_AGE,
} as const;
