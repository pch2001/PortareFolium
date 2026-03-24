"use client";

// 포트폴리오 타임라인 리스트 뷰
// - 좌측 타임라인 선 + 닷 구조
// - 썸네일 float-right: 제목·날짜·설명·메타 정보가 이미지를 감싸는 레이아웃
// - 전체 카드 클릭 → 상세 페이지 (stretched link)
// - GitHub 버튼은 z-10으로 독립 동작
import type { PortfolioProject } from "@/types/portfolio";

interface Props {
    projects: PortfolioProject[];
}

export default function PortfolioView({ projects }: Props) {
    return (
        <div className="relative space-y-0">
            {/* 타임라인 세로선 */}
            <div
                className="absolute top-0 bottom-0 left-0 w-px bg-(--color-border)"
                aria-hidden="true"
            />

            {projects.map((project, index) => (
                <article
                    key={project.slug}
                    className="relative pb-10 pl-8 last:pb-0"
                >
                    {/* 타임라인 닷 */}
                    <div
                        className="absolute top-7 left-0 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-(--color-accent) bg-(--color-surface)"
                        aria-hidden="true"
                    />

                    <div className="card-lift group relative overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface-subtle) transition-colors hover:border-(--color-accent)">
                        {/* stretched link */}
                        <a
                            href={`/portfolio/${project.slug}`}
                            className="absolute inset-0 z-0"
                            aria-label={project.title}
                        />

                        {/* 카드 본문 */}
                        <div className="tablet:p-6 overflow-hidden p-5">
                            {/* 썸네일 float-right */}
                            {project.thumbnail ? (
                                <div className="tablet:w-80 float-right mb-4 ml-5 w-48 overflow-hidden rounded-xl">
                                    <div className="aspect-video">
                                        <img
                                            src={project.thumbnail}
                                            alt=""
                                            width={320}
                                            height={180}
                                            loading={
                                                index < 2 ? "eager" : "lazy"
                                            }
                                            decoding="async"
                                            fetchPriority={
                                                index < 2 ? "high" : undefined
                                            }
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                                        />
                                    </div>
                                </div>
                            ) : null}

                            {/* 날짜 + GitHub */}
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                <p className="text-xs font-semibold tracking-wider text-(--color-muted) uppercase tabular-nums">
                                    {project.startDate}
                                    {project.endDate
                                        ? ` — ${project.endDate}`
                                        : ""}
                                </p>
                                {project.github ? (
                                    <a
                                        href={project.github}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="relative z-10 inline-flex shrink-0 items-center gap-1.5 rounded-full border border-(--color-border) px-3 py-1 text-xs font-medium text-(--color-foreground) transition-colors hover:border-(--color-accent) hover:text-(--color-accent)"
                                        onClick={(e) => e.stopPropagation()}
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
                                                strokeWidth={2}
                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                            />
                                        </svg>
                                    </a>
                                ) : null}
                            </div>

                            {/* 제목 */}
                            <h2 className="tablet:text-2xl mb-3 text-xl font-bold text-(--color-foreground) transition-colors group-hover:text-(--color-accent)">
                                {project.title}
                            </h2>

                            {/* 뱃지 */}
                            {project.badges && project.badges.length > 0 ? (
                                <div className="mb-3 flex flex-wrap gap-1.5">
                                    {project.badges.map((b, i) => (
                                        <span
                                            key={i}
                                            className="rounded-full bg-(--color-accent) px-2.5 py-0.5 text-xs font-semibold text-white"
                                        >
                                            {b.text}
                                        </span>
                                    ))}
                                </div>
                            ) : null}

                            {/* 역할 + 참여 인원 (2열 그리드) */}
                            {project.role || project.teamSize ? (
                                <div className="mb-3 grid grid-cols-2 gap-x-6 gap-y-3">
                                    {project.role ? (
                                        <div>
                                            <p className="mb-0.5 flex items-center gap-1 text-sm font-bold tracking-widest text-(--color-accent) uppercase">
                                                <span
                                                    className="h-2 w-2 shrink-0 rounded-full bg-(--color-accent)"
                                                    aria-hidden="true"
                                                />
                                                역할
                                            </p>
                                            <p className="text-sm text-(--color-foreground)">
                                                {project.role}
                                            </p>
                                        </div>
                                    ) : null}
                                    {project.teamSize ? (
                                        <div>
                                            <p className="mb-0.5 flex items-center gap-1 text-sm font-bold tracking-widest text-(--color-accent) uppercase">
                                                <span
                                                    className="h-2 w-2 shrink-0 rounded-full bg-(--color-accent)"
                                                    aria-hidden="true"
                                                />
                                                참여 인원
                                            </p>
                                            <p className="text-sm text-(--color-foreground)">
                                                {project.teamSize}명
                                            </p>
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}

                            {/* 목표 (풀 너비) */}
                            {project.goal ? (
                                <div className="mb-3">
                                    <p className="mb-0.5 flex items-center gap-1 text-sm font-bold tracking-widest text-(--color-accent) uppercase">
                                        <span
                                            className="h-2 w-2 shrink-0 rounded-full bg-(--color-accent)"
                                            aria-hidden="true"
                                        />
                                        목표
                                    </p>
                                    <p className="text-sm text-(--color-foreground)">
                                        {project.goal}
                                    </p>
                                </div>
                            ) : null}

                            {/* 설명 2줄 clamp */}
                            {project.description ? (
                                <p className="mb-3 line-clamp-2 text-sm text-(--color-muted)">
                                    {project.description}
                                </p>
                            ) : null}

                            {/* 태그 */}
                            {project.keywords.length > 0 ? (
                                <div className="mb-4 flex flex-wrap gap-1.5">
                                    {project.keywords.map((k, i) => (
                                        <span
                                            key={i}
                                            className="rounded-full bg-(--color-tag-bg) px-3 py-1 text-xs font-medium text-(--color-tag-fg)"
                                        >
                                            {k}
                                        </span>
                                    ))}
                                </div>
                            ) : null}

                            {/* float 해제 */}
                            <div className="clear-both" />

                            {/* 성과 (float 아래) */}
                            {project.accomplishments.length > 0 && (
                                <div className="mt-2">
                                    <p className="mb-2 flex items-center gap-1 text-sm font-bold tracking-widest text-(--color-accent) uppercase">
                                        <span
                                            className="h-2 w-2 shrink-0 rounded-full bg-(--color-accent)"
                                            aria-hidden="true"
                                        />
                                        성과
                                    </p>
                                    <ul className="tablet:grid-cols-2 grid grid-cols-1 gap-1.5">
                                        {project.accomplishments.map((a, i) => (
                                            <li
                                                key={i}
                                                className="flex items-start gap-2 text-sm text-(--color-foreground)"
                                            >
                                                <span
                                                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-(--color-accent)"
                                                    aria-hidden="true"
                                                />
                                                {a}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </article>
            ))}
        </div>
    );
}
