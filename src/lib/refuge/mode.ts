import fs from "node:fs";
import { createHash } from "node:crypto";
import { REFUGE_MODE_PATH } from "@/lib/refuge/paths";
import type { RefugeModeState } from "@/lib/refuge/schema";

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
    return readRefugeModeState()?.mode === "sqlite-refuge";
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
