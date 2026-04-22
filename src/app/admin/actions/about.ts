"use server";

import { requireAdminSession } from "@/lib/server-admin";
import {
    revalidateHome,
    revalidateResume,
} from "@/app/admin/actions/revalidate";
import { serverClient } from "@/lib/supabase";
import type { AboutData } from "@/types/about";

type SaveAboutInput = {
    aboutData: AboutData;
    aboutRowId: string | null;
    profileImage: string;
    resumeRowId: string | null;
    resumeFullData: Record<string, unknown> | null;
    githubUrl: string;
};

type SaveAboutResult =
    | { success: true; aboutRowId: string | null }
    | { success: false; error: string };

// About / resume basics.image / github_url 저장
export async function saveAboutPanel(
    input: SaveAboutInput
): Promise<SaveAboutResult> {
    await requireAdminSession();
    if (!serverClient) return { success: false, error: "serverClient 없음" };

    const {
        aboutData,
        aboutRowId,
        profileImage,
        resumeRowId,
        resumeFullData,
        githubUrl,
    } = input;

    try {
        if (resumeRowId && resumeFullData) {
            const basics =
                resumeFullData.basics &&
                typeof resumeFullData.basics === "object" &&
                !Array.isArray(resumeFullData.basics)
                    ? (resumeFullData.basics as Record<string, unknown>)
                    : {};

            const mergedResume = {
                ...resumeFullData,
                basics: {
                    ...basics,
                    image: profileImage.trim() || undefined,
                },
            };

            const { error } = await serverClient
                .from("resume_data")
                .update({ data: mergedResume })
                .eq("id", resumeRowId);
            if (error) return { success: false, error: error.message };
        }

        let nextAboutRowId = aboutRowId;
        if (aboutRowId) {
            const { error } = await serverClient
                .from("about_data")
                .update({ data: aboutData })
                .eq("id", aboutRowId);
            if (error) return { success: false, error: error.message };
        } else {
            const { data, error } = await serverClient
                .from("about_data")
                .insert({ data: aboutData })
                .select("id")
                .single();
            if (error) return { success: false, error: error.message };
            nextAboutRowId = data?.id ?? null;
        }

        const { error: githubError } = await serverClient
            .from("site_config")
            .upsert(
                [
                    {
                        key: "github_url",
                        value: JSON.stringify(githubUrl.trim()),
                    },
                ],
                { onConflict: "key" }
            );
        if (githubError) {
            return { success: false, error: githubError.message };
        }

        await revalidateHome();
        await revalidateResume();

        return { success: true, aboutRowId: nextAboutRowId };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "저장 실패",
        };
    }
}
