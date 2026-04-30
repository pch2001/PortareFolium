import { expect, test } from "@playwright/test";

test.describe("Admin Tiptap KTable controls", () => {
    test("inserts and edits a KTable from the original RichMarkdownEditor toolbar", async ({
        page,
    }) => {
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.goto("/admin#posts", { waitUntil: "domcontentloaded" });

        const editBtn = page.locator("button:has-text('편집')").first();
        await expect(editBtn).toBeVisible({ timeout: 15_000 });
        await editBtn.click();

        const editor = page.locator(".ProseMirror").first();
        await expect(editor).toBeVisible({ timeout: 15_000 });

        await page.getByTitle("Source 편집").click();
        const sourceEditor = page.locator("textarea.font-mono").first();
        await expect(sourceEditor).toBeVisible();
        await sourceEditor.fill("KTable E2E scratch area");
        await expect(sourceEditor).toHaveValue("KTable E2E scratch area");
        await page.getByTitle("Markdown 뷰").click();
        await expect(editor).toContainText("KTable E2E scratch area");
        await expect(editor.locator("table")).toHaveCount(0);

        await page.getByTitle("테이블 삽입 / 프리셋").click();
        await page.getByRole("button", { name: "3 x 3", exact: true }).click();

        const table = editor.locator("table").first();
        await expect(table).toBeVisible();
        await expect(table.locator("tr")).toHaveCount(3);

        const firstBodyCell = table.locator("td").first();
        await firstBodyCell.click();
        await page.keyboard.type("KTable cell");
        await expect(firstBodyCell).toContainText("KTable cell");

        await page.getByTitle("아래 행 추가").click();
        await expect(table.locator("tr")).toHaveCount(4);

        await page.getByTitle("오른쪽 열 추가").click();
        await expect(table.locator("tr").first().locator("th, td")).toHaveCount(
            4
        );

        await page.getByTitle("셀 속성").click();
        await page.getByTitle("Blue").click();
        await page.getByRole("button", { name: "C", exact: true }).click();
        await expect(firstBodyCell).toHaveAttribute(
            "data-tw-color",
            "blue-200"
        );
        await expect(firstBodyCell).toHaveAttribute(
            "data-text-align",
            "center"
        );

        await page.getByTitle("Source 편집").click();
        await expect(sourceEditor).toHaveValue(/<table[\s\S]*data-table-width/);
        await expect(sourceEditor).toHaveValue(/data-tw-color="blue-200"/);
        await expect(sourceEditor).toHaveValue(/data-text-align="center"/);
        await expect(sourceEditor).not.toHaveValue(/style=/);
    });
});
