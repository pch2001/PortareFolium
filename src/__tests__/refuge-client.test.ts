import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalCwd = process.cwd();
let tempDir = "";

async function seedRefuge(rows: Record<string, unknown>[]) {
    const paths = await import("@/lib/refuge/paths");
    const store = await import("@/lib/refuge/store");
    const database = store.getRefugeDatabase();
    store.replaceRefugeTableRows(database, "posts", rows);
    store.replaceRefugeTableRows(database, "tags", []);
    fs.writeFileSync(paths.REFUGE_JOURNAL_PATH, "", "utf8");
    fs.writeFileSync(
        paths.REFUGE_MODE_PATH,
        JSON.stringify(
            {
                mode: "sqlite-refuge",
                activatedAt: new Date().toISOString(),
                dbPath: paths.REFUGE_DB_PATH,
                manifestPath: paths.REFUGE_MANIFEST_PATH,
                journalPath: paths.REFUGE_JOURNAL_PATH,
            },
            null,
            2
        ),
        "utf8"
    );
}

describe("sqlite refuge server client", () => {
    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "portare-refuge-"));
        process.chdir(tempDir);
        vi.resetModules();
    });

    afterEach(async () => {
        const store = await import("@/lib/refuge/store");
        store.closeRefugeDatabase();
        process.chdir(originalCwd);
        fs.rmSync(tempDir, { recursive: true, force: true });
        vi.resetModules();
    });

    it("reads filtered rows from local sqlite when refuge mode is active", async () => {
        await seedRefuge([
            { id: "1", slug: "draft", title: "Draft", published: false },
            { id: "2", slug: "live", title: "Live", published: true },
        ]);

        const { serverClient } = await import("@/lib/supabase");
        const { data, error } = await serverClient!
            .from("posts")
            .select("slug, title")
            .eq("published", true)
            .single();

        expect(error).toBeNull();
        expect(data).toEqual({ slug: "live", title: "Live" });
    });

    it("allows release-1 site_config keys", async () => {
        await seedRefuge([]);

        const { serverClient } = await import("@/lib/supabase");
        const configResult = await serverClient!
            .from("site_config")
            .upsert(
                [
                    { key: "color_scheme", value: "riot" },
                    { key: "site_name", value: "Portfolio" },
                    { key: "seo_config", value: { default_description: "ok" } },
                ],
                { onConflict: "key" }
            )
            .select("key, value");

        expect(configResult.error).toBeNull();
        expect(configResult.data).toHaveLength(3);
    });

    it("rejects excluded tables and forbidden site_config keys", async () => {
        await seedRefuge([]);

        const { serverClient } = await import("@/lib/supabase");
        const tokenResult = await serverClient!
            .from("ai_agent_tokens")
            .select("id");
        expect(tokenResult.error?.message).toContain("not available");

        const configResult = await serverClient!.from("site_config").upsert(
            [
                { key: "color_scheme", value: "riot" },
                { key: "plain_mode", value: false },
            ],
            { onConflict: "key" }
        );
        expect(configResult.error?.message).toContain("plain_mode");
    });

    it("rejects tag mutations and post category mass updates in refuge mode", async () => {
        await seedRefuge([
            { id: "1", slug: "one", title: "One", category: "Old" },
            { id: "2", slug: "two", title: "Two", category: "Old" },
        ]);

        const { serverClient } = await import("@/lib/supabase");
        const tagResult = await serverClient!
            .from("tags")
            .insert({ slug: "new", name: "New" });
        expect(tagResult.error?.message).toContain("tags changes");

        const categoryResult = await serverClient!
            .from("posts")
            .update({ category: "New" })
            .eq("category", "Old");
        expect(categoryResult.error?.message).toContain("mass updates");
    });

    it("rejects unsupported content deletes in refuge mode", async () => {
        await seedRefuge([
            { id: "1", slug: "live", title: "Live", published: true },
        ]);

        const { serverClient } = await import("@/lib/supabase");
        const result = await serverClient!
            .from("posts")
            .delete()
            .eq("slug", "live");

        expect(result.error?.message).toContain("delete");
    });

    it("writes local projection updates and records the journal", async () => {
        await seedRefuge([
            { id: "1", slug: "live", title: "Live", published: true },
        ]);

        const { serverClient } = await import("@/lib/supabase");
        const paths = await import("@/lib/refuge/paths");
        const update = await serverClient!
            .from("posts")
            .update({ title: "Updated" })
            .eq("slug", "live")
            .select("slug, title")
            .single();

        expect(update.error).toBeNull();
        expect(update.data).toEqual({ slug: "live", title: "Updated" });

        const journal = fs
            .readFileSync(paths.REFUGE_JOURNAL_PATH, "utf8")
            .trim()
            .split("\n")
            .map(
                (line) =>
                    JSON.parse(line) as { operation: string; table: string }
            );
        expect(journal).toMatchObject([
            { operation: "update", table: "posts" },
        ]);
    });
});
