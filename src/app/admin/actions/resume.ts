"use server";

import { requireAdminSession } from "@/lib/server-admin";
import {
    revalidateHome,
    revalidateResume,
} from "@/app/admin/actions/revalidate";
import { serverClient } from "@/lib/supabase";
import type { Resume } from "@/types/resume";
import type { ResumeSectionLayout } from "@/lib/resume-layout";

type SaveResumeInput = {
    resumeData: Resume;
    rowId: string | null;
    resumeLayout: "classic" | "modern";
    resumeSectionLayout: ResumeSectionLayout;
};

type SaveResumeResult =
    | { success: true; rowId: string | null }
    | { success: false; error: string };

// resume_data + layout 설정 저장
export async function saveResumePanel(
    input: SaveResumeInput
): Promise<SaveResumeResult> {
    await requireAdminSession();
    if (!serverClient) return { success: false, error: "serverClient 없음" };

    const { resumeData, rowId, resumeLayout, resumeSectionLayout } = input;

    try {
        let nextRowId = rowId;
        if (rowId) {
            const { error } = await serverClient
                .from("resume_data")
                .update({ data: resumeData })
                .eq("id", rowId);
            if (error) return { success: false, error: error.message };
        } else {
            const { data, error } = await serverClient
                .from("resume_data")
                .insert({ lang: "ko", data: resumeData })
                .select("id")
                .single();
            if (error) return { success: false, error: error.message };
            nextRowId = data?.id ?? null;
        }

        const { error: layoutError } = await serverClient
            .from("site_config")
            .upsert({ key: "resume_layout", value: resumeLayout });
        if (layoutError) return { success: false, error: layoutError.message };

        const { error: sectionLayoutError } = await serverClient
            .from("site_config")
            .upsert({
                key: "resume_section_layout",
                value: resumeSectionLayout as unknown as object,
            });
        if (sectionLayoutError) {
            return { success: false, error: sectionLayoutError.message };
        }

        await revalidateResume();
        await revalidateHome();

        return { success: true, rowId: nextRowId };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "저장 실패",
        };
    }
}

// resume layout 단독 저장
export async function saveResumeTheme(
    layout: "classic" | "modern"
): Promise<{ success: true } | { success: false; error: string }> {
    await requireAdminSession();
    if (!serverClient) return { success: false, error: "serverClient 없음" };

    const { error } = await serverClient
        .from("site_config")
        .upsert({ key: "resume_layout", value: layout });
    if (error) return { success: false, error: error.message };

    await revalidateResume();
    return { success: true };
}
