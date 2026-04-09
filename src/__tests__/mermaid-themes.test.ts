import { describe, it, expect } from "vitest";
import { getMermaidConfig, MERMAID_THEMES } from "@/lib/mermaid-themes";

const EXPECTED_SCHEMES = [
    "red",
    "orange",
    "amber",
    "yellow",
    "lime",
    "green",
    "emerald",
    "teal",
    "cyan",
    "sky",
    "blue",
    "indigo",
    "violet",
    "purple",
    "fuchsia",
    "pink",
    "rose",
] as const;

const REQUIRED_VARS = [
    "primaryColor",
    "primaryTextColor",
    "primaryBorderColor",
    "lineColor",
    "secondaryColor",
    "secondaryTextColor",
    "secondaryBorderColor",
    "tertiaryColor",
    "tertiaryTextColor",
    "tertiaryBorderColor",
    "background",
    "mainBkg",
    "textColor",
    "noteBkgColor",
    "noteTextColor",
] as const;

// ─────────────────────────────────────────────────────────
// MERMAID_THEMES 구조 무결성
// ─────────────────────────────────────────────────────────

describe("MERMAID_THEMES 구조", () => {
    it("17개 스킴이 모두 존재", () => {
        expect(Object.keys(MERMAID_THEMES)).toHaveLength(17);
    });

    it("각 스킴이 light/dark 모드를 가짐", () => {
        for (const scheme of EXPECTED_SCHEMES) {
            expect(MERMAID_THEMES[scheme]).toHaveProperty("light");
            expect(MERMAID_THEMES[scheme]).toHaveProperty("dark");
        }
    });

    it("각 모드에 필수 테마 변수가 모두 존재", () => {
        for (const scheme of EXPECTED_SCHEMES) {
            for (const mode of ["light", "dark"] as const) {
                const vars = MERMAID_THEMES[scheme][mode];
                for (const field of REQUIRED_VARS) {
                    expect(
                        vars,
                        `${scheme}.${mode}.${field} 누락`
                    ).toHaveProperty(field);
                }
            }
        }
    });

    it("모든 색상값이 유효한 hex 형식", () => {
        const hexFields = [
            "primaryColor",
            "primaryTextColor",
            "primaryBorderColor",
            "lineColor",
            "secondaryColor",
            "tertiaryColor",
            "background",
            "mainBkg",
            "noteBkgColor",
        ] as const;

        for (const scheme of EXPECTED_SCHEMES) {
            for (const mode of ["light", "dark"] as const) {
                const vars = MERMAID_THEMES[scheme][mode];
                for (const field of hexFields) {
                    expect(
                        vars[field],
                        `${scheme}.${mode}.${field} = "${vars[field]}" is not a valid hex`
                    ).toMatch(/^#[0-9a-fA-F]{6}$/);
                }
            }
        }
    });
});

// ─────────────────────────────────────────────────────────
// getMermaidConfig
// ─────────────────────────────────────────────────────────

describe("getMermaidConfig", () => {
    it("theme: 'base' 반환", () => {
        const config = getMermaidConfig("blue", false);
        expect(config.theme).toBe("base");
    });

    it("themeVariables에 fontSize 포함", () => {
        const config = getMermaidConfig("blue", false);
        expect(config.themeVariables.fontSize).toBe("18px");
    });

    it("themeVariables에 fontFamily 포함", () => {
        const config = getMermaidConfig("blue", false);
        expect(config.themeVariables.fontFamily).toBe("inherit");
    });

    it("isDark=false → darkMode: false", () => {
        const config = getMermaidConfig("blue", false);
        expect(config.themeVariables.darkMode).toBe(false);
    });

    it("isDark=true → darkMode: true", () => {
        const config = getMermaidConfig("blue", true);
        expect(config.themeVariables.darkMode).toBe(true);
    });

    it("light/dark 모드에 따라 다른 primaryColor 반환", () => {
        const light = getMermaidConfig("blue", false);
        const dark = getMermaidConfig("blue", true);
        expect(light.themeVariables.primaryColor).not.toBe(
            dark.themeVariables.primaryColor
        );
    });

    it("알 수 없는 스킴 → blue 폴백", () => {
        const unknown = getMermaidConfig("unknown-scheme", false);
        const blue = getMermaidConfig("blue", false);
        expect(unknown.themeVariables.primaryColor).toBe(
            blue.themeVariables.primaryColor
        );
    });

    it("null 스킴 → blue 폴백", () => {
        const nullScheme = getMermaidConfig(null, false);
        const blue = getMermaidConfig("blue", false);
        expect(nullScheme.themeVariables.primaryColor).toBe(
            blue.themeVariables.primaryColor
        );
    });

    it("유효한 스킴에서 blue와 다른 테마 반환 (red)", () => {
        const red = getMermaidConfig("red", false);
        const blue = getMermaidConfig("blue", false);
        expect(red.themeVariables.primaryColor).not.toBe(
            blue.themeVariables.primaryColor
        );
    });

    it("17개 스킴 모두 정상 반환", () => {
        for (const scheme of EXPECTED_SCHEMES) {
            const config = getMermaidConfig(scheme, false);
            expect(config.theme).toBe("base");
            expect(config.themeVariables.primaryColor).toMatch(
                /^#[0-9a-fA-F]{6}$/
            );
        }
    });
});
