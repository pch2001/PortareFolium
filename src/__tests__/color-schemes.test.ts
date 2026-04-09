import { describe, it, expect } from "vitest";
import {
    ALL_SCHEME_IDS,
    COLOR_SCHEMES,
    NEUTRAL_SCHEME,
    PDF_COLOR_SCHEMES,
} from "@/lib/color-schemes";

describe("color-schemes 구조 무결성", () => {
    describe("ALL_SCHEME_IDS", () => {
        it("17개의 스킴 ID를 포함", () => {
            expect(ALL_SCHEME_IDS).toHaveLength(17);
        });

        it("중복 ID가 없음", () => {
            const unique = new Set(ALL_SCHEME_IDS);
            expect(unique.size).toBe(ALL_SCHEME_IDS.length);
        });

        it("모든 ID가 소문자 알파벳으로만 구성", () => {
            for (const id of ALL_SCHEME_IDS) {
                expect(id).toMatch(/^[a-z]+$/);
            }
        });
    });

    describe("COLOR_SCHEMES", () => {
        it("ALL_SCHEME_IDS와 동일한 수의 엔트리를 가짐", () => {
            expect(COLOR_SCHEMES).toHaveLength(ALL_SCHEME_IDS.length);
        });

        it("ALL_SCHEME_IDS의 모든 ID가 COLOR_SCHEMES에 존재", () => {
            const schemeValues = COLOR_SCHEMES.map((s) => s.value);
            for (const id of ALL_SCHEME_IDS) {
                expect(schemeValues).toContain(id);
            }
        });

        it("각 엔트리가 value, label, desc, swatch 필드를 가짐", () => {
            for (const scheme of COLOR_SCHEMES) {
                expect(scheme.value).toBeTruthy();
                expect(scheme.label).toBeTruthy();
                expect(scheme.desc).toBeTruthy();
                expect(scheme.swatch).toBeTruthy();
            }
        });

        it("각 swatch가 유효한 hex 색상 코드", () => {
            for (const scheme of COLOR_SCHEMES) {
                expect(scheme.swatch).toMatch(/^#[0-9a-f]{6}$/i);
            }
        });
    });

    describe("NEUTRAL_SCHEME", () => {
        it("value, label, desc, swatch 필드를 가짐", () => {
            expect(NEUTRAL_SCHEME.value).toBe("neutral");
            expect(NEUTRAL_SCHEME.label).toBeTruthy();
            expect(NEUTRAL_SCHEME.desc).toBeTruthy();
            expect(NEUTRAL_SCHEME.swatch).toMatch(/^#[0-9a-f]{6}$/i);
        });
    });

    describe("PDF_COLOR_SCHEMES", () => {
        it("neutral 포함 총 18개 (neutral + 17개 스킴)", () => {
            expect(PDF_COLOR_SCHEMES).toHaveLength(18);
        });

        it("첫 번째 항목이 neutral", () => {
            expect(PDF_COLOR_SCHEMES[0].value).toBe("neutral");
        });
    });
});
