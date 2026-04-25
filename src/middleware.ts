import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// NextAuth v5 기본 session cookie name (dev / production)
const SESSION_COOKIE_NAMES = [
    "authjs.session-token",
    "__Secure-authjs.session-token",
];

// admin server action / API route는 각자 requireAdminSession()으로 검증.
// 이 middleware는 unauthenticated 요청을 빠르게 차단하는 defense-in-depth layer.
export function middleware(req: NextRequest) {
    const hasSessionCookie = SESSION_COOKIE_NAMES.some((name) =>
        req.cookies.get(name)
    );
    if (hasSessionCookie) return NextResponse.next();

    const path = req.nextUrl.pathname;
    if (path.startsWith("/admin")) {
        const url = new URL("/admin/login", req.url);
        url.searchParams.set("returnUrl", path);
        return NextResponse.redirect(url);
    }
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
}

export const config = {
    matcher: [
        "/admin",
        "/admin/((?!login).*)",
        "/api/upload-image/:path*",
        "/api/storage-ops/:path*",
        "/api/run-migrations/:path*",
    ],
};
