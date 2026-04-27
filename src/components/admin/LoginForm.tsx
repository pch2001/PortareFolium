"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import type { getAdminCredentialSetup } from "@/lib/admin-credentials";
import { getSafeAdminReturnUrl } from "@/lib/admin-return-url";

const ENV_DESCRIPTIONS: Record<string, { purpose: string; setup: string }> = {
    AUTH_ADMIN_EMAIL: {
        purpose: "관리자 로그인에 사용할 이메일",
        setup: "Vercel 또는 .env.local에 실제 관리자 이메일 1개 입력",
    },
    AUTH_ADMIN_PASSWORD_HASH: {
        purpose: "관리자 비밀번호를 평문 대신 저장하는 scrypt hash",
        setup: "아래쪽 비밀번호 입력칸에 원하는 비밀번호를 입력한 뒤 갱신된 명령 출력값을 env에 입력",
    },
    AUTH_SECRET: {
        purpose: "로그인 세션과 쿠키 암호화에 쓰는 secret",
        setup: "충분히 긴 랜덤 문자열을 생성해 env에 입력",
    },
};

const PASSWORD_PLACEHOLDER = "YOUR_PASSWORD";

const COMMANDS = {
    AUTH_SECRET:
        "node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
} as const;

type PasswordRequirement = {
    id: string;
    label: string;
    isMet: (value: string) => boolean;
};

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
    {
        id: "length",
        label: "12자 이상",
        isMet: (value) => value.length >= 12,
    },
    {
        id: "lowercase",
        label: "영문 소문자 1개 이상",
        isMet: (value) => /[a-z]/.test(value),
    },
    {
        id: "uppercase",
        label: "영문 대문자 1개 이상",
        isMet: (value) => /[A-Z]/.test(value),
    },
    {
        id: "number",
        label: "숫자 1개 이상",
        isMet: (value) => /[0-9]/.test(value),
    },
    {
        id: "special",
        label: "특수문자 1개 이상",
        isMet: (value) => /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(value),
    },
    {
        id: "ascii",
        label: "영문, 숫자, ASCII 특수문자만 사용",
        isMet: (value) =>
            value.length > 0 &&
            /^[A-Za-z0-9!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]+$/.test(value),
    },
];

function blockManualCommandCopy(event: React.SyntheticEvent): void {
    event.preventDefault();
}

function encodeBase64Utf8(value: string): string {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary);
}

function getPasswordHashCommand(password: string): string {
    if (!password) {
        return `node -e "const { randomBytes, scryptSync } = require('crypto'); const password = '${PASSWORD_PLACEHOLDER}'; const salt = randomBytes(16).toString('hex'); const hash = scryptSync(password, salt, 64).toString('hex'); console.log(['scrypt', salt, hash].join(String.fromCharCode(36)))"`;
    }

    const encodedPassword = encodeBase64Utf8(password);
    return `node -e "const { randomBytes, scryptSync } = require('crypto'); const password = Buffer.from('${encodedPassword}', 'base64').toString('utf8'); const salt = randomBytes(16).toString('hex'); const hash = scryptSync(password, salt, 64).toString('hex'); console.log(['scrypt', salt, hash].join(String.fromCharCode(36)))"`;
}

export default function LoginForm({
    siteName = "",
    returnUrl,
    setupState,
    showDetailedSetupGuide = true,
}: {
    siteName?: string;
    returnUrl?: string;
    setupState: ReturnType<typeof getAdminCredentialSetup>;
    showDetailedSetupGuide?: boolean;
}) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
    const { data: session, status } = useSession();
    const invalidEnvKeys = setupState.invalidEnvKeys ?? [];
    const setupReady =
        setupState.missingEnvKeys.length === 0 && invalidEnvKeys.length === 0;
    const safeReturnUrl = getSafeAdminReturnUrl(returnUrl);
    const passwordHashCommand = getPasswordHashCommand(password);
    const passwordRequirementStates = PASSWORD_REQUIREMENTS.map(
        (requirement) => ({
            ...requirement,
            met: requirement.isMet(password),
        })
    );
    const setupPasswordReady =
        password.length > 0 &&
        passwordRequirementStates.every((requirement) => requirement.met);
    const setupIssues = [
        ...setupState.missingEnvKeys.map((key) => ({
            key,
            status: "누락",
            reason: "값이 설정되지 않았습니다.",
        })),
        ...invalidEnvKeys.map((issue) => ({
            key: issue.key,
            status: "수정 필요",
            reason: issue.reason,
        })),
    ];

    // 이미 로그인된 유저 → 랜딩 페이지로 리다이렉트
    useEffect(() => {
        if (status !== "authenticated" || !session?.user?.isAdmin) return;
        window.location.href = safeReturnUrl;
    }, [safeReturnUrl, session, status]);

    // admin credentials 로그인
    const handleAdminSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!setupReady) {
            setError("관리자 로그인 환경변수가 설정되지 않았습니다.");
            return;
        }

        setLoading(true);
        setError(null);
        const result = await signIn("admin-credentials", {
            email,
            password,
            redirect: false,
            callbackUrl: safeReturnUrl,
        });
        if (result?.error) {
            setError("관리자 계정 로그인에 실패했습니다.");
            setLoading(false);
            return;
        }
        window.location.href = safeReturnUrl;
    };

    // 명령 clipboard 복사
    const handleCopyCommand = async (
        key: keyof typeof COMMANDS | "AUTH_ADMIN_PASSWORD_HASH"
    ) => {
        try {
            await navigator.clipboard.writeText(
                key === "AUTH_ADMIN_PASSWORD_HASH"
                    ? passwordHashCommand
                    : COMMANDS[key]
            );
            setCopiedCommand(key);
        } catch {
            setError("명령 복사에 실패했습니다.");
        }
    };

    const handlePasswordChange = (value: string) => {
        setPassword(value);
        if (copiedCommand === "AUTH_ADMIN_PASSWORD_HASH") {
            setCopiedCommand(null);
        }
    };

    return (
        <div className="tablet:items-center tablet:py-12 relative flex min-h-screen items-start justify-center bg-(--color-surface) px-4 py-8">
            {/* 배경 글로우 */}
            <div
                aria-hidden="true"
                className="tablet:h-96 tablet:w-96 pointer-events-none absolute top-1/3 left-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--color-accent) opacity-[0.08] blur-3xl"
            />

            <div className="relative w-full max-w-sm">
                {/* 워드마크 */}
                <div className="mb-10 flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span
                            className="h-2.5 w-2.5 rounded-full bg-(--color-accent)"
                            aria-hidden="true"
                        />
                        <span className="text-lg font-black tracking-tight text-(--color-foreground)">
                            {siteName}
                        </span>
                    </div>
                    <h1 className="text-3xl font-(--font-display) font-black tracking-tight text-(--color-foreground)">
                        Admin 로그인
                    </h1>
                    <p className="text-sm text-(--color-muted)">
                        관리자 계정으로 로그인하세요
                    </p>
                </div>

                {/* 로그인 카드 */}
                <div className="rounded-2xl border border-(--color-border) bg-(--color-surface-subtle) p-7 shadow-sm ring-1 ring-(--color-border)/40">
                    <div className="space-y-5">
                        <p className="text-sm text-(--color-muted)">
                            email/password 기반 관리자 로그인
                        </p>
                        {/* 에러 메시지 */}
                        {error && (
                            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                                {error}
                            </p>
                        )}

                        {!setupReady && (
                            <div className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                                <p className="font-semibold">
                                    관리자 로그인 설정 필요
                                </p>
                                <p>
                                    이 사이트는 아래 env가 있어야 관리자
                                    로그인을 사용할 수 있습니다.
                                </p>
                                <ul className="space-y-2 text-xs">
                                    {setupIssues.map((issue) => (
                                        <li
                                            key={`${issue.key}-${issue.status}`}
                                            className="rounded-lg border border-amber-200 bg-white/70 px-3 py-2 dark:border-amber-800 dark:bg-black/10"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="font-mono font-semibold">
                                                    {issue.key}
                                                </p>
                                                <span className="rounded-full border border-amber-300 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:border-amber-700 dark:text-amber-200">
                                                    {issue.status}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-[11px] text-amber-800/90 dark:text-amber-200/90">
                                                용도:{" "}
                                                {ENV_DESCRIPTIONS[issue.key]
                                                    ?.purpose ??
                                                    "관리자 로그인에 필요한 환경변수"}
                                            </p>
                                            <p className="mt-1 text-[11px] text-amber-800/90 dark:text-amber-200/90">
                                                설정:{" "}
                                                {ENV_DESCRIPTIONS[issue.key]
                                                    ?.setup ??
                                                    "환경변수에 값을 추가"}
                                            </p>
                                            <p className="mt-1 text-[11px] font-medium text-amber-900 dark:text-amber-100">
                                                문제: {issue.reason}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                                {showDetailedSetupGuide && (
                                    <>
                                        <div className="space-y-2 rounded-lg border border-amber-200 bg-white/70 px-3 py-3 text-xs dark:border-amber-800 dark:bg-black/10">
                                            <p className="font-semibold">
                                                원하는 로그인 비밀번호 설정 방법
                                            </p>
                                            <ol className="list-decimal space-y-1 pl-4 text-amber-800/90 dark:text-amber-200/90">
                                                <li>
                                                    먼저 실제로 로그인할
                                                    비밀번호를 정합니다.
                                                </li>
                                                <li>
                                                    아래쪽 비밀번호 입력칸에
                                                    원하는 비밀번호를 입력하면{" "}
                                                    <span className="font-mono font-semibold">
                                                        AUTH_ADMIN_PASSWORD_HASH
                                                    </span>{" "}
                                                    명령이 자동으로 바뀝니다.
                                                </li>
                                                <li>
                                                    출력된{" "}
                                                    <span className="font-mono font-semibold">
                                                        scrypt$...
                                                    </span>{" "}
                                                    전체 문자열을 Vercel의{" "}
                                                    <span className="font-mono font-semibold">
                                                        AUTH_ADMIN_PASSWORD_HASH
                                                    </span>
                                                    에 저장합니다.
                                                </li>
                                            </ol>
                                            <p className="text-amber-900 dark:text-amber-100">
                                                예: 비밀번호를{" "}
                                                <span className="font-mono font-semibold">
                                                    password123
                                                </span>
                                                으로 정했다면 비밀번호 입력칸에
                                                그대로 입력하세요. 단, 실제
                                                운영에는 더 길고 추측하기 어려운
                                                비밀번호를 사용하세요.
                                            </p>
                                            <p className="text-amber-900 dark:text-amber-100">
                                                env에는 원래 비밀번호를 저장하지
                                                않습니다. 로그인할 때만 원래
                                                비밀번호를 입력합니다.
                                            </p>
                                        </div>
                                        <div className="space-y-1 text-xs">
                                            <p className="font-semibold">
                                                `AUTH_ADMIN_PASSWORD_HASH` 생성
                                                명령
                                            </p>
                                            <div className="space-y-2">
                                                <div className="grid gap-1 rounded-lg border border-amber-200 bg-white/70 px-3 py-2 text-[11px] dark:border-amber-800 dark:bg-black/10">
                                                    <p className="font-semibold text-amber-900 dark:text-amber-100">
                                                        비밀번호 규칙
                                                    </p>
                                                    <ul className="grid gap-1">
                                                        {passwordRequirementStates.map(
                                                            (requirement) => (
                                                                <li
                                                                    key={
                                                                        requirement.id
                                                                    }
                                                                    className="flex items-center gap-2"
                                                                >
                                                                    <span
                                                                        aria-hidden="true"
                                                                        className={
                                                                            requirement.met
                                                                                ? "text-green-700 dark:text-green-300"
                                                                                : "text-amber-700 dark:text-amber-300"
                                                                        }
                                                                    >
                                                                        {requirement.met
                                                                            ? "✓"
                                                                            : "•"}
                                                                    </span>
                                                                    <span
                                                                        className={
                                                                            requirement.met
                                                                                ? "text-green-800 dark:text-green-200"
                                                                                : "text-amber-800/90 dark:text-amber-200/90"
                                                                        }
                                                                    >
                                                                        {
                                                                            requirement.label
                                                                        }
                                                                    </span>
                                                                </li>
                                                            )
                                                        )}
                                                    </ul>
                                                </div>
                                                <code
                                                    data-testid="password-hash-command"
                                                    draggable={false}
                                                    onCopy={
                                                        blockManualCommandCopy
                                                    }
                                                    onCut={
                                                        blockManualCommandCopy
                                                    }
                                                    onDragStart={
                                                        blockManualCommandCopy
                                                    }
                                                    onMouseDown={
                                                        blockManualCommandCopy
                                                    }
                                                    className="block overflow-x-auto rounded-lg bg-black/80 px-3 py-2 text-[11px] text-white select-none"
                                                >
                                                    {passwordHashCommand}
                                                </code>
                                                <p className="text-[11px] text-amber-800/90 dark:text-amber-200/90">
                                                    {setupPasswordReady
                                                        ? "현재 명령은 유효한 비밀번호 입력값으로 생성됩니다."
                                                        : password
                                                          ? "비밀번호 규칙을 모두 만족해야 이 명령을 복사할 수 있습니다."
                                                          : `비밀번호 입력칸이 비어 있으면 명령에는 ${PASSWORD_PLACEHOLDER} 예시값이 표시됩니다.`}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void handleCopyCommand(
                                                            "AUTH_ADMIN_PASSWORD_HASH"
                                                        )
                                                    }
                                                    disabled={
                                                        !setupPasswordReady ||
                                                        copiedCommand ===
                                                            "AUTH_ADMIN_PASSWORD_HASH"
                                                    }
                                                    className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-(--color-accent) px-3 py-2 text-[11px] font-semibold whitespace-nowrap text-(--color-on-accent) transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {copiedCommand ===
                                                    "AUTH_ADMIN_PASSWORD_HASH" ? (
                                                        <>
                                                            <svg
                                                                className="h-3.5 w-3.5"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                            >
                                                                <path
                                                                    d="M20 6L9 17l-5-5"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                />
                                                            </svg>
                                                            복사됨
                                                        </>
                                                    ) : !setupPasswordReady ? (
                                                        "비밀번호 규칙 확인 필요"
                                                    ) : (
                                                        "복사"
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-1 text-xs">
                                            <p className="font-semibold">
                                                `AUTH_SECRET` 생성 명령
                                            </p>
                                            <div className="space-y-2">
                                                <code
                                                    data-testid="auth-secret-command"
                                                    draggable={false}
                                                    onCopy={
                                                        blockManualCommandCopy
                                                    }
                                                    onCut={
                                                        blockManualCommandCopy
                                                    }
                                                    onDragStart={
                                                        blockManualCommandCopy
                                                    }
                                                    onMouseDown={
                                                        blockManualCommandCopy
                                                    }
                                                    className="block overflow-x-auto rounded-lg bg-black/80 px-3 py-2 text-[11px] text-white select-none"
                                                >
                                                    {COMMANDS.AUTH_SECRET}
                                                </code>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void handleCopyCommand(
                                                            "AUTH_SECRET"
                                                        )
                                                    }
                                                    disabled={
                                                        copiedCommand ===
                                                        "AUTH_SECRET"
                                                    }
                                                    className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-(--color-accent) px-3 py-2 text-[11px] font-semibold whitespace-nowrap text-(--color-on-accent) transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-100"
                                                >
                                                    {copiedCommand ===
                                                    "AUTH_SECRET" ? (
                                                        <>
                                                            <svg
                                                                className="h-3.5 w-3.5"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                            >
                                                                <path
                                                                    d="M20 6L9 17l-5-5"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                />
                                                            </svg>
                                                            복사됨
                                                        </>
                                                    ) : (
                                                        "복사"
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                                <p className="text-xs">
                                    Vercel 사용 시 Project Settings →
                                    Environment Variables에 값을 추가 후 재배포
                                </p>
                                <p className="text-xs">
                                    로컬 개발 시 프로젝트 루트의 `.env.local`
                                    파일에 같은 값을 추가
                                </p>
                            </div>
                        )}

                        <form
                            onSubmit={handleAdminSubmit}
                            className="space-y-4 rounded-xl border border-(--color-border) bg-(--color-surface) p-4"
                        >
                            <p className="text-sm font-semibold text-(--color-foreground)">
                                관리자 로그인
                            </p>
                            {/* 스크린리더용 숨김 레이블 */}
                            <label htmlFor="admin-email" className="sr-only">
                                이메일
                            </label>
                            <input
                                id="admin-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@example.com"
                                autoComplete="email"
                                className="w-full rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-3 text-sm text-(--color-foreground) transition-colors focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent)/30 focus:outline-none"
                            />
                            <label htmlFor="admin-password" className="sr-only">
                                비밀번호
                            </label>
                            <input
                                id="admin-password"
                                type={setupReady ? "password" : "text"}
                                value={password}
                                onChange={(e) =>
                                    handlePasswordChange(e.target.value)
                                }
                                placeholder={
                                    setupReady
                                        ? "••••••••"
                                        : "원하는 관리자 비밀번호 입력"
                                }
                                autoComplete={
                                    setupReady
                                        ? "current-password"
                                        : "new-password"
                                }
                                className="w-full rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-3 text-sm text-(--color-foreground) transition-colors focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent)/30 focus:outline-none"
                            />
                            <button
                                type="submit"
                                disabled={loading || !setupReady}
                                className="w-full rounded-2xl bg-(--color-accent) py-3 text-sm font-bold text-(--color-on-accent) transition-all hover:-translate-y-0.5 hover:opacity-90 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading ? "로그인 중..." : "로그인"}
                            </button>
                        </form>
                    </div>
                </div>

                {/* 홈으로 돌아가기 */}
                <p className="mt-6 text-center">
                    <a
                        href="/"
                        className="inline-flex items-center gap-1.5 text-sm text-(--color-muted) transition-colors hover:text-(--color-foreground)"
                    >
                        <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                        사이트로 돌아가기
                    </a>
                </p>
            </div>
        </div>
    );
}
