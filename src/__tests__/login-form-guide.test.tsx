import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LoginForm from "@/components/admin/LoginForm";

const nextAuthMock = vi.hoisted(() => ({
    signIn: vi.fn(),
    useSession: vi.fn(() => ({ status: "unauthenticated", data: null })),
}));

vi.mock("next-auth/react", () => ({
    signIn: nextAuthMock.signIn,
    useSession: nextAuthMock.useSession,
}));

describe("login form env guide", () => {
    beforeEach(() => {
        Object.assign(globalThis, {
            navigator: {
                clipboard: {
                    writeText: vi.fn().mockResolvedValue(undefined),
                },
            },
        });
        nextAuthMock.signIn.mockClear();
        nextAuthMock.useSession.mockClear();
    });

    it("누락 env 안내와 full width 복사 버튼을 표시", async () => {
        render(
            <LoginForm
                siteName="PortareFolium"
                showDetailedSetupGuide
                setupState={{
                    missingEnvKeys: [
                        "AUTH_ADMIN_EMAIL",
                        "AUTH_ADMIN_PASSWORD_HASH",
                        "AUTH_SECRET",
                    ],
                    invalidEnvKeys: [],
                }}
            />
        );

        expect(
            screen.getByText(/관리자 로그인 설정 필요/i)
        ).toBeInTheDocument();
        expect(screen.getAllByText("누락")).toHaveLength(3);
        expect(
            screen.getByText(/용도:\s*관리자 로그인에 사용할 이메일/i)
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                /용도:\s*관리자 비밀번호를 평문 대신 저장하는 scrypt hash/i
            )
        ).toBeInTheDocument();
        expect(
            screen.getByText(/용도:\s*로그인 세션과 쿠키 암호화에 쓰는 secret/i)
        ).toBeInTheDocument();
        expect(
            screen.getByText(/`AUTH_ADMIN_PASSWORD_HASH` 생성 명령/i)
        ).toBeInTheDocument();
        expect(
            screen.getByText(/`AUTH_SECRET` 생성 명령/i)
        ).toBeInTheDocument();
        expect(
            screen.getByText(/원하는 로그인 비밀번호 설정 방법/i)
        ).toBeInTheDocument();
        expect(
            screen.getByText(/비밀번호 입력칸에 원하는 비밀번호를 입력하면/i)
        ).toBeInTheDocument();
        expect(
            screen.getByText(/env에는 원래 비밀번호를 저장하지 않습니다/i)
        ).toBeInTheDocument();
        expect(
            screen.getByText(/변수 치환으로 해석되므로/i)
        ).toBeInTheDocument();
        expect(nextAuthMock.useSession).not.toHaveBeenCalled();

        const passwordInput = screen.getByLabelText("비밀번호");
        expect(passwordInput).toHaveAttribute("type", "text");
        fireEvent.change(passwordInput, { target: { value: "password123" } });
        expect(
            screen.getByText(
                /비밀번호 규칙을 모두 만족해야 이 명령을 복사할 수 있습니다/i
            )
        ).toBeInTheDocument();
        expect(
            screen.getByText(/Buffer\.from\('cGFzc3dvcmQxMjM='/i)
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "비밀번호 규칙 확인 필요" })
        ).toBeDisabled();

        fireEvent.change(passwordInput, { target: { value: "Password123!" } });
        expect(screen.getByText("12자 이상")).toBeInTheDocument();
        expect(screen.getByText("영문 소문자 1개 이상")).toBeInTheDocument();
        expect(screen.getByText("영문 대문자 1개 이상")).toBeInTheDocument();
        expect(screen.getByText("숫자 1개 이상")).toBeInTheDocument();
        expect(screen.getByText("특수문자 1개 이상")).toBeInTheDocument();
        expect(
            screen.getByText("영문, 숫자, ASCII 특수문자만 사용")
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                /현재 명령은 유효한 비밀번호 입력값으로 생성됩니다/i
            )
        ).toBeInTheDocument();
        expect(
            screen.getByText(/Buffer\.from\('UGFzc3dvcmQxMjMh'/i)
        ).toBeInTheDocument();

        const passwordCommand = screen.getByTestId("password-hash-command");
        const authSecretCommand = screen.getByTestId("auth-secret-command");
        expect(passwordCommand.textContent).toContain(
            "String.fromCharCode(92, 36)"
        );
        expect(passwordCommand.textContent).not.toContain(
            "String.fromCharCode(36)"
        );
        expect(passwordCommand.className).toContain("select-none");
        expect(authSecretCommand.className).toContain("select-none");
        expect(passwordCommand).toHaveAttribute("draggable", "false");
        expect(authSecretCommand).toHaveAttribute("draggable", "false");
        expect(fireEvent.copy(passwordCommand)).toBe(false);
        expect(fireEvent.copy(authSecretCommand)).toBe(false);
        expect(fireEvent.mouseDown(passwordCommand)).toBe(false);
        expect(fireEvent.mouseDown(authSecretCommand)).toBe(false);

        const copyButtons = screen.getAllByRole("button", { name: "복사" });
        expect(copyButtons).toHaveLength(2);

        for (const button of copyButtons) {
            expect(button.className).toContain("w-full");
        }

        fireEvent.click(copyButtons[0]);

        await waitFor(() => {
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
                expect.stringContaining("Buffer.from('UGFzc3dvcmQxMjMh'")
            );
            expect(
                screen.getByRole("button", { name: /복사됨/i })
            ).toBeDisabled();
        });
    });

    it("invalid env 안내와 생성 명령을 표시", () => {
        render(
            <LoginForm
                siteName="PortareFolium"
                setupState={{
                    missingEnvKeys: [],
                    invalidEnvKeys: [
                        {
                            key: "AUTH_SECRET",
                            reason: "최소 32자 이상의 랜덤 문자열이어야 합니다.",
                        },
                    ],
                }}
            />
        );

        expect(screen.getByText("수정 필요")).toBeInTheDocument();
        expect(
            screen.getByText(
                /문제:\s*최소 32자 이상의 랜덤 문자열이어야 합니다./i
            )
        ).toBeInTheDocument();
        expect(
            screen.getByText(/`AUTH_ADMIN_PASSWORD_HASH` 생성 명령/i)
        ).toBeInTheDocument();
        expect(
            screen.getByText(/`AUTH_SECRET` 생성 명령/i)
        ).toBeInTheDocument();
    });
});
