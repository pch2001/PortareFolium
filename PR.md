# PR: E2E 테스트 인프라 구축 + 테스트 정리 + 수동 체크리스트 자동화

## 요약

### Playwright E2E 테스트 도입

- Playwright 설치 (Chromium, Firefox, WebKit + mobile viewport 2종)
- 5개 공개 테스트 스위트: smoke, navigation, theme, responsive, SEO/접근성
- 크로스 브라우저 지원 검증 (자체 호스팅 사용자의 다양한 환경 대응)
- dev 서버 자동 기동 (`webServer` 설정, CI에서는 `pnpm start`)
- `pnpm test:e2e` / `pnpm test:e2e:chromium` / `pnpm test:e2e:ui` 스크립트

### 인증 E2E 테스트

- `e2e/auth.setup.ts`: Supabase 로그인 + `storageState` 저장
- `e2e/authenticated/pdf-export.spec.ts` (7 테스트): PDF 내보내기 버튼, 모달 UI, 페이지 구분선, 컬러 스킴 변경 시 페이지 수 유지, grid 2열 레이아웃 유지, ESC 닫기, Portfolio export

### 콘텐츠 렌더링 E2E

- `e2e/content-rendering.spec.ts` (5 테스트): Shiki 코드 블록, 이미지 lazy loading, 목차 (TOC), Mermaid 다이어그램, KaTeX 수식

### 불필요한 단위 테스트 정리

- TypeScript 타입이 이미 보장하는 구조 검증 테스트 제거
- 142개 → 79개 (63개 제거)
- `color-schemes.test.ts` 전체 삭제
- `mermaid-themes.test.ts`, `tailwind-colors.test.ts`, `tiptap-utils.test.ts` 축소

### GitHub Actions CI

- `.github/workflows/e2e.yml`: push/PR 시 크로스 브라우저 E2E 자동 실행
- Chromium / Firefox / WebKit 병렬 매트릭스 (각 job에 Chromium 항상 포함 — auth setup 의존)
- Vitest 단위 테스트 + Playwright E2E 순차 실행
- Supabase + E2E 인증 환경 변수 전달
- 실패 시 playwright-report artifact 7일 보존

## 변경 파일

| 영역 | 파일 |
|------|------|
| E2E 설정 | `playwright.config.ts`, `package.json`, `.gitignore`, `.env.example` |
| E2E 공개 | `e2e/smoke.spec.ts`, `e2e/navigation.spec.ts`, `e2e/theme.spec.ts`, `e2e/responsive.spec.ts`, `e2e/seo.spec.ts`, `e2e/content-rendering.spec.ts` |
| E2E 인증 | `e2e/auth.setup.ts`, `e2e/authenticated/pdf-export.spec.ts` |
| CI | `.github/workflows/e2e.yml` |
| 테스트 정리 | `src/__tests__/color-schemes.test.ts` (삭제), `mermaid-themes.test.ts`, `tailwind-colors.test.ts`, `tiptap-utils.test.ts` (축소) |
| 문서 | `docs/CHANGES.md`, `docs/TEST.md`, `README.md`, `AGENTS.md` |

### fix: Firefox E2E — "편집 종료" handler stale state revert 수정

- `ResumePanel.tsx`: `initialSectionLayoutRef` 추가. save 시 ref 즉시 갱신, "편집 종료" handler에서 ref 기반 dirty 판정으로 Firefox batch flush 타이밍 차이 해소
- `AGENTS.md`, `.claude/commands/ship.md`: push gate를 3개 브라우저 엔진 필수로 강화

## 테스트

- [x] Vitest 79/79 통과
- [x] Playwright 공개 33×5 브라우저 = 165 통과
- [x] Playwright 인증 setup 1 + 7×3 브라우저 = 22 통과
- [x] 전체 187 E2E 통과
- [x] `pnpm build` 성공
