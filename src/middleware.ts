import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Most specific prefixes first — first match wins. */
const ROLE_ROUTES: Array<{ prefix: string; roles: string[] }> = [
  { prefix: "/admin/shared-goals", roles: ["ADMIN", "MANAGER"] },
  { prefix: "/employee", roles: ["EMPLOYEE", "MANAGER", "ADMIN"] },
  { prefix: "/manager", roles: ["MANAGER", "ADMIN"] },
  { prefix: "/admin", roles: ["ADMIN"] },
];

const DASHBOARD_BY_ROLE: Record<string, string> = {
  EMPLOYEE: "/employee",
  MANAGER: "/manager",
  ADMIN: "/admin",
};

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || record.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (record.count >= 10) return false;
  record.count++;
  return true;
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/auth/")) {
    const ip = getClientIp(req);
    if (!checkLoginRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many login attempts. Try again in a minute." },
        { status: 429 }
      );
    }
  }

  const isPublic = pathname === "/login" || pathname === "/welcome";

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  });

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/welcome", req.url));
  }

  if (token && pathname === "/login") {
    const role = (token.role as string) ?? "EMPLOYEE";
    return NextResponse.redirect(new URL(DASHBOARD_BY_ROLE[role] ?? "/employee", req.url));
  }

  if (token && pathname === "/welcome") {
    const role = (token.role as string) ?? "EMPLOYEE";
    return NextResponse.redirect(new URL(DASHBOARD_BY_ROLE[role] ?? "/employee", req.url));
  }

  if (token) {
    const role = token.role as string;
    for (const { prefix, roles } of ROLE_ROUTES) {
      if (pathname.startsWith(prefix) && !roles.includes(role)) {
        return NextResponse.redirect(
          new URL(DASHBOARD_BY_ROLE[role] ?? "/employee", req.url)
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
