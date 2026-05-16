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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLogin = pathname === "/login";

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  });

  if (!token && !isLogin) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (token && isLogin) {
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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
