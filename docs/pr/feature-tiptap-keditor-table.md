# PR: feature/tiptap-keditor-table

## v0.12.121 - RichMarkdownEditor KTable 편집 추가

- original Tiptap `RichMarkdownEditor`에 KTable 삽입/편집 toolbar 통합.
- table/row/column 조작, merge/split, border toggle, header toggle, 셀 색상과 정렬 지원.
- markdown HTML에 `data-ktable`, `data-tw-color`, `data-text-align` attribute 보존.
- editor와 frontend 양쪽에서 KTable border, 배경, light/dark 대비 CSS 공유.
- unit/E2E 회귀 테스트와 `data-tw-color` 대비 로직 문서 추가.
