import type { Resume, ResumeSkillKeyword } from "@/types/resume";
import { renderMarkdown } from "@/lib/markdown";
import { SkillBadge, getSimpleIcon } from "@/components/resume/SkillBadge";
import { getPortfolioItem } from "@/lib/queries";

interface Props {
    resume: Resume;
}

const defaultSectionLabels: Record<string, string> = {
    work: "경력",
    skills: "기술",
    education: "학력",
    projects: "프로젝트",
    volunteer: "봉사 활동",
    awards: "수상",
    certificates: "자격증",
    publications: "출판물",
    languages: "언어",
    interests: "관심사",
    references: "추천인",
};

const formatDateRange = (
    startDate?: string,
    endDate?: string,
    hideDays?: boolean
): string => {
    const fmt = (d?: string) => (d && hideDays ? d.slice(0, 7) : d || "");
    return `${fmt(startDate)} ~ ${fmt(endDate) || "Present"}`;
};

export default async function ResumeMinimal({ resume }: Props) {
    const basics = resume.basics ?? {};
    const sections = Object.entries(resume)
        .filter(([key]) => key !== "basics" && key !== "careerPhases")
        .map(
            ([key, val]) =>
                [key, (val as any)?.entries ?? []] as [string, any[]]
        );
    const getLabel = (key: string) => {
        const sec = (resume as any)[key];
        const emoji = sec?.emoji || "➕";
        const label =
            defaultSectionLabels[key] ||
            key.charAt(0).toUpperCase() + key.slice(1);
        const showEmoji = sec?.showEmoji === true;
        return showEmoji ? `${emoji} ${label}` : label;
    };

    const workMarkdown = await Promise.all(
        (resume.work?.entries || []).map(async (w) => {
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
    const projectsMarkdown = await Promise.all(
        (resume.projects?.entries || []).map(async (proj) => {
            if (!proj.sections) return [] as (string | null)[];
            return Promise.all(
                proj.sections.map(async (sec) =>
                    sec.markdown ? renderMarkdown(sec.content) : null
                )
            );
        })
    );

    // portfolioSlug 연결 항목 fetch
    const portfolioSlugs = (resume.projects?.entries || [])
        .map((p) => p.portfolioSlug)
        .filter((s): s is string => Boolean(s));
    const portfolioItemsArr = await Promise.all(
        portfolioSlugs.map((slug) => getPortfolioItem(slug))
    );
    const portfolioItemMap: Record<string, (typeof portfolioItemsArr)[number]> =
        Object.fromEntries(
            portfolioSlugs.map((slug, i) => [slug, portfolioItemsArr[i]])
        );

    return (
        <div className="mx-auto max-w-[680px] text-[0.9375rem] leading-[1.6] text-(--color-foreground)">
            {/* Header */}
            <header className="mb-5 border-b-2 border-(--color-foreground) pb-4">
                {basics.image && basics.image.trim() ? (
                    <div className="mb-4">
                        <img
                            src={
                                basics.image.startsWith("http") ||
                                basics.image.startsWith("/")
                                    ? basics.image
                                    : `/${basics.image}`
                            }
                            alt={basics.name || "Profile"}
                            className={`block h-40 w-40 object-cover ${
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
                    <h1 className="m-0 mb-1 text-[1.75rem] leading-[1.15] font-extrabold tracking-[-0.03em] text-(--color-foreground)">
                        {basics.name}
                    </h1>
                ) : null}
                {basics.label ? (
                    <div className="mb-3 text-[1.05rem] text-(--color-muted)">
                        {basics.label}
                    </div>
                ) : null}
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[0.85rem] text-(--color-foreground)">
                    {basics.email ? (
                        <span>
                            <a
                                href={`mailto:${basics.email}`}
                                className="text-(--color-link) no-underline hover:opacity-80"
                            >
                                {basics.email}
                            </a>
                        </span>
                    ) : null}
                    {basics.phone ? <span>{basics.phone}</span> : null}
                    {basics.url ? (
                        <span>
                            <a
                                href={basics.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-(--color-link) no-underline hover:opacity-80"
                            >
                                {basics.url}
                            </a>
                        </span>
                    ) : null}
                    {basics.location
                        ? [
                              basics.location.city,
                              basics.location.region,
                              basics.location.countryCode,
                          ]
                              .filter(Boolean)
                              .join(", ")
                        : null}
                </div>
                {basics.profiles && basics.profiles.length > 0 ? (
                    <div className="mt-1 text-[0.85rem] text-(--color-foreground)">
                        {basics.profiles.map((profile, index) => (
                            <span key={index}>
                                {index > 0 ? " \u2022 " : ""}
                                {profile.url ? (
                                    <a
                                        href={profile.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-(--color-link) no-underline hover:opacity-80"
                                    >
                                        {profile.network}
                                    </a>
                                ) : (
                                    profile.network
                                )}
                            </span>
                        ))}
                    </div>
                ) : null}
            </header>

            {/* Summary */}
            {basics.summary ? (
                <section className="mb-6">
                    <p className="m-0 text-[0.9375rem] leading-[1.65] whitespace-pre-line text-(--color-foreground)">
                        {basics.summary}
                    </p>
                </section>
            ) : null}

            {/* Main content */}
            <main>
                {sections.map(([sectionKey, sectionValue]) => {
                    if (
                        !sectionValue ||
                        (Array.isArray(sectionValue) &&
                            sectionValue.length === 0)
                    )
                        return null;

                    if (sectionKey === "work" && Array.isArray(sectionValue)) {
                        return (
                            <section key={sectionKey} className="mb-10">
                                <h2 className="mb-3 border-b border-(--color-border) pb-2 text-xl font-bold tracking-widest text-(--color-accent) uppercase">
                                    {getLabel("work")}
                                </h2>
                                {sectionValue.map((workItem, wIdx: number) => (
                                    <div
                                        key={wIdx}
                                        className="mb-4 border-b border-(--color-border) pb-4 last:mb-0 last:border-b-0 last:pb-0"
                                    >
                                        <div className="max-tablet:flex-col max-tablet:items-start mb-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                            {workItem.position ? (
                                                <span className="text-lg font-bold text-(--color-foreground)">
                                                    {workItem.position}
                                                </span>
                                            ) : null}
                                            {workItem.name ? (
                                                <span className="text-base text-(--color-muted)">
                                                    {workItem.url ? (
                                                        <a
                                                            href={workItem.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-(--color-link) no-underline"
                                                        >
                                                            {workItem.name}
                                                        </a>
                                                    ) : (
                                                        workItem.name
                                                    )}
                                                </span>
                                            ) : null}
                                            {(workItem.startDate ||
                                                workItem.endDate) && (
                                                <span
                                                    className="max-tablet:ml-0 ml-auto text-sm whitespace-nowrap text-(--color-muted)"
                                                    style={{
                                                        fontVariantNumeric:
                                                            "tabular-nums",
                                                    }}
                                                >
                                                    {formatDateRange(
                                                        workItem.startDate,
                                                        workItem.endDate,
                                                        workItem.hideDays
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                        {workItem.summary ? (
                                            workMarkdown[wIdx]?.summary ? (
                                                <div
                                                    className="resume-markdown m-0 mb-1 text-sm leading-[1.6] text-(--color-foreground)"
                                                    dangerouslySetInnerHTML={{
                                                        __html: workMarkdown[
                                                            wIdx
                                                        ].summary!,
                                                    }}
                                                />
                                            ) : (
                                                <p className="m-0 mb-1 text-base leading-[1.6] text-(--color-foreground)">
                                                    {workItem.summary}
                                                </p>
                                            )
                                        ) : null}
                                        {workItem.highlights &&
                                        workItem.highlights.length > 0 ? (
                                            <ul className="mt-1 mb-0 pl-2 text-base text-(--color-foreground)">
                                                {workItem.highlights.map(
                                                    (
                                                        highlight: string,
                                                        hIdx: number
                                                    ) =>
                                                        workMarkdown[wIdx]
                                                            ?.highlights?.[
                                                            hIdx
                                                        ] ? (
                                                            <li
                                                                key={hIdx}
                                                                className="resume-markdown mb-[0.2em]"
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
                                                            <li
                                                                key={hIdx}
                                                                className="mb-[0.2em]"
                                                            >
                                                                {`• ${highlight}`}
                                                            </li>
                                                        )
                                                )}
                                            </ul>
                                        ) : null}
                                    </div>
                                ))}
                            </section>
                        );
                    }

                    if (
                        sectionKey === "skills" &&
                        Array.isArray(sectionValue)
                    ) {
                        return (
                            <section key={sectionKey} className="mb-10">
                                <h2 className="mb-3 border-b border-(--color-border) pb-2 text-xl font-bold tracking-widest text-(--color-accent) uppercase">
                                    {getLabel("skills")}
                                </h2>
                                <div className="text-lg leading-[1.75] text-(--color-foreground)">
                                    {sectionValue.map((skill, skillIndex) => (
                                        <div
                                            key={skillIndex}
                                            className="mb-3 space-y-2"
                                        >
                                            {skill.name ? (
                                                <strong className="flex items-center gap-1.5">
                                                    {skill.iconSlug &&
                                                    getSimpleIcon(
                                                        skill.iconSlug
                                                    ) ? (
                                                        <svg
                                                            role="img"
                                                            viewBox="0 0 24 24"
                                                            className="h-3.5 w-3.5"
                                                            style={{
                                                                fill:
                                                                    skill.iconColor ||
                                                                    `#${getSimpleIcon(skill.iconSlug)!.hex}`,
                                                            }}
                                                            xmlns="http://www.w3.org/2000/svg"
                                                        >
                                                            <title>
                                                                {
                                                                    getSimpleIcon(
                                                                        skill.iconSlug
                                                                    )!.title
                                                                }
                                                            </title>
                                                            <path
                                                                d={
                                                                    getSimpleIcon(
                                                                        skill.iconSlug
                                                                    )!.path
                                                                }
                                                            />
                                                        </svg>
                                                    ) : null}
                                                    {skill.name}
                                                </strong>
                                            ) : null}
                                            {skill.keywords &&
                                            skill.keywords.length > 0 ? (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {skill.keywords.map(
                                                        (
                                                            kw: ResumeSkillKeyword,
                                                            kIdx: number
                                                        ) => (
                                                            <SkillBadge
                                                                key={kIdx}
                                                                name={kw.name}
                                                                overrideSlug={
                                                                    kw.iconSlug
                                                                }
                                                                overrideColor={
                                                                    kw.iconColor
                                                                }
                                                            />
                                                        )
                                                    )}
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        );
                    }

                    if (
                        sectionKey === "projects" &&
                        Array.isArray(sectionValue)
                    ) {
                        return (
                            <section key={sectionKey} className="mb-10">
                                <h2 className="mb-5 border-b border-(--color-border) pb-1.5 text-xl font-bold tracking-widest text-(--color-accent) uppercase">
                                    {getLabel("projects")}
                                </h2>
                                <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                                    {sectionValue.map(
                                        (project, pIdx: number) => {
                                            const pf = project.portfolioSlug
                                                ? portfolioItemMap[
                                                      project.portfolioSlug
                                                  ]
                                                : null;
                                            const pfData = pf?.data as
                                                | {
                                                      role?: string;
                                                      teamSize?:
                                                          | string
                                                          | number;
                                                      github?: string;
                                                  }
                                                | undefined;
                                            const pfTags = pf?.tags as
                                                | string[]
                                                | undefined;
                                            return (
                                                <div
                                                    key={pIdx}
                                                    className="group relative overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface-subtle) transition-colors hover:border-(--color-accent)"
                                                >
                                                    {project.portfolioSlug ? (
                                                        <a
                                                            href={`/portfolio/${project.portfolioSlug}`}
                                                            className="absolute inset-0 z-0"
                                                            aria-label={
                                                                project.name ??
                                                                ""
                                                            }
                                                        />
                                                    ) : null}
                                                    {/* Thumbnail */}
                                                    {pf?.thumbnail ? (
                                                        <div className="relative aspect-video w-full overflow-hidden bg-(--color-border)">
                                                            <img
                                                                src={
                                                                    pf.thumbnail as string
                                                                }
                                                                alt={
                                                                    project.name ??
                                                                    ""
                                                                }
                                                                className="h-full w-full object-cover"
                                                                loading="lazy"
                                                            />
                                                        </div>
                                                    ) : null}
                                                    <div className="p-4">
                                                        {/* Name */}
                                                        {project.name ? (
                                                            <h3 className="relative z-10 m-0 mb-1.5 text-base leading-snug font-bold text-(--color-foreground) transition-colors group-hover:text-(--color-accent)">
                                                                {project.url ? (
                                                                    <a
                                                                        href={
                                                                            project.url
                                                                        }
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-(--color-link) no-underline hover:opacity-80"
                                                                    >
                                                                        {
                                                                            project.name
                                                                        }
                                                                    </a>
                                                                ) : (
                                                                    project.name
                                                                )}
                                                            </h3>
                                                        ) : null}
                                                        {/* Tags from portfolio */}
                                                        {pfTags &&
                                                        pfTags.length > 0 ? (
                                                            <div className="relative z-10 mb-2 flex flex-wrap gap-1">
                                                                {pfTags
                                                                    .slice(0, 5)
                                                                    .map(
                                                                        (
                                                                            tag,
                                                                            tIdx
                                                                        ) => (
                                                                            <span
                                                                                key={
                                                                                    tIdx
                                                                                }
                                                                                className="inline-block rounded bg-(--color-tag-bg) px-[0.45em] py-[0.1em] text-xs leading-normal font-medium text-(--color-tag-fg)"
                                                                            >
                                                                                {
                                                                                    tag
                                                                                }
                                                                            </span>
                                                                        )
                                                                    )}
                                                            </div>
                                                        ) : null}
                                                        {pfData?.github ? (
                                                            <div className="relative z-10 mb-2">
                                                                <a
                                                                    href={
                                                                        pfData.github
                                                                    }
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 rounded-full border border-(--color-border) px-2.5 py-0.5 text-xs font-medium text-(--color-foreground) transition-colors hover:border-(--color-accent) hover:text-(--color-accent)"
                                                                >
                                                                    GitHub
                                                                    <svg
                                                                        className="h-3 w-3"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                                        />
                                                                    </svg>
                                                                </a>
                                                            </div>
                                                        ) : null}
                                                        {/* Role · Team size */}
                                                        {pfData?.role ||
                                                        pfData?.teamSize ? (
                                                            <p className="relative z-10 m-0 mb-1.5 text-xs text-(--color-muted)">
                                                                {[
                                                                    pfData.role,
                                                                    pfData.teamSize
                                                                        ? `${pfData.teamSize}인`
                                                                        : null,
                                                                ]
                                                                    .filter(
                                                                        Boolean
                                                                    )
                                                                    .join(
                                                                        " · "
                                                                    )}
                                                            </p>
                                                        ) : null}
                                                        {/* Date range */}
                                                        {(project.startDate ||
                                                            project.endDate) && (
                                                            <div
                                                                className="relative z-10 mb-2 text-sm text-(--color-muted)"
                                                                style={{
                                                                    fontVariantNumeric:
                                                                        "tabular-nums",
                                                                }}
                                                            >
                                                                {formatDateRange(
                                                                    project.startDate,
                                                                    project.endDate
                                                                )}
                                                            </div>
                                                        )}
                                                        {/* Content */}
                                                        {project.sections &&
                                                        project.sections
                                                            .length > 0 ? (
                                                            project.sections.map(
                                                                (
                                                                    sec: {
                                                                        title: string;
                                                                        content: string;
                                                                        markdown?: boolean;
                                                                    },
                                                                    sIdx: number
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            sIdx
                                                                        }
                                                                        className="mt-2"
                                                                    >
                                                                        {sec.title ? (
                                                                            <p className="m-0 mb-0.5 text-base font-semibold tracking-wider text-(--color-muted) uppercase">
                                                                                {
                                                                                    sec.title
                                                                                }
                                                                            </p>
                                                                        ) : null}
                                                                        {projectsMarkdown[
                                                                            pIdx
                                                                        ]?.[
                                                                            sIdx
                                                                        ] ? (
                                                                            <div
                                                                                className="resume-markdown m-0 text-base leading-[1.6] text-(--color-foreground)"
                                                                                dangerouslySetInnerHTML={{
                                                                                    __html: projectsMarkdown[
                                                                                        pIdx
                                                                                    ][
                                                                                        sIdx
                                                                                    ]!,
                                                                                }}
                                                                            />
                                                                        ) : (
                                                                            <p className="m-0 text-base leading-[1.6] whitespace-pre-wrap text-(--color-foreground)">
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
                                                                {project.description ? (
                                                                    <p className="m-0 text-base leading-[1.6] whitespace-pre-wrap text-(--color-foreground)">
                                                                        {
                                                                            project.description
                                                                        }
                                                                    </p>
                                                                ) : null}
                                                                {project.highlights &&
                                                                project
                                                                    .highlights
                                                                    .length >
                                                                    0 ? (
                                                                    <ul className="mt-1 mb-0 pl-2 text-base text-(--color-foreground)">
                                                                        {project.highlights.map(
                                                                            (
                                                                                highlight: string,
                                                                                hIdx: number
                                                                            ) => (
                                                                                <li
                                                                                    key={
                                                                                        hIdx
                                                                                    }
                                                                                    className="mb-[0.2em]"
                                                                                >
                                                                                    {`• ${highlight}`}
                                                                                </li>
                                                                            )
                                                                        )}
                                                                    </ul>
                                                                ) : null}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            </section>
                        );
                    }

                    if (
                        sectionKey === "education" &&
                        Array.isArray(sectionValue)
                    ) {
                        return (
                            <section key={sectionKey} className="mb-10">
                                <h2 className="mb-3 border-b border-(--color-border) pb-2 text-xl font-bold tracking-widest text-(--color-accent) uppercase">
                                    {getLabel("education")}
                                </h2>
                                {sectionValue.map((education, idx) => (
                                    <div
                                        key={idx}
                                        className="mb-4 border-b border-(--color-border) pb-4 last:mb-0 last:border-b-0 last:pb-0"
                                    >
                                        <div className="max-tablet:flex-col max-tablet:items-start mb-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                            {education.institution ? (
                                                <span className="text-lg font-bold text-(--color-foreground)">
                                                    {education.url ? (
                                                        <a
                                                            href={education.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-inherit no-underline hover:text-(--color-link)"
                                                        >
                                                            {
                                                                education.institution
                                                            }
                                                        </a>
                                                    ) : (
                                                        education.institution
                                                    )}
                                                </span>
                                            ) : null}
                                            {(education.studyType ||
                                                education.area) && (
                                                <span className="text-base text-(--color-muted)">
                                                    {`${education.studyType || ""} ${education.area ? " " + education.area : ""}`}
                                                </span>
                                            )}
                                            {(education.startDate ||
                                                education.endDate) && (
                                                <span
                                                    className="max-tablet:ml-0 ml-auto text-sm whitespace-nowrap text-(--color-muted)"
                                                    style={{
                                                        fontVariantNumeric:
                                                            "tabular-nums",
                                                    }}
                                                >
                                                    {formatDateRange(
                                                        education.startDate,
                                                        education.endDate
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                        {education.courses &&
                                        education.courses.length > 0 ? (
                                            <div className="my-0.5 text-base text-(--color-muted)">
                                                Courses:{" "}
                                                {education.courses.join(", ")}
                                            </div>
                                        ) : null}
                                        {education.gpa != null ? (
                                            <div className="my-0.5 text-sm text-(--color-muted)">
                                                GPA: {education.gpa.toFixed(2)}{" "}
                                                /{" "}
                                                {(
                                                    education.gpaMax ?? 4.5
                                                ).toFixed(2)}
                                            </div>
                                        ) : education.score ? (
                                            <div className="my-0.5 text-base text-(--color-muted)">
                                                GPA: {education.score}
                                            </div>
                                        ) : null}
                                    </div>
                                ))}
                            </section>
                        );
                    }

                    if (
                        Array.isArray(sectionValue) &&
                        sectionValue.length > 0
                    ) {
                        const sectionTitle = getLabel(sectionKey);
                        return (
                            <section key={sectionKey} className="mb-10">
                                <h2 className="mb-3 border-b border-(--color-border) pb-2 text-xl font-bold tracking-widest text-(--color-accent) uppercase">
                                    {sectionTitle}
                                </h2>
                                {sectionValue.map(
                                    (genericItem: any, idx: number) => (
                                        <div
                                            key={idx}
                                            className="mb-4 border-b border-(--color-border) pb-4 last:mb-0 last:border-b-0 last:pb-0"
                                        >
                                            <div className="max-tablet:flex-col max-tablet:items-start mb-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                                {genericItem.name ||
                                                genericItem.title ||
                                                genericItem.organization ||
                                                genericItem.language ? (
                                                    <span className="text-lg font-bold text-(--color-foreground)">
                                                        {genericItem.name ||
                                                            genericItem.title ||
                                                            genericItem.organization ||
                                                            genericItem.language}
                                                    </span>
                                                ) : null}
                                                {genericItem.position ||
                                                genericItem.awarder ||
                                                genericItem.issuer ||
                                                genericItem.publisher ||
                                                genericItem.fluency ? (
                                                    <span className="text-base text-(--color-muted)">
                                                        {genericItem.position ||
                                                            genericItem.awarder ||
                                                            genericItem.issuer ||
                                                            genericItem.publisher ||
                                                            genericItem.fluency}
                                                    </span>
                                                ) : null}
                                                {(genericItem.startDate ||
                                                    genericItem.date ||
                                                    genericItem.releaseDate) && (
                                                    <span
                                                        className="max-tablet:ml-0 ml-auto text-sm whitespace-nowrap text-(--color-muted)"
                                                        style={{
                                                            fontVariantNumeric:
                                                                "tabular-nums",
                                                        }}
                                                    >
                                                        {genericItem.startDate ||
                                                            genericItem.date ||
                                                            genericItem.releaseDate}
                                                        {genericItem.endDate
                                                            ? " ~ " +
                                                              genericItem.endDate
                                                            : ""}
                                                    </span>
                                                )}
                                            </div>
                                            {genericItem.summary ||
                                            genericItem.description ? (
                                                <p className="m-0 mb-1 text-sm leading-[1.6] text-(--color-foreground)">
                                                    {genericItem.summary ||
                                                        genericItem.description}
                                                </p>
                                            ) : null}
                                            {genericItem.highlights &&
                                            Array.isArray(
                                                genericItem.highlights
                                            ) &&
                                            genericItem.highlights.length >
                                                0 ? (
                                                <ul className="mt-1 mb-0 pl-4.5 text-sm text-(--color-foreground)">
                                                    {genericItem.highlights.map(
                                                        (
                                                            highlight: string,
                                                            hIdx: number
                                                        ) => (
                                                            <li
                                                                key={hIdx}
                                                                className="mb-[0.2em]"
                                                            >
                                                                {highlight}
                                                            </li>
                                                        )
                                                    )}
                                                </ul>
                                            ) : null}
                                            {genericItem.keywords &&
                                            Array.isArray(
                                                genericItem.keywords
                                            ) &&
                                            genericItem.keywords.length > 0 ? (
                                                <div className="my-0.5 text-sm text-(--color-muted)">
                                                    {genericItem.keywords.join(
                                                        ", "
                                                    )}
                                                </div>
                                            ) : null}
                                            {genericItem.url ? (
                                                <div className="my-0.5 text-sm text-(--color-muted)">
                                                    <a
                                                        href={genericItem.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-(--color-link) no-underline hover:opacity-80"
                                                    >
                                                        {genericItem.url}
                                                    </a>
                                                </div>
                                            ) : null}
                                            {genericItem.reference ? (
                                                <p className="m-0 mb-1 text-sm leading-[1.6] text-(--color-foreground)">
                                                    {genericItem.reference}
                                                </p>
                                            ) : null}
                                        </div>
                                    )
                                )}
                            </section>
                        );
                    }

                    return null;
                })}
            </main>
        </div>
    );
}
