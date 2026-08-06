# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Nova · 星际专注** — a "focus timer as interplanetary travel" app. You set a focus duration, your ship "flies" toward a real destination star, and relativistic time dilation (Lorentz factor γ) maps your focused minutes to cosmological distance. Tech: Vite 5 + React 18 + TypeScript (strict, `noUncheckedIndexedAccess`) + Three.js/R3F + Zustand + Dexie (IndexedDB) + Web Worker timer + Vitest + Playwright + Tailwind. A Tauri 2 macOS shell exists in `src-tauri/` (Rust not installed yet; do not attempt `pnpm tauri build`).

## 新会话必读（Onboarding）— 每个新 session 开始时必须按顺序读完，不得跳过

1. **`HANDOFF.md`** — 当前状态 / 架构地图 / 所有 gotcha（最重要的文件）
2. **`docs/ROADMAP.md`** — 各阶段验收标准的唯一权威来源
3. **`docs/adr/README.md`** + **`docs/adr/00NN-*.md` 全部 13 个 ADR**（0010–0012 是真实星表/飞行模型，也必读）— 所有 "why" 决策
4. **`docs/UI-UX-DESIGN.md`** — 视觉与交互设计规范

以上文件在动手写任何代码之前读取。项目文档均为中文。

## Commands

Package manager is **pnpm only** — `preinstall` hard-blocks npm/yarn.

```bash
pnpm dev                 # dev server (http://localhost:5173)
pnpm build               # tsc -b && vite build
pnpm check               # THE pre-commit gate: lint + typecheck + test + format:check (all 4)
pnpm test                # vitest run
pnpm test:watch          # vitest watch
pnpm vitest <path>       # run one test file, e.g. pnpm vitest src/engine/navigation --reporter=verbose
pnpm test:coverage       # v8 coverage report
pnpm test:e2e            # Playwright (3 browsers)
pnpm test:e2e:ui         # Playwright UI debugger
pnpm test:e2e:trace      # Playwright with trace viewer
pnpm lint / pnpm lint:fix
pnpm typecheck
pnpm format / pnpm format:check
```

Git: commits must pass **commitlint (Conventional Commits)**; branches named `feature/S{nn}-description`. Do not commit unless the user asks (see Workflow below).

## Architecture: strict layering (ADR-0005)

The core design rule is **engine ↔ UI separation**, enforced by ESLint. All imports use `@/`-aliases (see `vite.config.ts`); never use relative paths beyond two levels.

```
src/contract/    Shared cross-layer types (type/interface only, zero runtime code)
src/engine/      Engine layer — PURE TS. No react / three / @react-three/* / dexie imports
│                (enforced by eslint no-restricted-imports). Exposed ONLY via src/engine/index.ts.
│  physics/      lorentz.ts: γ, travelDistance, LIGHT_SPEED (pure functions)
│  navigation/   VoyageController.ts: state machine idle/running/paused/completed/aborted,
│                snapshot↔restore, tick(wallTime?); EventEmitter-driven
│  data/         KdTree3.ts (hand-written 3D KD-tree), StarCatalog.ts (4 tiered trees + LOD)
│  renderer/     THE ONLY place three/R3F is allowed — R3F <StarField>, shader material,
│                star-colors.ts, build-star-points.ts, plus S16/S17 PickController etc.
src/storage/     Infrastructure — Dexie (NovaDatabase, VoyageRepository, SettingsRepository)
│                + localStorage crash-recovery snapshot (live-voyage-storage.ts).
│                May import only @/contract/*, @/engine/contract/*, dexie.
src/store/       Zustand stores: useSettingsStore / useVoyageStore / useHistoryStore.
│                UI talks to engine ONLY through these. Deps injected via getStoreDeps/
│                setStoreDepsForTest (store-deps.ts) for test isolation.
src/workers/     voyage-timer.worker.ts — broadcasts a tick every 250ms (the app clock)
src/pages/       SetupPanel, VoyageView, ResultView, StarMapDialog, StarMapView
src/components/  UI components (HistoryPanel, GlossaryDialog, StarInfoCard, ...)
src/test/        setup.ts (fake-indexeddb + canvas/matchMedia stubs) + dev-hooks.ts
src/utils/       format.ts (formatDurationMs / formatLy / formatGamma ...)
```

Data flow is one-way: **engine (source of truth) → EventEmitter → Zustand store action → React**. React components must never import `VoyageController` directly from `@/engine` — go through the store.

### The 3D star map (current focus area)

`src/pages/StarMapView.tsx` is the R3F canvas (lazy-loaded via `React.lazy` in `App.tsx` — the ~967KB three chunk must stay out of the main bundle; `vite.config.ts` `manualChunks` splits react/three/state/db). It renders inside `src/pages/StarMapDialog.tsx`, opened from the header "星图" button. Clicking a star → `StarInfoCard` confirm card → sets `useVoyageStore.destStarId`. The `<Canvas>` must be wrapped in `<div className="absolute inset-0">` or R3F collapses to 150px (known gotcha).

## Non-negotiable conventions

**User preferences (from memory + HANDOFF):**

- **Never auto-commit.** Write code, run validation, show results/screenshots, and wait for the user to confirm. The user often commits themselves via a GUI.
- **UI = minimal & restrained** (Linear/Apple aesthetic): generous whitespace, thin type, flat buttons, hairline dividers. **No decorative backgrounds** (no nebula glows/shimmer/circles) — the user explicitly removed them.
- **Single dark "Neutral" theme, no theme switcher** (ADR-0009): near-black gray scale + gold (`--color-star-gold`) as the only accent. `data-theme` is always `neutral`; old stored theme values are coerced on load. `ThemeToggle` was deleted — do not reintroduce theming.
- Show a screenshot for any UI change and wait for confirmation.

**Code rules:**

- Engine layer (except `src/engine/renderer/**`): no react/three/R3F/dexie imports — ESLint errors, don't work around.
- `src/engine/renderer/**` has `react/no-unknown-property` whitelisted for R3F props (`attach`, `args`, shader uniforms...); don't touch that config.
- TypeScript is `strict` + `noUncheckedIndexedAccess` — array access needs `arr[i]!` or a guard.
- `VoyageController.wallNow` uses **only `Date.now()`** (never `performance.now()`).
- `SpectralType` enum values must be typed, not raw strings.
- No code comments unless an ADR/README requires one; no emoji in code; kebab-case files, PascalCase components, `CONST_CASE` constants.
- Test `it()` descriptions are written in Chinese with business meaning (e.g. `it('比邻星 4.246ly 真实排序正确')`).

## Testing gotchas (learned the hard way)

- **fake timers**: never `vi.useFakeTimers()` bare — it hangs fake-indexeddb/Dexie (macrotask commits get mocked). Scope it: `vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] })`.
- Dexie tests use `NovaDatabase.temp` with a fresh DB name per `it`.
- R3F/WebGL components are **not testable in jsdom** (no WebGL). Test the pure functions (`star-colors`, `build-star-points`) in Vitest and cover rendering via Playwright smoke tests.
- E2E timer fast-forward: use `window.__TEST_ONLY__.fastForward(ms)` (dev-hooks). **Do not use `page.clock`** — since S13 timing runs in a Web Worker, page.clock can't control it.
- Star-map e2e assertions must be scoped inside `getByTestId('star-info-card')` — bare `getByText(/星名/)` also matches the SetupPanel destination dropdown hidden behind the modal.
- WebGL tests run on **chromium only**; starmap e2e uses a 20s timeout (first-load three optimization is slow).
- jsdom has no canvas: `src/test/setup.ts` stubs `getContext`, and components try/catch it.

## Current state

Phase 1 MVP (S11–S15) done; Phase 2 (S16 star renderer + S17 map dialog/interaction) is delivered on branch `feature/S16-starmap-renderer` with uncommitted changes awaiting user confirmation. Next per ROADMAP: integrate the full ~1800-star catalog within 50 ly (replacing the 500-star fixture), then navigation (pick destination → compute required focus duration). For anything architecture-level, **write a new ADR before code** — that is the project's rule.
