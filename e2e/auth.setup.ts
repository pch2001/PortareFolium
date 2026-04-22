import { test as setup, expect } from "@playwright/test";

const authFile = ".auth/user.json";

setup("Admin 로그인 + storageState 저장", async ({ page }) => {
    const email = process.env.E2E_EMAIL;
    const password = process.env.E2E_PASSWORD;

    if (!email || !password) {
        throw new Error(
            "E2E_EMAIL / E2E_PASSWORD 환경 변수가 설정되지 않음. .env.local 확인 필요"
        );
    }

    await page.goto("/admin/login");

    // E2E credentials 입력
    await page.locator("#e2e-email").fill(email);
    await page.locator("#e2e-password").fill(password);

    // 테스트 로그인 버튼 클릭
    await page.getByRole("button", { name: /테스트 계정으로 로그인/i }).click();

    // /admin 대시보드 진입 대기
    await expect(page).toHaveURL(/\/admin(?:#.*)?$/, { timeout: 15_000 });
    await expect(page.getByText(/admin 대시보드/i)).toBeVisible({
        timeout: 15_000,
    });
    await expect(page.getByRole("button", { name: /로그아웃/i })).toBeVisible({
        timeout: 15_000,
    });

    // authenticated route 사전 컴파일
    await page.goto("/resume", { waitUntil: "load" });
    await expect(
        page.getByRole("button", { name: /pdf 내보내기/i })
    ).toBeVisible({ timeout: 15_000 });

    await page.goto("/portfolio", { waitUntil: "load" });
    await expect(
        page.getByRole("button", { name: /pdf 내보내기/i })
    ).toBeVisible({ timeout: 15_000 });

    // storageState 저장
    await page.context().storageState({ path: authFile });
});
