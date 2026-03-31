import Link from "next/link";

interface ValuePillar {
    label: string;
    sub: string;
    description: string;
}

interface CoreCompetency {
    title: string;
    description: string;
}

interface Props {
    heroName: string;
    heroDesc: string;
    descriptionSub?: string;
    profileImage?: string;
    valuePillars: ValuePillar[];
    coreCompetencies: CoreCompetency[];
}

// 터미널 배지
function TerminalBadge() {
    return (
        <div className="inline-flex items-center gap-3 rounded-lg border border-(--color-border) bg-(--color-surface-subtle) px-4 py-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-(--color-accent)" />
            <span className="font-mono text-sm text-(--color-muted)">
                <span className="text-(--color-accent)">$</span> career
                <span className="text-(--color-foreground)">.transition</span>(
                <span className="text-(--color-accent)">&quot;web&quot;</span>,{" "}
                <span className="text-(--color-accent)">&quot;game&quot;</span>)
            </span>
        </div>
    );
}

// 스탯 카드
function StatsCard({ className }: { className?: string }) {
    return (
        <div
            className={`rounded-xl border border-(--color-border) bg-(--color-surface-subtle) px-6 py-5 ${className ?? ""}`}
        >
            <p className="mb-4 font-mono text-xs font-bold tracking-widest text-(--color-accent) uppercase">
                // Stats
            </p>
            <div className="space-y-4">
                {[
                    { label: "경력", value: "2+ Years" },
                    { label: "프로젝트", value: "6+" },
                    { label: "모드 다운로드", value: "8,000+" },
                ].map((stat, idx) => (
                    <div
                        key={idx}
                        className="flex items-center justify-between"
                    >
                        <span className="text-sm text-(--color-muted)">
                            {stat.label}
                        </span>
                        <span className="font-mono text-lg font-black text-(--color-accent)">
                            {stat.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function LandingHero({
    heroName,
    heroDesc,
    descriptionSub,
    profileImage,
    valuePillars,
}: Props) {
    return (
        <section className="tablet:py-32 relative mx-auto max-w-5xl py-24">
            {/* 이중 glow */}
            <div
                aria-hidden="true"
                className="tablet:h-[30rem] tablet:w-[30rem] pointer-events-none absolute top-1/4 left-1/4 -z-10 h-64 w-64 rounded-full bg-(--color-accent) opacity-[0.10] blur-3xl"
            />
            <div
                aria-hidden="true"
                className="tablet:h-[20rem] tablet:w-[20rem] pointer-events-none absolute right-0 bottom-1/4 -z-10 h-48 w-48 rounded-full bg-(--color-accent) opacity-[0.08] blur-3xl"
            />

            <div className="tablet:flex-row tablet:items-start tablet:gap-16 flex flex-col gap-12">
                {/* 왼쪽: 텍스트 + CTA */}
                <div className="tablet:w-3/5 tablet:text-left text-center">
                    <div className="animate-fade-in mb-6">
                        <TerminalBadge />
                    </div>

                    <h1 className="animate-fade-in-up stagger-1 tablet:text-8xl mb-3 text-5xl leading-[1.0] font-black tracking-tighter text-(--color-foreground)">
                        {heroName}
                    </h1>

                    <p className="animate-fade-in-up stagger-2 tablet:text-4xl mb-6 text-2xl font-bold text-(--color-foreground)">
                        {heroDesc}
                    </p>

                    {descriptionSub && (
                        <p className="animate-fade-in-up stagger-2 tablet:text-xl mb-8 max-w-xl text-lg leading-relaxed text-(--color-muted)">
                            {descriptionSub}
                        </p>
                    )}

                    <div className="animate-fade-in-up stagger-3">
                        <div className="tablet:justify-start flex flex-wrap justify-center gap-4">
                            <Link
                                href="/portfolio"
                                className="rounded-full bg-(--color-accent) px-8 py-4 text-base font-semibold text-(--color-on-accent) transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90"
                            >
                                Portfolio 보기
                            </Link>
                            <Link
                                href="/resume"
                                className="rounded-full border-2 border-(--color-border) px-8 py-4 text-base font-semibold text-(--color-foreground) transition-all duration-200 hover:-translate-y-0.5 hover:border-(--color-accent) hover:text-(--color-accent)"
                            >
                                Resume 보기
                            </Link>
                        </div>
                    </div>
                </div>

                {/* 오른쪽: 프로필 + 스탯 */}
                <div className="tablet:sticky tablet:top-24 tablet:w-2/5 flex flex-col items-center gap-8">
                    {profileImage && (
                        <div className="animate-fade-in relative">
                            <div className="absolute -inset-3 rounded-3xl bg-(--color-accent) opacity-[0.08] blur-xl" />
                            <img
                                src={profileImage}
                                alt=""
                                width={280}
                                height={280}
                                className="tablet:h-72 tablet:w-72 relative h-60 w-60 rounded-2xl object-cover grayscale-[15%] transition-all hover:grayscale-0"
                                loading="eager"
                            />
                        </div>
                    )}
                    <StatsCard className="animate-fade-in-up stagger-3 w-full max-w-xs" />
                </div>
            </div>

            {/* 콘솔 pillars full-width */}
            <div className="animate-fade-in-up stagger-4 mt-12 w-full overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface-subtle)">
                <div className="flex items-center gap-2 border-b border-(--color-border) px-4 py-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
                    <span className="ml-2 font-mono text-xs text-(--color-muted)">
                        core_values.ts
                    </span>
                </div>
                <div className="divide-y divide-(--color-border)">
                    {valuePillars.map((pillar, idx) => (
                        <div key={idx} className="px-5 py-4">
                            <div className="flex items-baseline gap-2">
                                <span className="font-mono text-xs text-(--color-accent)">
                                    0{idx + 1}
                                </span>
                                <p className="text-base font-bold text-(--color-foreground)">
                                    {pillar.label}
                                </p>
                                <span className="text-xs text-(--color-muted)">
                                    // {pillar.sub}
                                </span>
                            </div>
                            <p className="mt-1 pl-7 text-sm leading-relaxed text-(--color-muted)">
                                {pillar.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* 스크롤 인디케이터 */}
            <div className="mt-16 flex justify-center">
                <div className="flex flex-col items-center gap-1.5 text-(--color-muted)">
                    <span className="text-[10px] font-semibold tracking-[0.2em] uppercase">
                        Scroll
                    </span>
                    <svg
                        className="h-4 w-4 animate-bounce"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </div>
            </div>
        </section>
    );
}
