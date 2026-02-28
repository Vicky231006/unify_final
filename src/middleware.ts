import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't need authentication
const PUBLIC_PATHS = ["/", "/login", "/signup"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Always allow public paths and API routes
    if (
        PUBLIC_PATHS.some(p => pathname === p) ||
        pathname.startsWith("/api/") ||
        pathname.startsWith("/_next/") ||
        pathname.includes(".")
    ) {
        return NextResponse.next();
    }

    // Check for demo session cookie (set at login for the 3 role-test accounts)
    const demoSession = request.cookies.get("unify_demo_session");
    if (demoSession?.value === "true") {
        return NextResponse.next();
    }

    // Check for Supabase session cookies (sb-*-auth-token)
    const hasSupabaseSession = [...request.cookies.getAll()].some(
        c => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
    );
    if (hasSupabaseSession) {
        return NextResponse.next();
    }

    // Not authenticated → redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
