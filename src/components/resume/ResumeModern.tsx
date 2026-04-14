import type { Resume } from "@/types/resume";
import type { CoreValue } from "@/types/about";
import { renderMarkdown } from "@/lib/markdown";
import SkillsSection from "@/components/resume/SkillsSection";
import CareerPhasesSection from "@/components/resume/CareerPhasesSection";
import ProjectsSection from "@/components/resume/ProjectsSection";

interface Props {
    resume: Resume;
    coreCompetencies?: CoreValue[];
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

export default async function ResumeModern({
    resume,
    coreCompetencies = [],
}: Props) {
    const basics = resume.basics ?? {};
    const sectionOrder = [
        "work",
        "projects",
        "skills",
        "education",
        "volunteer",
        "awards",
        "certificates",
        "publications",
        "languages",
        "interests",
        "references",
    ];
    const sections = Object.entries(resume)
        .filter(([key]) => key !== "basics" && key !== "careerPhases")
        .map(
            ([key, val]) =>
                [key, (val as any)?.entries ?? []] as [string, any[]]
        )
        .sort(([a], [b]) => {
            const ai = sectionOrder.indexOf(a);
            const bi = sectionOrder.indexOf(b);
            const aPos = ai === -1 ? sectionOrder.length : ai;
            const bPos = bi === -1 ? sectionOrder.length : bi;
            return aPos - bPos;
        });
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
    return (
        <div className="mx-auto max-w-[1050px] text-[0.9375rem] leading-[1.6] text-(--color-foreground)">
            {/* Header */}
            <header
                className="mb-8 border-b-2 border-(--color-border) pb-7"
                data-pdf-block
            >
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
                            className={`block h-56 w-56 object-cover ${
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
                    <h1 className="m-0 mb-1 text-center text-4xl leading-[1.15] font-extrabold tracking-[-0.03em] text-(--color-foreground)">
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
                    {basics.location
                        ? [
                              basics.location.city,
                              basics.location.region,
                              basics.location.countryCode,
                          ]
                              .filter(Boolean)
                              .map((location, idx) => (
                                  <span
                                      key={idx}
                                      className="text-base text-(--color-link)"
                                  >
                                      {location}
                                  </span>
                              ))
                        : null}
                </div>
                {basics.profiles && basics.profiles.length > 0 ? (
                    <div className="mt-1.5 flex flex-wrap justify-center gap-x-3 gap-y-1">
                        {basics.profiles.map((profile, idx) => (
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
                ) : null}
                {basics.summary ? (
                    <p className="m-0 mt-3 text-center text-base leading-[1.65] whitespace-pre-line text-(--color-foreground)">
                        {basics.summary}
                    </p>
                ) : null}
            </header>

            {/* Main content */}
            <main>
                <CareerPhasesSection
                    phases={resume.careerPhases?.entries ?? []}
                />
                {coreCompetencies.length > 0 && (
                    <section className="mb-10" data-pdf-block>
                        <h2 className="mb-5 border-b border-(--color-border) pb-1.5 text-xl font-bold tracking-widest text-(--color-accent) uppercase">
                            핵심역량
                        </h2>
                        <div className="tablet:grid-cols-2 grid grid-cols-1 gap-4">
                            {coreCompetencies.map((comp, idx) => (
                                <div
                                    key={idx}
                                    className="rounded-lg border border-(--color-border) bg-(--color-surface-subtle) px-5 py-4"
                                >
                                    <div className="mb-1.5 flex items-center gap-2.5">
                                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-(--color-accent) text-xs font-bold text-(--color-on-accent)">
                                            {idx + 1}
                                        </span>
                                        <h3 className="m-0 text-base font-bold text-(--color-foreground)">
                                            {comp.title}
                                        </h3>
                                    </div>
                                    {comp.description && (
                                        <p className="m-0 text-sm text-(--color-muted)">
                                            {comp.description}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}
                {sections.map(([sectionKey, sectionValue]) => {
                    if (
                        !sectionValue ||
                        (Array.isArray(sectionValue) &&
                            sectionValue.length === 0)
                    )
                        return null;

                    if (sectionKey === "work" && Array.isArray(sectionValue)) {
                        return (
                            <section
                                key={sectionKey}
                                className="mb-10"
                                data-pdf-block
                            >
                                <h2 className="mb-5 border-b border-(--color-border) pb-1.5 text-xl font-bold tracking-widest text-(--color-accent) uppercase">
                                    {getLabel("work")}
                                </h2>
                                <div className="relative ml-2 flex flex-col gap-7 border-l-2 border-(--color-border) pl-6">
                                    {sectionValue.map(
                                        (workItem, wIdx: number) => (
                                            <div
                                                key={wIdx}
                                                className="relative"
                                                data-pdf-block
                                            >
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
                                                    {(workItem.startDate ||
                                                        workItem.endDate) && (
                                                        <p
                                                            className="m-0 mb-0.5 text-sm text-(--color-muted)"
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
                                                        </p>
                                                    )}
                                                    {workItem.name ? (
                                                        <h3 className="m-0 mb-0.5 text-lg font-bold text-(--color-foreground)">
                                                            {workItem.url ? (
                                                                <a
                                                                    href={
                                                                        workItem.url
                                                                    }
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-inherit no-underline hover:text-(--color-link)"
                                                                >
                                                                    {
                                                                        workItem.name
                                                                    }
                                                                </a>
                                                            ) : (
                                                                workItem.name
                                                            )}
                                                        </h3>
                                                    ) : null}
                                                    {workItem.position ? (
                                                        <p className="m-0 mb-2 text-base text-(--color-muted)">
                                                            {workItem.position}
                                                        </p>
                                                    ) : null}
                                                    {workItem.summary ? (
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
                                                                {
                                                                    workItem.summary
                                                                }
                                                            </p>
                                                        )
                                                    ) : null}
                                                    {workItem.highlights &&
                                                    workItem.highlights.length >
                                                        0 ? (
                                                        <ul className="m-0 mt-1 flex list-none flex-col gap-1 p-0">
                                                            {workItem.highlights.map(
                                                                (
                                                                    highlight: string,
                                                                    hIdx: number
                                                                ) => (
                                                                    <li
                                                                        key={
                                                                            hIdx
                                                                        }
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
                                                                            `• ${highlight}`
                                                                        )}
                                                                    </li>
                                                                )
                                                            )}
                                                        </ul>
                                                    ) : null}
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </section>
                        );
                    }

                    if (
                        sectionKey === "projects" &&
                        Array.isArray(sectionValue)
                    ) {
                        return (
                            <ProjectsSection
                                key={sectionKey}
                                projects={sectionValue}
                                label={getLabel("projects")}
                            />
                        );
                    }

                    if (
                        sectionKey === "skills" &&
                        Array.isArray(sectionValue)
                    ) {
                        return (
                            <SkillsSection
                                key={sectionKey}
                                skills={resume.skills?.entries ?? []}
                                works={resume.work?.entries ?? []}
                                projects={resume.projects?.entries ?? []}
                                defaultView={
                                    (resume.skills?.defaultView ??
                                        "by-job-field") as any
                                }
                            />
                        );
                    }

                    if (
                        sectionKey === "education" &&
                        Array.isArray(sectionValue)
                    ) {
                        return (
                            <section
                                key={sectionKey}
                                className="mb-10"
                                data-pdf-block
                            >
                                <h2 className="mb-5 border-b border-(--color-border) pb-1.5 text-xl font-bold tracking-widest text-(--color-accent) uppercase">
                                    {getLabel("education")}
                                </h2>
                                <div>
                                    {sectionValue.map((education, idx) => (
                                        <div
                                            key={idx}
                                            className="mb-3 rounded-lg border border-(--color-border) bg-(--color-surface-subtle) px-4.5 py-3.5 last:mb-0"
                                            data-pdf-block
                                        >
                                            {education.institution ? (
                                                <h3 className="m-0 mb-0.5 text-lg font-bold text-(--color-foreground)">
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
                                                </h3>
                                            ) : null}
                                            {(education.studyType ||
                                                education.area) && (
                                                <div className="mb-0.5 text-base text-(--color-foreground)">
                                                    {`${education.studyType || ""} ${education.area ? " " + education.area : ""}`}
                                                </div>
                                            )}
                                            {(education.startDate ||
                                                education.endDate) && (
                                                <div
                                                    className="mb-1 text-sm text-(--color-muted)"
                                                    style={{
                                                        fontVariantNumeric:
                                                            "tabular-nums",
                                                    }}
                                                >
                                                    {formatDateRange(
                                                        education.startDate,
                                                        education.endDate
                                                    )}
                                                </div>
                                            )}
                                            {education.gpa != null ? (
                                                <div className="mb-1 text-sm text-(--color-muted)">
                                                    GPA:{" "}
                                                    {education.gpa.toFixed(2)} /{" "}
                                                    {(
                                                        education.gpaMax ?? 4.5
                                                    ).toFixed(2)}
                                                </div>
                                            ) : education.score ? (
                                                <div className="mb-1 text-sm text-(--color-muted)">
                                                    GPA: {education.score}
                                                </div>
                                            ) : null}
                                            {education.courses &&
                                            education.courses.length > 0 ? (
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {education.courses.map(
                                                        (
                                                            course: string,
                                                            cIdx: number
                                                        ) => (
                                                            <span
                                                                key={cIdx}
                                                                className="inline-block rounded bg-(--color-tag-bg) px-[0.55em] py-[0.15em] text-sm leading-normal font-medium text-(--color-tag-fg)"
                                                            >
                                                                {course}
                                                            </span>
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
                        Array.isArray(sectionValue) &&
                        sectionValue.length > 0
                    ) {
                        const sectionTitle = getLabel(sectionKey);
                        return (
                            <section
                                key={sectionKey}
                                className="mb-10"
                                data-pdf-block
                            >
                                <h2 className="mb-5 border-b border-(--color-border) pb-1.5 text-xl font-bold tracking-widest text-(--color-accent) uppercase">
                                    {sectionTitle}
                                </h2>
                                <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
                                    {sectionValue.map(
                                        (genericItem: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className="rounded-lg border border-(--color-border) bg-(--color-surface-subtle) px-4 py-3"
                                            >
                                                {genericItem.name ||
                                                genericItem.title ||
                                                genericItem.organization ||
                                                genericItem.language ? (
                                                    <h3 className="m-0 mb-0.5 text-lg font-bold text-(--color-foreground)">
                                                        {genericItem.name ||
                                                            genericItem.title ||
                                                            genericItem.organization ||
                                                            genericItem.language}
                                                    </h3>
                                                ) : null}
                                                {genericItem.position ||
                                                genericItem.awarder ||
                                                genericItem.issuer ||
                                                genericItem.publisher ||
                                                genericItem.fluency ? (
                                                    <div className="mb-0.5 text-base text-(--color-muted)">
                                                        {genericItem.position ||
                                                            genericItem.awarder ||
                                                            genericItem.issuer ||
                                                            genericItem.publisher ||
                                                            genericItem.fluency}
                                                    </div>
                                                ) : null}
                                                {genericItem.startDate ||
                                                genericItem.date ||
                                                genericItem.releaseDate ? (
                                                    <div
                                                        className="mb-1 text-sm text-(--color-muted)"
                                                        style={{
                                                            fontVariantNumeric:
                                                                "tabular-nums",
                                                        }}
                                                    >
                                                        {`${genericItem.startDate || genericItem.date || genericItem.releaseDate || ""}${genericItem.endDate ? " ~ " + genericItem.endDate : ""}`}
                                                    </div>
                                                ) : null}
                                                {genericItem.summary ||
                                                genericItem.description ? (
                                                    <p className="text-base text-(--color-foreground)">
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
                                                    <ul className="pl-2 text-base text-(--color-foreground)">
                                                        {genericItem.highlights.map(
                                                            (
                                                                highlight: string,
                                                                hIdx: number
                                                            ) => (
                                                                <li key={hIdx}>
                                                                    {`• ${highlight}`}
                                                                </li>
                                                            )
                                                        )}
                                                    </ul>
                                                ) : null}
                                                {genericItem.keywords &&
                                                Array.isArray(
                                                    genericItem.keywords
                                                ) &&
                                                genericItem.keywords.length >
                                                    0 ? (
                                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                                        {genericItem.keywords.map(
                                                            (
                                                                keyword: string,
                                                                kIdx: number
                                                            ) => (
                                                                <span
                                                                    key={kIdx}
                                                                    className="inline-block rounded bg-(--color-tag-bg) px-[0.55em] py-[0.15em] text-sm leading-normal font-medium text-(--color-tag-fg)"
                                                                >
                                                                    {keyword}
                                                                </span>
                                                            )
                                                        )}
                                                    </div>
                                                ) : null}
                                                {genericItem.url ? (
                                                    <a
                                                        href={genericItem.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-base break-all text-(--color-link) no-underline hover:text-(--color-link) hover:underline hover:opacity-80"
                                                    >
                                                        {genericItem.url}
                                                    </a>
                                                ) : null}
                                                {genericItem.reference ? (
                                                    <p>
                                                        {genericItem.reference}
                                                    </p>
                                                ) : null}
                                            </div>
                                        )
                                    )}
                                </div>
                            </section>
                        );
                    }

                    return null;
                })}
            </main>
        </div>
    );
}
