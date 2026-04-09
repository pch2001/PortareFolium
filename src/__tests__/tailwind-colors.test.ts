import { describe, it, expect } from "vitest";
import { tailwindToHex, isLightBackground } from "@/lib/tailwind-colors";

// ─────────────────────────────────────────────────────────
// tailwindToHex
// ─────────────────────────────────────────────────────────

describe("tailwindToHex", () => {
    it("알려진 색상명 반환 (blue-500)", () => {
        expect(tailwindToHex("blue-500")).toBe("#3b82f6");
    });

    it("알려진 색상명 반환 (red-100)", () => {
        expect(tailwindToHex("red-100")).toBe("#fee2e2");
    });

    it("shade 없는 기본 색상명 반환 (blue → blue-500 값)", () => {
        expect(tailwindToHex("blue")).toBe("#3b82f6");
    });

    it("대소문자 무관하게 처리 (BLUE-500 → #3b82f6)", () => {
        expect(tailwindToHex("BLUE-500")).toBe("#3b82f6");
    });

    it("앞뒤 공백 제거 후 처리", () => {
        expect(tailwindToHex("  red-500  ")).toBe("#ef4444");
    });

    it("알 수 없는 색상명 → 빈 문자열", () => {
        expect(tailwindToHex("nonexistent-color")).toBe("");
    });

    it("빈 문자열 → 빈 문자열", () => {
        expect(tailwindToHex("")).toBe("");
    });

    it("각 주요 색상 계열이 등록되어 있음", () => {
        const colors = [
            "red",
            "slate",
            "orange",
            "yellow",
            "green",
            "blue",
            "purple",
            "pink",
        ];
        for (const color of colors) {
            expect(tailwindToHex(`${color}-500`)).toMatch(/^#[0-9a-f]{6}$/i);
        }
    });

    it("반환값은 유효한 hex 코드 형식", () => {
        expect(tailwindToHex("green-300")).toMatch(/^#[0-9a-f]{6}$/i);
    });
});

// ─────────────────────────────────────────────────────────
// isLightBackground
// ─────────────────────────────────────────────────────────

describe("isLightBackground", () => {
    describe("밝은 배경 (50-400 → true)", () => {
        it("shade 50 → true", () => {
            expect(isLightBackground("blue-50")).toBe(true);
        });

        it("shade 100 → true", () => {
            expect(isLightBackground("red-100")).toBe(true);
        });

        it("shade 200 → true", () => {
            expect(isLightBackground("green-200")).toBe(true);
        });

        it("shade 300 → true", () => {
            expect(isLightBackground("purple-300")).toBe(true);
        });

        it("shade 400 → true (경계값)", () => {
            expect(isLightBackground("slate-400")).toBe(true);
        });
    });

    describe("어두운 배경 (500-950 → false)", () => {
        it("shade 500 → false (경계값)", () => {
            expect(isLightBackground("blue-500")).toBe(false);
        });

        it("shade 600 → false", () => {
            expect(isLightBackground("red-600")).toBe(false);
        });

        it("shade 700 → false", () => {
            expect(isLightBackground("green-700")).toBe(false);
        });

        it("shade 800 → false", () => {
            expect(isLightBackground("purple-800")).toBe(false);
        });

        it("shade 900 → false", () => {
            expect(isLightBackground("slate-900")).toBe(false);
        });

        it("shade 950 → false", () => {
            expect(isLightBackground("blue-950")).toBe(false);
        });
    });

    describe("shade 없는 경우", () => {
        it("shade 없는 색상명 → true (기본값)", () => {
            expect(isLightBackground("blue")).toBe(true);
        });

        it("빈 문자열 → true (기본값)", () => {
            expect(isLightBackground("")).toBe(true);
        });
    });
});
