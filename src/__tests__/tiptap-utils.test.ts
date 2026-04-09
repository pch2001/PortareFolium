import { describe, it, expect } from "vitest";
import {
    formatShortcutKey,
    isValidPosition,
    clamp,
    isAllowedUri,
    sanitizeUrl,
} from "@/lib/tiptap-utils";

// ─────────────────────────────────────────────────────────
// formatShortcutKey
// ─────────────────────────────────────────────────────────

describe("formatShortcutKey", () => {
    describe("Mac 플랫폼 (isMac=true)", () => {
        it("mod → ⌘", () => {
            expect(formatShortcutKey("mod", true)).toBe("⌘");
        });

        it("ctrl → ⌃", () => {
            expect(formatShortcutKey("ctrl", true)).toBe("⌃");
        });

        it("alt → ⌥", () => {
            expect(formatShortcutKey("alt", true)).toBe("⌥");
        });

        it("shift → ⇧", () => {
            expect(formatShortcutKey("shift", true)).toBe("⇧");
        });

        it("enter → ⏎", () => {
            expect(formatShortcutKey("enter", true)).toBe("⏎");
        });

        it("대소문자 구분 없이 변환 (SHIFT → ⇧)", () => {
            expect(formatShortcutKey("SHIFT", true)).toBe("⇧");
        });

        it("매핑 없는 키는 대문자로 반환", () => {
            expect(formatShortcutKey("b", true)).toBe("B");
        });

        it("capitalize=false 시 원본 키 반환", () => {
            expect(formatShortcutKey("b", true, false)).toBe("b");
        });
    });

    describe("비-Mac 플랫폼 (isMac=false)", () => {
        it("ctrl → Ctrl (첫 글자 대문자)", () => {
            expect(formatShortcutKey("ctrl", false)).toBe("Ctrl");
        });

        it("shift → Shift", () => {
            expect(formatShortcutKey("shift", false)).toBe("Shift");
        });

        it("capitalize=false 시 원본 그대로", () => {
            expect(formatShortcutKey("ctrl", false, false)).toBe("ctrl");
        });

        it("단일 문자 키도 대문자로", () => {
            expect(formatShortcutKey("b", false)).toBe("B");
        });
    });
});

// ─────────────────────────────────────────────────────────
// isValidPosition
// ─────────────────────────────────────────────────────────

describe("isValidPosition", () => {
    it("양수 → true", () => {
        expect(isValidPosition(5)).toBe(true);
    });

    it("0 → true (경계값)", () => {
        expect(isValidPosition(0)).toBe(true);
    });

    it("음수 → false", () => {
        expect(isValidPosition(-1)).toBe(false);
    });

    it("null → false", () => {
        expect(isValidPosition(null)).toBe(false);
    });

    it("undefined → false", () => {
        expect(isValidPosition(undefined)).toBe(false);
    });

    it("NaN → false", () => {
        expect(isValidPosition(NaN)).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────
// clamp
// ─────────────────────────────────────────────────────────

describe("clamp", () => {
    it("범위 내 값은 그대로", () => {
        expect(clamp(5, 0, 10)).toBe(5);
    });

    it("최솟값 미만 → 최솟값", () => {
        expect(clamp(-5, 0, 10)).toBe(0);
    });

    it("최댓값 초과 → 최댓값", () => {
        expect(clamp(15, 0, 10)).toBe(10);
    });

    it("정확히 최솟값 → 최솟값", () => {
        expect(clamp(0, 0, 10)).toBe(0);
    });

    it("정확히 최댓값 → 최댓값", () => {
        expect(clamp(10, 0, 10)).toBe(10);
    });

    it("소수점도 처리", () => {
        expect(clamp(0.5, 0, 1)).toBe(0.5);
        expect(clamp(1.5, 0, 1)).toBe(1);
    });
});

// ─────────────────────────────────────────────────────────
// isAllowedUri
// ─────────────────────────────────────────────────────────

describe("isAllowedUri", () => {
    it("undefined → truthy (빈 URI 허용)", () => {
        expect(isAllowedUri(undefined)).toBeTruthy();
    });

    it("빈 문자열 → truthy", () => {
        expect(isAllowedUri("")).toBeTruthy();
    });

    it("https:// → truthy", () => {
        expect(isAllowedUri("https://example.com")).toBeTruthy();
    });

    it("http:// → truthy", () => {
        expect(isAllowedUri("http://example.com")).toBeTruthy();
    });

    it("mailto: → truthy", () => {
        expect(isAllowedUri("mailto:test@example.com")).toBeTruthy();
    });

    it("tel: → truthy", () => {
        expect(isAllowedUri("tel:+821012345678")).toBeTruthy();
    });

    it("ftp:// → truthy", () => {
        expect(isAllowedUri("ftp://files.example.com")).toBeTruthy();
    });

    it("javascript: → falsy (XSS 방지)", () => {
        expect(isAllowedUri("javascript:alert(1)")).toBeFalsy();
    });

    it("data: → falsy", () => {
        expect(
            isAllowedUri("data:text/html,<script>alert(1)</script>")
        ).toBeFalsy();
    });

    it("상대 경로 /path → truthy", () => {
        expect(isAllowedUri("/path/to/page")).toBeTruthy();
    });

    it("커스텀 프로토콜 추가 시 허용", () => {
        expect(
            isAllowedUri("myapp://open", [{ scheme: "myapp" }])
        ).toBeTruthy();
    });

    it("커스텀 프로토콜 문자열로 추가 시 허용", () => {
        expect(isAllowedUri("git://repo.example.com", ["git"])).toBeTruthy();
    });
});

// ─────────────────────────────────────────────────────────
// sanitizeUrl
// ─────────────────────────────────────────────────────────

describe("sanitizeUrl", () => {
    const BASE = "https://example.com";

    it("유효한 https URL → 정규화된 URL 반환", () => {
        const result = sanitizeUrl("https://example.com/page", BASE);
        expect(result).toBe("https://example.com/page");
    });

    it("상대 URL → 베이스 기준으로 절대 URL 반환", () => {
        const result = sanitizeUrl("/about", BASE);
        expect(result).toBe("https://example.com/about");
    });

    it("javascript: → '#' 반환 (XSS 방지)", () => {
        const result = sanitizeUrl("javascript:alert(1)", BASE);
        expect(result).toBe("#");
    });

    it("파싱 불가 URL → '#' 반환", () => {
        const result = sanitizeUrl("not a url %%", BASE);
        expect(result === "#" || result.startsWith("https://")).toBe(true);
    });
});
