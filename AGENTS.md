# AGENTS.md — Kartezya HR Frontend

Tool-agnostic AI coding rules. This file is self-sufficient for the frontend repo; do not assume backend files exist.
Automatic loading depends on the tool; this is not guaranteed to work in every AI tool.

## A. Instruction hierarchy

- Root `AGENTS.md` is the project-wide normative source; a nearer scoped `AGENTS.md`, if present, only adds rules specific to its own folder.
- Adapter files must not define independent project rules and must not copy the main rules.
- User requests apply unless they violate security or repository policy; code and repository reality take precedence over stale documentation.

## B. Project overview

- **Framework:** Next.js 16 (App Router) · **UI:** React 19, TypeScript
- **HTTP:** Axios (`services/`, `helpers/api/`) · **Styling:** Bootstrap, react-bootstrap, SCSS
- **Authz UI:** `lib/authz/` · **Prod serving:** static export (`out/`) + Go server (`main.go`, `build:go`)

## C. Navigation

- Use `next/link` or the Next.js router for in-app navigation; avoid unnecessary native `<a href>` full reloads.
- Use `button type="button"` for toggles/menus. Real external links and intentional hard redirects are exceptions.

## D. Task start and root cause

- Inspect the relevant UI/API flow end to end before editing; do not mask symptoms, find the root cause.
- Open only the files needed for the task; do not guess unknown behavior; state assumptions.
- Evaluate loading, error and empty states; keep filter/sort/pagination consistent with the API contract.
- Classify task risk (see J). For clearly low/medium bug fixes, do not wait for unnecessary approval.

## E. Authorization

- Frontend guards and UI hiding are **not a security boundary**; backend capability enforcement is essential.
- Current source: `lib/authz/capabilities.ts`. Roles: `ADMIN`, `HR`, `FINANCIAL`, `EMPLOYEE` — do not treat the fixed list as final; verify from living code.
- For capability sync, use BE `internal/authz/capabilities.go` only in multi-root or when the user provides a BE file/diff; in FE-only do not assume a BE path.

## F. Code scope

- Do not do out-of-scope component refactors or broad restructuring; preserve the App Router (`app/`) structure.
- Evaluate the browser/server boundary in relevant tasks. Do not modify generated files under the pretext of a "fix".

## G. Locale, date and timezone

- Do not rely on system/browser locale; do not use implicit locale for date/time/number/currency/sorting.
- Do not parse display strings as if they were the storage/API format; keep API/storage locale-independent; do not write the UI format back to the API.
- Do not assume browser, backend, DB and scheduler share the same timezone.
- Do not hardcode `tr-TR` / `en-US` or another locale as a bug workaround; use a locale only if it is a product standard.
- Keep sorting/collation (e.g. Turkish characters) and FE/BE filter-date semantics consistent with product requirements.

## H. Production-first

- Do not design for local-only development; base it on the production reality of static export + Go server.
- Do not assume `middleware.ts`, SSR rewrites or Next runtime behaviors work in production; evaluate whether local navigation/auth is compatible with `out/` + Go server.
- Do not hardcode API base URL, OAuth callback or asset path. `NEXT_PUBLIC_*` is baked at build time; it does not change at runtime.
- Do not treat local `.env`, localhost, a Railway fallback or a single-environment URL as production truth.
- Do not treat timeout/sleep/delay/restart/manual refresh/cache clearing as a permanent fix; do not hide production errors with silent fallback.

## I. Git, WIP and security

- Do not modify `main`/`master`; do not commit/push/PR/pull/fetch/merge/rebase without explicit request.
- Destructive Git (amend, force push, reset --hard, clean, branch deletion, stash pop/drop, loss via restore/checkout, cherry-pick/revert) is not allowed without explicit user approval.
- Do not alter user WIP under the pretext of revert/overwrite/format; do not touch out-of-scope files.
- Do not read or modify `.env` or secrets; do not log tokens/credentials; do not repeat secrets seen, redact them. Do not make real API/DB calls.
- `.cursorignore` / `.geminiignore` are discovery filters, not a hard security deny.

## J. Task risk levels

| Level | Example | Approach |
|---|---|---|
| **Low** | CSS, label | Single pass; 1–3 files |
| **Medium** | Form, API, pagination | Page + service; lint; build only for route/config/integration or broad scope |
| **High** | Auth, session, token, capability sync | Plan; evaluate with BE authz if accessible |

## K. Validation

Commands per `package.json` scripts:

- Start from the validation closest to scope; widen as risk increases. `npm run lint`; `git diff --check`.
- `npm run build`: `next.config.js` has `ignoreBuildErrors: true` — the build does not catch TypeScript errors and is not proof of type safety or success. A full build is not mandatory for every low/medium task; run it for route/config/integration, high risk, before a PR, or when the user asks.
- If out-of-scope generated files (`next-env.d.ts` etc.) change, restore them. Distinguish `introduced` vs `pre-existing` TS errors; do not assume pre-existing without evidence.
- Without an executed test/build, do not claim "works / fully resolved"; report skipped checks and remaining risk.

## L. Conditional references

This repo is self-sufficient. Being listed does not mean reading it in every context. Adapters are not detailed guides. For normal UI/styling/isolated bug fix/component refactor, do not look for backend docs.

- FE when needed: `lib/authz/capabilities.ts`, `contants/urls.ts`, `next.config.js`, `main.go`, `components/SEARCHABLE_SELECT_GUIDE.md`.
- Backend `docs/AI_CODING_GUIDE.md` only if the file actually exists in multi-root and the task is (1) auth/capability contract, (2) shared BE/FE filter/sort/date semantics, (3) production API/config/deployment, (4) the user explicitly asks for a plan/workflow, (5) validation strategy cannot be decided from this file — then optional; read only the relevant section. "Cross-layer" alone is not sufficient.
- Backend `docs/AI_TOKEN_OPTIMIZATION.md` only for AI instruction/token/tool/management reporting; do not open it during normal FE work.
- Capability sync/matrix: only in multi-root or when the user provides a BE diff, use `internal/authz/capabilities.go`, `BACKEND_API_ROLE_MATRIX.md`.

> **Stale:** Backend README / `docs/project_analysis.md` may describe old roles; for auth, rely on living code and capability sources.
