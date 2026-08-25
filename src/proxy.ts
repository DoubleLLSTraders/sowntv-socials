import { NextRequest, NextResponse } from "next/server";
import { clientIp, originAllowed, rateLimit } from "@/lib/limit";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

const PUBLIC = new Set(["/", "/login", "/register", "/terms"]);
const AUTH_PAGES = new Set(["/login", "/register"]);
const SKIP_ORIGIN = ["/api/payhero/callback", "/api/v2"];

function tooMany() {
  return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
}

function limitFor(pathname: string) {
  if (pathname === "/api/auth/login" || pathname === "/api/auth/register" || pathname === "/api/auth/session") {
    return { max: 8, windowMs: 10 * 60 * 1000 };
  }
  if (pathname.startsWith("/api/v2")) return { max: 60, windowMs: 60 * 1000 };
  if (pathname.startsWith("/api/payhero/callback")) return { max: 120, windowMs: 60 * 1000 };
  if (pathname.startsWith("/api")) return { max: 180, windowMs: 60 * 1000 };
  return null;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = clientIp(req);
  const limit = limitFor(pathname);
  if (limit && !rateLimit(`${ip}:${pathname.split("/").slice(0, 4).join("/")}`, limit.max, limit.windowMs)) {
    return tooMany();
  }

  const mutating = !["GET", "HEAD", "OPTIONS"].includes(req.method);
  const skipOrigin = SKIP_ORIGIN.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (mutating && pathname.startsWith("/api") && !skipOrigin && !originAllowed(req, req.url)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "private, no-store, max-age=0");
    return res;
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const isPublic = PUBLIC.has(pathname) || pathname.startsWith("/pay/");
  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (session && AUTH_PAGES.has(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  if (pathname.startsWith("/admin") && session?.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.svg$|.*\\.png$|.*\\.ico$).*)"],
};
