import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

function request(path: string): NextRequest {
    return new NextRequest(`http://127.0.0.1:3100${path}`, {
        headers: { host: "127.0.0.1:3100" },
    });
}

describe("proxy local sqlite refuge auth", () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("local refuge start opt-in still redirects to login without a session cookie", () => {
        vi.stubEnv("SQLITE_REFUGE_ALLOW_LOCAL_START", "local-dev-only");
        vi.stubEnv("NODE_ENV", "production");
        vi.stubEnv("VERCEL", "");
        vi.stubEnv("VERCEL_ENV", "");

        const response = proxy(request("/admin"));

        expect(response.headers.get("location")).toContain("/admin/login");
    });

    it("keeps refuge API routes closed without a real auth session cookie", () => {
        vi.stubEnv("SQLITE_REFUGE_ALLOW_LOCAL_START", "local-dev-only");

        const response = proxy(request("/api/upload-image"));

        expect(response.status).toBe(401);
    });
});
