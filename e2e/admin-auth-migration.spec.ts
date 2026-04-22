import { expect, test } from "@playwright/test";

test.describe("Admin auth migration", () => {
    test("공개 페이지에 로그인 버튼 비노출", async ({ page }) => {
        await page.goto("/");
        await expect(page.getByRole("link", { name: "로그인" })).toHaveCount(0);
    });

    test("admin login 화면에 legacy bridge와 Google 전환 경로 표시", async ({
        page,
    }) => {
        await page.goto("/admin/login");
        await expect(
            page.getByText(/기존 Supabase 로그인 1회 허용/i)
        ).toBeVisible();
        await expect(
            page.getByRole("button", { name: /기존 계정으로 로그인/i })
        ).toBeVisible();
        await expect(
            page.getByRole("button", { name: /Google로 로그인/i })
        ).toBeVisible();
    });
});
