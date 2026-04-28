import fs from "node:fs";
import { createHash } from "node:crypto";
import { REFUGE_MODE_PATH } from "@/lib/refuge/paths";
import type { RefugeModeState } from "@/lib/refuge/schema";

type EnvLike = Partial<Record<string, string | undefined>>;

const LOCAL_REFUGE_OPT_IN_VALUE = "local-dev-only";

// SQLite refuge data-plane은 local/dev runtime에서만 활성화한다.
export function isSqliteRefugeRuntimeAllowed(
    env: EnvLike = process.env
): boolean {
    if (env.VERCEL === "1") return false;
    if (env.VERCEL_ENV === "production" || env.VERCEL_ENV === "preview") {
        return false;
    }
    if (env.NODE_ENV !== "production") return true;
    return env.SQLITE_REFUGE_ALLOW_LOCAL_START === LOCAL_REFUGE_OPT_IN_VALUE;
}

export function readRefugeModeState(): RefugeModeState | null {
    try {
        if (!fs.existsSync(REFUGE_MODE_PATH)) return null;
        return JSON.parse(
            fs.readFileSync(REFUGE_MODE_PATH, "utf8")
        ) as RefugeModeState;
    } catch (error) {
        console.error(
            `[refuge-mode::readRefugeModeState] ${(error as Error).message}`
        );
        return null;
    }
}

export function isSqliteRefugeMode(): boolean {
    return (
        isSqliteRefugeRuntimeAllowed() &&
        readRefugeModeState()?.mode === "sqlite-refuge"
    );
}

export function stableJson(value: unknown): string {
    return JSON.stringify(value, (_key, nested) => {
        if (!nested || typeof nested !== "object" || Array.isArray(nested)) {
            return nested;
        }
        return Object.fromEntries(
            Object.entries(nested as Record<string, unknown>).sort(([a], [b]) =>
                a.localeCompare(b)
            )
        );
    });
}

export function sha256(value: string): string {
    return createHash("sha256").update(value).digest("hex");
}
