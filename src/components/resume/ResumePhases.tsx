import type { Resume } from "@/types/resume";
import { renderMarkdown } from "@/lib/markdown";
import { SkillBadge, getSimpleIcon } from "@/components/resume/SkillBadge";

interface Props {
    resume: Resume;
}

// 날짜 포맷
const formatDateRange = (
    startDate?: string,
    endDate?: string,
    hideDays?: boolean
): string => {
    const fmt = (d?: string) => (d && hideDays ? d.slice(0, 7) : d || "");
    return `${fmt(startDate)} ~ ${fmt(endDate) || "Present"}`;
};

// jobField가 특정 phase에 해당하는지 확인
function matchesPhase(
    jobField: string | string[] | undefined,
    phase: "web" | "game"
): boolean {
    if (!jobField) return phase === "game";
    const fields = Array.isArray(jobField) ? jobField : [jobField];
    return fields.includes(phase);
}

export default async function ResumePhases({ resume }: Props) {
    const basics = resume.basics ?? {};

    // Phase 1: web 경력
    const webWork = (resume.work?.entries ?? []).filter((w) =>
        matchesPhase(w.jobField, "web")
    );

    // Phase 2: game 프로젝트 (kartrushplusinfo 제외, console-game-project-1 최상단)
    const gameProjectsRaw = (resume.projects?.entries ?? [])
        .filter((p) => matchesPhase(p.jobField, "game"))
        .filter((p) => !p.name?.toLowerCase().includes("kartrushplusinfo"));
    const gameProjects = [
        ...gameProjectsRaw.filter((p) =>
            p.name?.toLowerCase().includes("console-game-project-1")
        ),
        ...gameProjectsRaw.filter(
            (p) => !p.name?.toLowerCase().includes("console-game-project-1")
        ),
    ];

    // 기술 스택 분리 (level 필드로 구분)
    const gameSkills = (resume.skills?.entries ?? []).filter(
        (s) => !s.level || s.level === "game"
    );
    const webSkills = (resume.skills?.entries ?? []).filter(
        (s) => s.level === "web"
    );

    const education = resume.education?.entries ?? [];
    const awards = resume.awards?.entries ?? [];
    const certificates = resume.certificates?.entries ?? [];
    const languages = resume.languages?.entries ?? [];

    // work markdown 렌더링
    const workMarkdown = await Promise.all(
        webWork.map(async (w) => {
            if (!w.markdown) return { summary: null, highlights: null };
            return {
                summary: w.summary ? await renderMarkdown(w.summary) : null,
                highlights: w.highlights
                    ? await Promise.all(
                          w.highlights.map((h) => renderMarkdown(h))
                      )
                    : null,
            };
        })
    );

    // project sections markdown 렌더링
    const projectSectionsMarkdown = await Promise.all(
        gameProjects.map(async (proj) => {
            if (!proj.sections) return [] as (string | null)[];
            return Promise.all(
                proj.sections.map((sec) =>
                    sec.markdown ? renderMarkdown(sec.content) : null
                )
            );
        })
    );

    const hasWebWork = webWork.length > 0;
    const hasGameProjects = gameProjects.length > 0;
    const hasSkills = gameSkills.length > 0 || webSkills.length > 0;
    const hasEducation = education.length > 0;
    const hasLanguages = languages.length > 0;
    const hasAwards = awards.length > 0;
    const hasCertificates = certificates.length > 0;

    return (
        <div className="mx-auto max-w-[1350px] text-[0.9375rem] leading-[1.6] text-(--color-foreground)">
            {/* Header */}
            <header className="mb-10 border-b-2 border-(--color-border) pb-8">
                {basics.image && basics.image.trim() ? (
                    <div className="mb-4 flex justify-center">
                        <img
                            src={
                                basics.image.startsWith("http") ||
                                basics.image.startsWith("/")
                                    ? basics.image
                                    : `/${basics.image}`
                            }
                            alt={basics.name || "Profile"}
                            className={`block h-48 w-48 object-cover ${
                                basics.imageStyle === "rounded"
                                    ? "rounded-full"
                                    : basics.imageStyle === "squared"
                                      ? "rounded-none"
                                      : "rounded-md"
                            }`}
                        />
                    </div>
                ) : null}
                {basics.name ? (
                    <h1 className="m-0 mb-1 text-center text-4xl font-extrabold tracking-[-0.03em] text-(--color-foreground)">
                        {basics.name}
                    </h1>
                ) : null}
                {basics.label ? (
                    <p className="m-0 mb-3 text-center text-lg text-(--color-muted)">
                        {basics.label}
                    </p>
                ) : null}
                <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
                    {basics.email ? (
                        <a
                            href={`mailto:${basics.email}`}
                            className="text-base text-(--color-link) no-underline hover:opacity-80"
                        >
                            {basics.email}
                        </a>
                    ) : null}
                    {basics.phone ? (
                        <span className="text-base text-(--color-link)">
                            {basics.phone}
                        </span>
                    ) : null}
                    {basics.url ? (
                        <a
                            href={basics.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-base text-(--color-link) no-underline hover:opacity-80"
                        >
                            {basics.url}
                        </a>
                    ) : null}
                    {basics.profiles?.map((profile, idx) => (
                        <a
                            key={idx}
                            href={profile.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-base font-medium text-(--color-link) no-underline hover:opacity-80"
                        >
                            {profile.network}
                        </a>
                    ))}
                </div>
                {basics.summary ? (
                    <p className="m-0 mt-4 text-center text-base leading-[1.65] whitespace-pre-line text-(--color-foreground)">
                        {basics.summary}
                    </p>
                ) : null}
            </header>

            {/* Career Phase — 수평 2컬럼 (좌: 웹 경력, 우: 게임 프로젝트) */}
            {hasWebWork || hasGameProjects ? (
                <section className="mb-10">
                    <div className="grid grid-cols-[2fr_3fr] divide-x divide-(--color-border)">
                        {/* 좌측: 웹 경력 */}
                        <div className="pr-8">
                            <h2 className="mb-5 border-b border-(--color-border) pb-1.5 text-xl font-bold tracking-widest text-(--color-accent) uppercase">
                                경력
                            </h2>
                            {hasWebWork ? (
                                <div className="relative ml-2 flex flex-col gap-7 border-l-2 border-(--color-border) pl-6">
                                    {webWork.map((w, wIdx) => (
                                        <div key={wIdx} className="relative">
                                            <div
                                                className="absolute h-2.5 w-2.5 rounded-full border-2 border-(--color-surface) bg-(--color-accent)"
                                                style={{
                                                    left: "-1.825rem",
                                                    top: "0.4rem",
                                                    boxShadow:
                                                        "0 0 0 2px var(--color-accent)",
                                                }}
                                            />
                                            <div>
                                                {w.startDate || w.endDate ? (
                                                    <p
                                                        className="m-0 mb-0.5 text-sm text-(--color-muted)"
                                                        style={{
                                                            fontVariantNumeric:
                                                                "tabular-nums",
                                                        }}
                                                    >
                                                        {formatDateRange(
                                                            w.startDate,
                                                            w.endDate,
                                                            w.hideDays
                                                        )}
                                                    </p>
                                                ) : null}
                                                {w.name ? (
                                                    <h3 className="m-0 mb-0.5 text-lg font-bold text-(--color-foreground)">
                                                        {w.url ? (
                                                            <a
                                                                href={w.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-inherit no-underline hover:text-(--color-link)"
                                                            >
                                                                {w.name}
                                                            </a>
                                                        ) : (
                                                            w.name
                                                        )}
                                                    </h3>
                                                ) : null}
                                                {w.position ? (
                                                    <p className="m-0 mb-2 text-base text-(--color-muted)">
                                                        {w.position}
                                                    </p>
                                                ) : null}
                                                {w.summary ? (
                                                    workMarkdown[wIdx]
                                                        ?.summary ? (
                                                        <div
                                                            className="resume-markdown m-0 mb-2 text-base text-(--color-foreground)"
                                                            dangerouslySetInnerHTML={{
                                                                __html: workMarkdown[
                                                                    wIdx
                                                                ].summary!,
                                                            }}
                                                        />
                                                    ) : (
                                                        <p className="m-0 mb-2 text-base text-(--color-foreground)">
                                                            {w.summary}
                                                        </p>
                                                    )
                                                ) : null}
                                                {w.highlights &&
                                                w.highlights.length > 0 ? (
                                                    <ul className="m-0 mt-1 flex list-none flex-col gap-1 p-0">
                                                        {w.highlights.map(
                                                            (h, hIdx) => (
                                                                <li
                                                                    key={hIdx}
                                                                    className="mb-1 text-base text-(--color-foreground)"
                                                                >
                                                                    {workMarkdown[
                                                                        wIdx
                                                                    ]
                                                                        ?.highlights?.[
                                                                        hIdx
                                                                    ] ? (
                                                                        <span
                                                                            className="resume-markdown"
                                                                            dangerouslySetInnerHTML={{
                                                                                __html: workMarkdown[
                                                                                    wIdx
                                                                                ]
                                                                                    .highlights![
                                                                                    hIdx
                                                                                ],
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        `• ${h}`
                                                                    )}
                                                                </li>
                                                            )
                                                        )}
                                                    </ul>
                                                ) : null}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </div>

                        {/* 우측: 게임 프로젝트 */}
                        <div className="pl-8">
                            <h2 className="mb-5 flex items-center gap-3 border-b border-(--color-border) pb-1.5 text-xl font-bold tracking-widest text-(--color-accent) uppercase">
                                프로젝트
                                <span className="rounded-full bg-(--color-accent) px-3 py-0.5 text-xs font-bold tracking-widest text-(--color-on-accent) normal-case">
                                    게임 개발 전환
                                </span>
                            </h2>
                            {hasGameProjects ? (
                                <div className="flex flex-col gap-4">
                                    {gameProjects.map((proj, pIdx) => (
                                        <div
                                            key={pIdx}
                                            className="rounded-lg border border-(--color-border) bg-(--color-surface-subtle) p-4"
                                        >
                                            {proj.name ? (
                                                <h3 className="m-0 mb-1 text-lg font-bold text-(--color-foreground)">
                                                    {proj.url ? (
                                                        <a
                                                            href={proj.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-(--color-link) no-underline hover:opacity-80"
                                                        >
                                                            {proj.name}
                                                        </a>
                                                    ) : (
                                                        proj.name
                                                    )}
                                                </h3>
                                            ) : null}
                                            {proj.startDate || proj.endDate ? (
                                                <div
                                                    className="mb-2 text-sm text-(--color-muted)"
                                                    style={{
                                                        fontVariantNumeric:
                                                            "tabular-nums",
                                                    }}
                                                >
                                                    {formatDateRange(
                                                        proj.startDate,
                                                        proj.endDate,
                                                        proj.hideDays
                                                    )}
                                                </div>
                                            ) : null}
                                            {proj.sections &&
                                            proj.sections.length > 0 ? (
                                                proj.sections.map(
                                                    (sec, sIdx) => (
                                                        <div
                                                            key={sIdx}
                                                            className="mt-2"
                                                        >
                                                            {sec.title ? (
                                                                <p className="m-0 mb-0.5 text-base font-semibold tracking-wider text-(--color-muted) uppercase">
                                                                    {sec.title}
                                                                </p>
                                                            ) : null}
                                                            {projectSectionsMarkdown[
                                                                pIdx
                                                            ]?.[sIdx] ? (
                                                                <div
                                                                    className="resume-markdown m-0 text-base leading-[1.6] text-(--color-foreground)"
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: projectSectionsMarkdown[
                                                                            pIdx
                                                                        ][
                                                                            sIdx
                                                                        ]!,
                                                                    }}
                                                                />
                                                            ) : (
                                                                <p className="m-0 text-base leading-[1.6] text-(--color-foreground)">
                                                                    {
                                                                        sec.content
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    )
                                                )
                                            ) : (
                                                <>
                                                    {proj.description ? (
                                                        <p className="m-0 text-base leading-[1.6] text-(--color-foreground)">
                                                            {proj.description}
                                                        </p>
                                                    ) : null}
                                                    {proj.highlights &&
                                                    proj.highlights.length >
                                                        0 ? (
                                                        <ul className="mt-1 mb-0 pl-2 text-base text-(--color-foreground)">
                                                            {proj.highlights.map(
                                                                (h, hIdx) => (
                                                                    <li
                                                                        key={
                                                                            hIdx
                                                                        }
                                                                        className="mb-[0.2em]"
                                                                    >
                                                                        {`• ${h}`}
                                                                    </li>
                                                                )
                                                            )}
                                                        </ul>
                                                    ) : null}
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </section>
            ) : null}

            {/* 기술 스택 — ResumeModern 그리드 카드 스타일 */}
            {hasSkills ? (
                <section className="mb-10">
                    <h2 className="mb-5 border-b border-(--color-border) pb-1.5 text-xl font-bold tracking-widest text-(--color-accent) uppercase">
                        기술
                    </h2>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
                        {gameSkills.map((skill, idx) => {
                            const icon = skill.iconSlug
                                ? getSimpleIcon(skill.iconSlug)
                                : null;
                            return (
                                <div
                                    key={idx}
                                    className="rounded-lg border border-(--color-border) bg-(--color-surface-subtle) px-4 py-3"
                                >
                                    {skill.name ? (
                                        <div className="mb-1.5 flex items-center gap-2 text-base font-bold text-(--color-foreground)">
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
                                    {skill.keywords &&
                                    skill.keywords.length > 0 ? (
                                        <div className="mt-1 flex flex-wrap gap-1.5">
                                            {skill.keywords.map((kw, kIdx) => (
                                                <SkillBadge
                                                    key={kIdx}
                                                    name={kw}
                                                />
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                    {webSkills.length > 0 ? (
                        <div className="mt-4">
                            <p className="mb-3 text-sm font-medium text-(--color-muted)">
                                배경 기술
                            </p>
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 opacity-60">
                                {webSkills.map((skill, idx) => {
                                    const icon = skill.iconSlug
                                        ? getSimpleIcon(skill.iconSlug)
                                        : null;
                                    return (
                                        <div
                                            key={idx}
                                            className="rounded-lg border border-(--color-border) bg-(--color-surface-subtle) px-4 py-3"
                                        >
                                            {skill.name ? (
                                                <div className="mb-1.5 flex items-center gap-2 text-base font-bold text-(--color-foreground)">
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
                                                            <title>
                                                                {icon.title}
                                                            </title>
                                                            <path
                                                                d={icon.path}
                                                            />
                                                        </svg>
                                                    ) : null}
                                                    {skill.name}
                                                </div>
                                            ) : null}
                                            {skill.keywords &&
                                            skill.keywords.length > 0 ? (
                                                <div className="mt-1 flex flex-wrap gap-1.5">
                                                    {skill.keywords.map(
                                                        (kw, kIdx) => (
                                                            <SkillBadge
                                                                key={kIdx}
                                                                name={kw}
                                                            />
                                                        )
                                                    )}
                                                </div>
                                            ) : null}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : null}
                </section>
            ) : null}

            {/* 학력 — ResumeModern 카드 스타일 */}
            {hasEducation ? (
                <section className="mb-10">
                    <h2 className="mb-5 border-b border-(--color-border) pb-1.5 text-xl font-bold tracking-widest text-(--color-accent) uppercase">
                        학력
                    </h2>
                    <div>
                        {education.map((edu, idx) => (
                            <div
                                key={idx}
                                className="mb-3 rounded-lg border border-(--color-border) bg-(--color-surface-subtle) px-4.5 py-3.5 last:mb-0"
                            >
                                {edu.institution ? (
                                    <h3 className="m-0 mb-0.5 text-lg font-bold text-(--color-foreground)">
                                        {edu.url ? (
                                            <a
                                                href={edu.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-inherit no-underline hover:text-(--color-link)"
                                            >
                                                {edu.institution}
                                            </a>
                                        ) : (
                                            edu.institution
                                        )}
                                    </h3>
                                ) : null}
                                {edu.studyType || edu.area ? (
                                    <div className="mb-0.5 text-base text-(--color-foreground)">
                                        {`${edu.studyType || ""}${edu.area ? " " + edu.area : ""}`}
                                    </div>
                                ) : null}
                                {edu.startDate || edu.endDate ? (
                                    <div
                                        className="mb-1 text-sm text-(--color-muted)"
                                        style={{
                                            fontVariantNumeric: "tabular-nums",
                                        }}
                                    >
                                        {formatDateRange(
                                            edu.startDate,
                                            edu.endDate
                                        )}
                                    </div>
                                ) : null}
                                {edu.gpa != null ? (
                                    <div className="mb-1 text-sm text-(--color-muted)">
                                        GPA: {edu.gpa.toFixed(2)} /{" "}
                                        {(edu.gpaMax ?? 4.5).toFixed(2)}
                                    </div>
                                ) : edu.score ? (
                                    <div className="mb-1 text-sm text-(--color-muted)">
                                        GPA: {edu.score}
                                    </div>
                                ) : null}
                                {edu.courses && edu.courses.length > 0 ? (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {edu.courses.map((course, cIdx) => (
                                            <span
                                                key={cIdx}
                                                className="inline-block rounded bg-(--color-tag-bg) px-[0.55em] py-[0.15em] text-sm leading-normal font-medium text-(--color-tag-fg)"
                                            >
                                                {course}
                                            </span>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </section>
            ) : null}

            {/* 언어 — ResumeModern 제네릭 그리드 스타일 */}
            {hasLanguages ? (
                <section className="mb-10">
                    <h2 className="mb-5 border-b border-(--color-border) pb-1.5 text-xl font-bold tracking-widest text-(--color-accent) uppercase">
                        언어
                    </h2>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
                        {languages.map((lang, idx) => (
                            <div
                                key={idx}
                                className="rounded-lg border border-(--color-border) bg-(--color-surface-subtle) px-4 py-3"
                            >
                                {lang.language ? (
                                    <h3 className="m-0 mb-0.5 text-lg font-bold text-(--color-foreground)">
                                        {lang.language}
                                    </h3>
                                ) : null}
                                {lang.fluency ? (
                                    <div className="mb-0.5 text-base text-(--color-muted)">
                                        {lang.fluency}
                                    </div>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </section>
            ) : null}

            {/* 수상 — ResumeModern 제네릭 그리드 스타일 */}
            {hasAwards ? (
                <section className="mb-10">
                    <h2 className="mb-5 border-b border-(--color-border) pb-1.5 text-xl font-bold tracking-widest text-(--color-accent) uppercase">
                        수상
                    </h2>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
                        {awards.map((award, idx) => (
                            <div
                                key={idx}
                                className="rounded-lg border border-(--color-border) bg-(--color-surface-subtle) px-4 py-3"
                            >
                                {award.title ? (
                                    <h3 className="m-0 mb-0.5 text-lg font-bold text-(--color-foreground)">
                                        {award.title}
                                    </h3>
                                ) : null}
                                {award.awarder ? (
                                    <div className="mb-0.5 text-base text-(--color-muted)">
                                        {award.awarder}
                                    </div>
                                ) : null}
                                {award.date ? (
                                    <div
                                        className="mb-1 text-sm text-(--color-muted)"
                                        style={{
                                            fontVariantNumeric: "tabular-nums",
                                        }}
                                    >
                                        {award.date}
                                    </div>
                                ) : null}
                                {award.summary ? (
                                    <p className="text-base text-(--color-foreground)">
                                        {award.summary}
                                    </p>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </section>
            ) : null}

            {/* 자격증 — ResumeModern 제네릭 그리드 스타일 */}
            {hasCertificates ? (
                <section className="mb-10">
                    <h2 className="mb-5 border-b border-(--color-border) pb-1.5 text-xl font-bold tracking-widest text-(--color-accent) uppercase">
                        자격증
                    </h2>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
                        {certificates.map((cert, idx) => (
                            <div
                                key={idx}
                                className="rounded-lg border border-(--color-border) bg-(--color-surface-subtle) px-4 py-3"
                            >
                                {cert.name ? (
                                    <h3 className="m-0 mb-0.5 text-lg font-bold text-(--color-foreground)">
                                        {cert.name}
                                    </h3>
                                ) : null}
                                {cert.issuer ? (
                                    <div className="mb-0.5 text-base text-(--color-muted)">
                                        {cert.issuer}
                                    </div>
                                ) : null}
                                {cert.date ? (
                                    <div
                                        className="mb-1 text-sm text-(--color-muted)"
                                        style={{
                                            fontVariantNumeric: "tabular-nums",
                                        }}
                                    >
                                        {cert.date}
                                    </div>
                                ) : null}
                                {cert.url ? (
                                    <a
                                        href={cert.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-base break-all text-(--color-link) no-underline hover:underline hover:opacity-80"
                                    >
                                        {cert.url}
                                    </a>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </section>
            ) : null}
        </div>
    );
}
