// editor_states snapshot 조회 + snapshot 삭제 후 true-orphan cleanup helper
import { browserClient } from "@/lib/supabase";
import { cleanupTrueOrphans, type CleanupArgs } from "@/lib/orphan-cleanup";

// 해당 entity의 모든 snapshot content 로드 (Initial + Auto-save + Bookmark)
export async function loadSnapshotsContent(
    entityType: string,
    entitySlug: string
): Promise<string[]> {
    if (!browserClient) return [];
    try {
        const { data } = await browserClient
            .from("editor_states")
            .select("content")
            .eq("entity_type", entityType)
            .eq("entity_slug", entitySlug);
        return (data ?? [])
            .map((r) => r.content as string | null)
            .filter((c): c is string => typeof c === "string" && c.length > 0);
    } catch {
        return [];
    }
}

// snapshot 삭제 직후 호출 — true-orphan cleanup을 background에 fire-and-forget
export function triggerSnapshotCleanup(args: CleanupArgs): void {
    cleanupTrueOrphans(args).catch((e) => {
        console.error(
            `[snapshot-cleanup::triggerSnapshotCleanup] cleanup 실패`,
            e
        );
    });
}
