"use client";

import { useState } from "react";
import type {
    ResumeSkill,
    ResumeSkillKeyword,
    ResumeWork,
    ResumeProject,
} from "@/types/resume";
import { SkillBadge, getSimpleIcon } from "@/components/resume/SkillBadge";
import { matchesJobField } from "@/lib/job-field";

type FlatSkill = ResumeSkillKeyword & { categoryName?: string };

function flattenKeywords(skills: ResumeSkill[]): FlatSkill[] {
    return skills.flatMap((cat) =>
        (cat.keywords ?? []).map((kw) => ({ ...kw, categoryName: cat.name }))
    );
}

// work composite key: "Position @ Company" 또는 "Company"
function workKey(w: ResumeWork): string {
    if (!w.name) return "";
    return w.position ? `${w.position} @ ${w.name}` : w.name;
}

// 하위 호환: workRef(단일) 또는 workRefs(배열) 읽기
function getWorkRefs(kw: ResumeSkillKeyword): string[] {
    if (kw.workRefs && kw.workRefs.length > 0) return kw.workRefs;
    if (kw.workRef) return [kw.workRef];
    return [];
}

// 하위 호환: projectRef(단일) 또는 projectRefs(배열) 읽기
function getProjectRefs(kw: ResumeSkillKeyword): string[] {
    if (kw.projectRefs && kw.projectRefs.length > 0) return kw.projectRefs;
    if (kw.projectRef) return [kw.projectRef];
    return [];
}

function groupByExperience(
    keywords: FlatSkill[],
    activeJobField: string,
    works: ResumeWork[],
    projects: ResumeProject[]
): { key: string; label: string; isActive: boolean; skills: FlatSkill[] }[] {
    const activeWorkKeys = new Set(
        works
            .filter((w) => matchesJobField(w.jobField, activeJobField))
            .map(workKey)
            .filter(Boolean)
    );
    const activeProjectNames = new Set(
        projects
            .filter((p) => matchesJobField(p.jobField, activeJobField))
            .map((p) => p.name ?? "")
    );
    const groups = new Map<string, FlatSkill[]>();
    for (const kw of keywords) {
        // 경력별 뷰: workRefs만 사용 (projectRefs는 프로젝트별 뷰에서 처리)
        const refs = getWorkRefs(kw);
        if (refs.length === 0) {
            if (!groups.has("__other__")) groups.set("__other__", []);
            groups.get("__other__")!.push(kw);
        } else {
            for (const ref of refs) {
                if (!groups.has(ref)) groups.set(ref, []);
                groups.get(ref)!.push(kw);
            }
        }
    }
    return [...groups.entries()]
        .map(([key, skills]) => ({
            key,
            label: key === "__other__" ? "기타" : key,
            isActive: activeWorkKeys.has(key) || activeProjectNames.has(key),
            skills,
        }))
        .sort((a, b) => Number(b.isActive) - Number(a.isActive));
}

function groupByJobField(
    keywords: FlatSkill[],
    activeJobField: string
): {
    key: string;
    label: string;
    isActive: boolean;
    categories: { name: string; skills: FlatSkill[] }[];
}[] {
    const toArray = (f: string | string[] | undefined): string[] =>
        Array.isArray(f) ? f : f ? [f] : [];

    // jobField → categoryName → skills
    const jfMap = new Map<string, Map<string, FlatSkill[]>>();
    const add = (jf: string, kw: FlatSkill) => {
        if (!jfMap.has(jf)) jfMap.set(jf, new Map());
        const catMap = jfMap.get(jf)!;
        const cat = kw.categoryName ?? "기타";
        if (!catMap.has(cat)) catMap.set(cat, []);
        catMap.get(cat)!.push(kw);
    };

    for (const kw of keywords) {
        const fields = toArray(kw.jobField);
        if (fields.length === 0) {
            add("__other__", kw);
        } else {
            for (const jf of fields) add(jf, kw);
        }
    }

    return [...jfMap.entries()]
        .map(([key, catMap]) => ({
            key,
            label:
                key === "__other__"
                    ? "기타"
                    : key.charAt(0).toUpperCase() + key.slice(1),
            isActive: key === activeJobField,
            categories: [...catMap.entries()].map(([name, skills]) => ({
                name,
                skills,
            })),
        }))
        .sort((a, b) => Number(b.isActive) - Number(a.isActive));
}

// 프로젝트 섹션 순서대로 스킬 그룹화
function groupByProject(
    keywords: FlatSkill[],
    projects: ResumeProject[]
): { key: string; label: string; skills: FlatSkill[] }[] {
    const projectOrder = projects.map((p) => p.name ?? "").filter(Boolean);
    const groups = new Map<string, FlatSkill[]>();
    for (const kw of keywords) {
        const refs = getProjectRefs(kw);
        if (refs.length === 0) {
            if (!groups.has("__other__")) groups.set("__other__", []);
            groups.get("__other__")!.push(kw);
        } else {
            for (const ref of refs) {
                if (!groups.has(ref)) groups.set(ref, []);
                groups.get(ref)!.push(kw);
            }
        }
    }
    const result: { key: string; label: string; skills: FlatSkill[] }[] = [];
    for (const name of projectOrder) {
        if (groups.has(name)) {
            result.push({ key: name, label: name, skills: groups.get(name)! });
        }
    }
    // 프로젝트 목록에 없는 ref
    for (const [key, skills] of groups) {
        if (!projectOrder.includes(key) && key !== "__other__") {
            result.push({ key, label: key, skills });
        }
    }
    if (groups.has("__other__")) {
        result.push({
            key: "__other__",
            label: "기타",
            skills: groups.get("__other__")!,
        });
    }
    return result;
}

type SkillsView =
    | "by-job-field"
    | "by-experience"
    | "by-category"
    | "by-project";

interface Props {
    skills: ResumeSkill[];
    activeJobField?: string;
    works: ResumeWork[];
    projects: ResumeProject[];
    label?: string;
    defaultView?: SkillsView;
}

export default function SkillsSection({
    skills,
    activeJobField,
    works,
    projects,
    label = "기술",
    defaultView,
}: Props) {
    const [skillsView, setSkillsView] = useState<SkillsView>(
        defaultView ?? "by-category"
    );

    return (
        <section className="mb-10" data-pdf-block>
            <div className="mb-5 flex items-center justify-between border-b border-(--color-border) pb-1.5">
                <h2 className="text-xl font-bold tracking-widest text-(--color-accent) uppercase">
                    {label}
                </h2>
                <select
                    value={skillsView}
                    onChange={(e) =>
                        setSkillsView(e.target.value as SkillsView)
                    }
                    className="rounded-md border border-(--color-border) bg-(--color-surface-subtle) px-2 py-1 text-xs text-(--color-muted) focus:outline-none"
                >
                    <option value="by-job-field">직무 분야별</option>
                    <option value="by-experience">경력별</option>
                    <option value="by-category">카테고리별</option>
                    <option value="by-project">프로젝트별</option>
                </select>
            </div>
            {skillsView === "by-job-field" ? (
                (() => {
                    const flat = flattenKeywords(skills);
                    const groups = groupByJobField(flat, activeJobField ?? "");
                    return (
                        <div className="space-y-6">
                            {groups.map((group) => (
                                <div key={group.key}>
                                    <p
                                        className={`mb-3 text-sm font-bold ${
                                            group.isActive
                                                ? "text-(--color-accent)"
                                                : "text-(--color-foreground)"
                                        }`}
                                    >
                                        {group.label}
                                    </p>
                                    <div className="tablet:grid-cols-2 laptop:grid-cols-3 desktop:grid-cols-4 grid grid-cols-1 gap-3">
                                        {group.categories.map((cat) => (
                                            <div
                                                key={cat.name}
                                                className="rounded-lg border border-(--color-border) bg-(--color-surface-subtle) px-4 py-3"
                                            >
                                                <div className="mb-2 text-sm font-bold text-(--color-foreground)">
                                                    {cat.name}
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {cat.skills.map((kw, i) => (
                                                        <div
                                                            key={i}
                                                            className="flex flex-col items-center gap-0.5"
                                                        >
                                                            <SkillBadge
                                                                name={kw.name}
                                                                overrideSlug={
                                                                    kw.iconSlug
                                                                }
                                                                overrideColor={
                                                                    kw.iconColor
                                                                }
                                                            />
                                                            {kw.level && (
                                                                <span className="text-xs font-semibold text-(--color-muted)">
                                                                    {kw.level}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })()
            ) : skillsView === "by-experience" ? (
                (() => {
                    const flat = flattenKeywords(skills);
                    const groups = groupByExperience(
                        flat,
                        activeJobField ?? "",
                        works,
                        projects
                    );
                    return (
                        <div className="tablet:grid-cols-2 laptop:grid-cols-3 desktop:grid-cols-4 grid grid-cols-1 gap-3">
                            {groups.map((group) => (
                                <div
                                    key={group.key}
                                    className="rounded-lg border border-(--color-border) bg-(--color-surface-subtle) px-4 py-3"
                                >
                                    <div
                                        className={`mb-2 text-sm font-bold ${
                                            group.isActive
                                                ? "text-(--color-accent)"
                                                : "text-(--color-foreground)"
                                        }`}
                                    >
                                        {group.label}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {group.skills.map((kw, i) => (
                                            <div
                                                key={i}
                                                className="flex flex-col items-center gap-0.5"
                                            >
                                                <SkillBadge
                                                    name={kw.name}
                                                    overrideSlug={kw.iconSlug}
                                                    overrideColor={kw.iconColor}
                                                />
                                                {kw.level && (
                                                    <span className="text-xs font-semibold text-(--color-muted)">
                                                        {kw.level}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })()
            ) : skillsView === "by-project" ? (
                (() => {
                    const flat = flattenKeywords(skills);
                    const groups = groupByProject(flat, projects);
                    return (
                        <div className="tablet:grid-cols-2 laptop:grid-cols-3 desktop:grid-cols-4 grid grid-cols-1 gap-3">
                            {groups.map((group) => (
                                <div
                                    key={group.key}
                                    className="rounded-lg border border-(--color-border) bg-(--color-surface-subtle) px-4 py-3"
                                >
                                    <div className="mb-2 text-sm font-bold text-(--color-foreground)">
                                        {group.label}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {group.skills.map((kw, i) => (
                                            <div
                                                key={i}
                                                className="flex flex-col items-center gap-0.5"
                                            >
                                                <SkillBadge
                                                    name={kw.name}
                                                    overrideSlug={kw.iconSlug}
                                                    overrideColor={kw.iconColor}
                                                />
                                                {kw.level && (
                                                    <span className="text-xs font-semibold text-(--color-muted)">
                                                        {kw.level}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })()
            ) : (
                <div className="tablet:grid-cols-2 laptop:grid-cols-3 desktop:grid-cols-4 grid grid-cols-1 gap-3">
                    {skills.map((skill, idx) => {
                        const icon = skill.iconSlug
                            ? getSimpleIcon(skill.iconSlug)
                            : null;
                        return (
                            <div
                                key={idx}
                                className="rounded-lg border border-(--color-border) bg-(--color-surface-subtle) px-4 py-3"
                            >
                                {skill.name ? (
                                    <div className="mb-2 flex items-center gap-2 text-sm font-bold text-(--color-foreground)">
                                        {icon ? (
                                            <svg
                                                role="img"
                                                viewBox="0 0 24 24"
                                                className="h-4 w-4"
                                                style={{
                                                    fill:
                                                        skill.iconColor ||
                                                        `#${icon.hex}`,
                                                }}
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <title>{icon.title}</title>
                                                <path d={icon.path} />
                                            </svg>
                                        ) : null}
                                        {skill.name}
                                    </div>
                                ) : null}
                                <div className="flex flex-wrap gap-2">
                                    {(skill.keywords ?? []).map((kw, kIdx) => (
                                        <div
                                            key={kIdx}
                                            className="flex flex-col items-center gap-0.5"
                                        >
                                            <SkillBadge
                                                name={kw.name}
                                                overrideSlug={kw.iconSlug}
                                                overrideColor={kw.iconColor}
                                            />
                                            {kw.level && (
                                                <span className="text-xs font-semibold text-(--color-muted)">
                                                    {kw.level}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
