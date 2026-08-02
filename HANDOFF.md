# Nova · 工程交接须知（Agent 接手必读）

> 项目名称：**Nova · 星际专注软件**
> 技术栈：**Vite 5 + React 18 + TypeScript strict（noUncheckedIndexedAccess）+ Tailwind CSS 4 主题 + R3F/Three.js（待接入）+ Zustand（待接入）+ Dexie IndexedDB + Vitest + fake-indexeddb + Playwright + ESLint 9 Flat Config**
> 本文件只讲「读哪里 / 怎么继续 / 注意事项」，不讲业务背景（背景去 README / ROADMAP / ADR）。

---

## 一、先读什么（30 分钟快速上手顺序）

### 1.1 总览与路线图（业务 & 阶段验收标准）

1. [README.md](file:///Users/fiona/Documents/trae_projects/Nova/README.md) — 项目定义、技术选型原因、用户故事。
2. [docs/ROADMAP.md](file:///Users/fiona/Documents/trae_projects/Nova/docs/ROADMAP.md) — **唯一的阶段验收依据**。当前做到 **Phase 1 MVP 的 S10（Dexie 持久化）**，下一步应该是 **S11 Zustand 状态层 → S12 React UI → S13 Web Worker 计时 → S14 CI/CD → S15 v0.1 发布**。每次接事先看 ROADMAP 对应 Phase 的 Acceptance Criteria，别自己加 scope。
3. [docs/adr/README.md](file:///Users/fiona/Documents/trae_projects/Nova/docs/adr/README.md) + 8 份 ADR — **所有「为什么这么做」全在这**。尤其是 **ADR-003 分层架构**（引擎 vs 渲染 vs UI vs 数据 vs 基础设施严格隔离，不允许跨层 import）。

### 1.2 开发规范 & 工程化（写代码前必读，避免 CI 红）

1. [docs/CONTRIBUTING.md](file:///Users/fiona/Documents/trae_projects/Nova/docs/CONTRIBUTING.md) — 提交流程、分支命名 `feature/S{nn}-xx`、PR 模板、如何写 commit（commitlint 强制 Conventional Commits：`feat:`, `fix:`, `docs:` 等）。
2. [docs/DEVELOPMENT.md](file:///Users/fiona/Documents/trae_projects/Nova/docs/DEVELOPMENT.md) — **环境要求（Node 20+ pnpm 9+）+ 全部常用命令**：`pnpm install` / `pnpm dev` / `pnpm check` / `pnpm test` / `pnpm test:e2e` / `pnpm build` / `pnpm preview`。
3. [eslint.config.js](file:///Users/fiona/Documents/trae_projects/Nova/eslint.config.js) — **重点看第 2 段 Flat Config 的 no-restricted-imports 规则**：
   - ❌ **严格禁止** `src/engine/**`（除 `src/engine/renderer/**`）import `react` / `three` / `@react-three/*` / `dexie`。引擎层是**纯 TS**，只能被上层消费，不能反向依赖。
   - ❌ 禁止 UI 层直接调 `VoyageController` 内部 `_` 私有方法。
4. [tsconfig.json](file:///Users/fiona/Documents/trae_projects/Nova/tsconfig.json) — `strict: true` + `noUncheckedIndexedAccess: true`。数组访问必须 `arr[i]!` 或者先判空；`'x' | 'y' | 'z'` 的 `obj[key]` 必须自己断言 `as const`。
5. [package.json](file:///Users/fiona/Documents/trae_projects/Nova/package.json#L1-L50) — `only-allow pnpm`，**别用 npm/yarn**；68 个 deps/devDeps 已安装齐（dexie、zustand、@react-three/fiber、three、eventemitter3 都装了，缺的只有 fake-indexeddb（S10 刚装的 devDep）。
6. [vite.config.ts](file:///Users/fiona/Documents/trae_projects/Nova/vite.config.ts) — **12 个路径别名**（`@/` 根 → `src/`、`@/engine/*`、`@/contract/*`、`@/storage/*`、`@/store/*`、`@/components/*`、`@/pages/*`、`@/styles/*`、`@/test/*`、`@/workers/*`、`@/utils/*`、`@/assets/*`）—— 所有 import 都用别名，**禁止相对路径 `../../../../`**（ESLint 会报错）。

### 1.3 分层架构图（当前已交付的模块位置）

```
src/
├── contract/                  ✅ S10 新增：跨层共享类型（只含 type/interface，0 运行时）
│   └── storage-types.ts       ✅ VoyageRecord / SettingsEntry / SettingsValueMap（8 键）
├── engine/                    ✅ S7~S9 引擎层（纯 TS，0 React / 0 Three / 0 Dexie — 强制 no-restricted-imports）
│   ├── contract/              ✅ voyage-types.ts + catalog-types.ts
│   ├── physics/lorentz.ts     ✅ S7 γ = 1/√(1-β²) 泰勒分段，11 tests
│   ├── navigation/VoyageController.ts ✅ S8 状态机 idle→running→paused→completed/aborted + snapshot↔恢复，18 tests
│   ├── data/                  ✅ S9
│   │   ├── KdTree3.ts         ✅ 手写 3D KD-Tree，partialQuickSelect + kNN 剪枝，5 tests
│   │   ├── StarCatalog.ts     ✅ 4 棵 tiered tree + 6 个 Map 索引 + 8 种 StarFilter + LOD，10 tests
│   │   ├── __fixtures__/stars-500.ts ✅ 前 31 颗真星（太阳/比邻星/天狼/北斗）+ 469 假星，距离下限 70ly 保证真星排序正确
│   │   └── __tests__/*.test.ts
│   └── index.ts               ✅ 引擎统一出口（外部 import engine 仅此一个入口）
├── storage/                   ✅ S10 基础设施层（Dexie IndexedDB，可 import Dexie，禁止 import React/Three）
│   ├── NovaDatabase.ts        ✅ NovaDatabase Dexie 子类 + v1 schema + NovaDatabase.temp<T>
│   ├── VoyageRepository.ts    ✅ save/getById/list/delete/clearAll/stats
│   ├── SettingsRepository.ts  ✅ get/getOrDefault/set/remove/bulkApply/resetToDefaults + DEFAULT_SETTINGS
│   └── __tests__/repositories.test.ts ✅ 集成测试 2 describe × 5 it（fake-indexeddb 全路径真 CRUD）
├── store/                     ⏳ S11 下一步：Zustand 3 stores
│   ├── useSettingsStore.ts    ⏳
│   ├── useVoyageStore.ts      ⏳
│   └── useHistoryStore.ts     ⏳
├── components/ / pages/       ⏳ S12 下一步：React UI
├── workers/                   ⏳ S13 下一步：VoyageTimer Web Worker
├── test/setup.ts              ✅ fake-indexeddb/auto 注入 + Dexie.dependencies 绑定
├── styles/index.css           ✅ 4 套 CSS 主题 tokens（deep-space / cyberpunk / retro / minimal-light）
├── main.tsx / App.tsx         ✅ 脚手架验证页（4 主题切换 Demo 浏览器实测有效）
└── vite-env.d.ts
```

---

## 二、怎么继续开发（当前阶段：Phase 1 MVP → S11 Zustand）

### 2.1 标准开发循环（每一步都跑，避免攒一堆错误到最后）

```bash
# 0. 开新分支（严格遵守 CONTRIBUTING.md）
git checkout -b feature/S11-zustand-store

# 1. 写完代码 → 立刻跑全量校验（这是唯一入口，别只跑 test）
pnpm check

# 2. 单次调试某个文件 → 用 vitest watch
pnpm vitest src/storage --reporter=verbose

# 3. 跑端到端（S12 UI 做完以后要用）
pnpm test:e2e
```

### 2.2 当前推荐的 Phase 1 MVP 推进顺序（ROADMAP 对齐）

**下一步应该立刻做 S11 Zustand（3 stores）：**

| 顺序 | Sprint  | 目录/文件                                                                                                                                                | 验收标准                                                                                                                                                                                                                    | 依赖                                                  |
| ---- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 1    | **S11** | `src/store/useSettingsStore.ts` + `src/store/useVoyageStore.ts` + `src/store/useHistoryStore.ts` + 对应 Vitest 测试                                      | 每个 store 至少 5 个 action；VoyageStore 监听 VoyageController 的 progress/complete/abort 事件 → 自动 Dexie save；SettingsStore 启动时从 SettingsRepository `getOrDefault` 批量加载；HistoryStore 拉取 list(createdAt_desc) | S10 storage 已完成 ✅；S7~S9 engine 已完成 ✅         |
| 2    | **S12** | `src/pages/SetupPanel.tsx` + `src/pages/VoyageView.tsx` + `src/pages/ResultView.tsx` + `src/components/HistoryPanel.tsx` + `src/App.tsx` 替换脚手架 Demo | Chrome iPhone 15 Pro 竖屏不溢出；4 主题 CSS tokens 全生效（deep-space 默认 + cyberpunk/retro/minimal-light 都能切）；点按钮状态流转正确；先用 Canvas 2D 画简单星流（R3F 放 S16）                                            | S11 Zustand ✅                                        |
| 3    | **S13** | `src/workers/voyage-timer.worker.ts` + `VoyageController.tick()` 支持外部注入 wallClock                                                                  | Chrome DevTools Throttle CPU 4x + 切换 Tab 后台 5 分钟 → 倒计时误差 < 2s；崩溃刷新后 `fromSnapshot` 自动 resume running                                                                                                     | S8 已有 fromSnapshot ✅；S11 有 persisted snapshot ✅ |
| 4    | **S14** | `.github/workflows/ci.yml` + `tests/e2e/mvp.spec.ts`（2 条 Playwright：pomodoro 1min 跑通 + 刷新 history 仍在）                                          | PR push 自动跑 pnpm check + pnpm build + playwright 3 浏览器；不过不允许 merge                                                                                                                                              | ESLint/Playwright 已配 ✅                             |
| 5    | **S15** | `public/manifest.json` + `vite-plugin-pwa`（基础 Service Worker 缓存 dist）+ README 用户使用指引章节                                                     | 手机 Safari「添加到主屏幕」可离线打开；朋友测试 10 人次 0 崩溃；首屏 < 2s，dist < 500KB                                                                                                                                     | manualChunks 已配 ✅；4 主题 CSS 已配 ✅              |

**v0.1 MVP 完成标志**：陌生人拿到链接 → 打开页 → 选 25min → 点启动 → 专注 → 结束 → 看历史 → 刷新不丢数据。

### 2.3 Phase 2/3 远期提醒（如果已经做到 S15 以后）

- **S16 R3F 星空**：`src/engine/renderer/` 下写，**这是 engine 目录唯一允许 import three/R3F 的子目录**（no-restricted-imports 规则已对 `src/engine/renderer/**` 开白名单，在 eslint.config.js 里找）。StarCatalog 直接传 `allStars` 给渲染器，Points + ShaderMaterial 按光谱 OBAFGKM 着色。
- **S20 γ 视觉**：直接复用 S7 `lorentzFactor(v)`，把 γ 值当 uniform 传给 fragment shader 做 Doppler 红移蓝移 + 光行差畸变；S9 StarCatalog 的 `findInRadius(origin, 10000)` 每帧取周围星做 GPU 计算。
- **S29 Gaia 百万星**：S9 StarCatalog 的 tier 体系就是为这个铺的——`tier3-gaia-million` 单独建 KDTree，用 [Stars.ts](https://github.com/pmndrs/drei/blob/master/src/core/Stars.tsx) 类似的 GPU BufferGeometry，别 CPU 渲染百万个 Sprite。

---

## 三、开发注意事项（避免踩坑 checklist）

### 3.1 踩过的坑（绝对不要重复）

| #   | 坑现象                                                                    | 根因                                                                                | 现在怎么规避                                                                                                                                                                            |
| --- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `git push` 报 No remote                                                   | 之前没 origin                                                                       | 已经设好 `https://github.com/JasonSun2009CN/Nova.git`，直接 `git push`；再出问题用 `git remote -v` 查                                                                                   |
| 2   | ESLint 报 import-x invalid interface                                      | import-x peer 依赖多 + resolver 冲突                                                | 已处理：规则里的 `import/order`/`import/no-cycle`/`import/no-duplicates` 全置 `off`；**别再试图启用这三个规则**                                                                         |
| 3   | ESLint 9 Flat Config 报 `--ext not supported`                             | 从 ESLint 8 迁 9 没改 scripts                                                       | `package.json scripts.lint` 里已去掉 `--ext`；只用 `eslint .`（Flat Config 自动发现 eslint.config.js）                                                                                  |
| 4   | Vitest VoyageController 用 fakeTimers 时间不流动                          | 当时 wallNow 用 performance.now()，Vitest fakeTimers 只 mock Date.now()             | **VoyageController 内部 wallNow 永远只调用 `Date.now()`**，改回 performance.now 测试立刻全红；别碰 wallNow                                                                              |
| 5   | TS strict `noUncheckedIndexedAccess` 14 个 type error 一起出              | 数组 `arr[i]` 不判空 + 枚举映射 `obj[key]` 不判空                                   | 两种方法：① 用 `arr[i]!`（确定存在时）② 用 helper 函数 `axisAt()` 返回 `as const`；KdTree3 里有现成例子看 `AXIS[depth % K] → axisAt()`                                                  |
| 6   | StarCatalog `FindNearestResult<Star>` 约束不满足泛型 `T extends KdPoint3` | Star 类型没有 x/y/z，强行 extends 破坏字段纯度                                      | **StarCatalog 内部包装了 CatalogPoint `Object.assign(star, {x,y,z})` 内部用，返回值用独立 `StarNearestHit` 类型**（不暴露 x/y/z）；别改 Star 加 x/y/z，破坏 22 字段 Gaia 对齐           |
| 7   | StarCatalog findNearest k=8 第 0 名竟然是太阳自己 + 中间插假星乱序        | ① fixture 里太阳就在原点 0ly；② 假星 tier1-nearby-100ly 距离下限 8ly < 8.307 拉兰德 | fixture 的假星 tier1 下限是 **70ly**（8~70 只有真星）保证天文排序干净；测试断言「第 0 名 = hip-sol（出发原点），第 1 名起 Proxima 4.246ly」—— 这是业务真理，不要改 fixture 把太阳挪出去 |
| 8   | findByHip(71681) 明明 fixtures 有 hip-71681 却返回 undefined              | 之前只写 `id='hip-71681'`，`Star.hipId:number` 字段没填                             | fixtures 里 `protoToStar()` 现在正则自动抽 `id=/hip(-fake)?-(\d+)/ → hipId=数字`；新增恒星时保持 id 命名规范，不用手动填 hipId                                                          |
| 9   | pnpm build manualChunks 改乱后首屏 2MB+                                   | 没按 vite.config.ts 的 5 分包策略                                                   | vite.config.ts manualChunks 分 5 包：`react-vendor / three-vendor / engine-core / dexie-utils / app-shell`；改手动分包一定先看现有策略                                                  |
| 10  | Playwright e2e scaffold 跑通报 `page closed`                              | webServer Vite 启动超时                                                             | playwright.config.ts webServer.timeout 已设 120s；本地没先跑 `pnpm build` 也别慌，Playwright 会自动 `pnpm dev` 起 5173                                                                  |

### 3.2 严格的分层禁令（ESLint 会自动卡住，卡死了别硬绕）

1. **引擎层禁令**：`src/engine/**` 除了 `src/engine/renderer/**`，**绝对不能**：
   - `import React from 'react'` / `import * as THREE` / `import { Canvas } from '@react-three/fiber'`
   - `import Dexie from 'dexie'` / 任何 storage 层文件
   - 任何 `import { useState } from 'react'` 的痕迹
2. **Storage 层禁令**：`src/storage/**` **不能** import React / Three。只能 import `@/contract/*` + `@/engine/contract/*` + `dexie`。
3. **Store 层禁令**：`src/store/**`（S11 即将写）不能 import Three / R3F。状态桥只能接 engine（纯 TS）+ storage（Dexie）+ contract 类型。
4. **UI 层禁令**：React 组件**不要**直接 `import { VoyageController } from '@/engine'`；所有操作**必须经过 Zustand store**，否则会导致：组件卸载时 controller 没 dispose → 内存泄漏 → 监听 progress 多次触发。
5. **通用禁令**：
   - 别加注释（除非用户 / ADR 明确要求）—— 现有代码风格 0 注释，保持一致
   - 别用 emoji 写代码（仅 README / 文档 / 测试 `it()` 的文本描述可以用）
   - 相对路径 `../../` 超过两层就换成 `@/别名`；ESLint 会报错，但最好事前就遵守
   - 所有 `Star` 的 `spectral.type` 枚举必须用 `SpectralType`，禁止手写字符串；星座 IAU 必须用 `CONSTELLATION_IAU_CODES[number]` 做变量

### 3.3 怎么安全写测试（Vitest + Playwright）

- **Vitest 单测**：
  - 所有测试文件命名 `__tests__/<Name>.test.ts`（tsx 只测组件）
  - 引擎层 / storage 层测试**不要写 any browser API**（`localStorage`、`window`、`document`），保证 fakeTimers 下 Node 能跑
  - Dexie 测试：用 `NovaDatabase.temp<T>('nova-xxx', async (db) => {...})`，**绝对不要共用 DB 名**，每个 it 用不同名字，用完自动 delete
  - 引擎层不要 mock Date.now() 以外的任何东西；StarCatalog 真跑 KD-Tree 300 点 brute-force 对拍就是目前最稳的方案，**不要 mock build**
  - CI 覆盖率目标：`engine/**` 行覆盖率 ≥ 90%（S7 91%，S8 96%，S9 自己算时别低于 85%）
- **Playwright E2E**：
  - 测试文件放 `tests/e2e/*.spec.ts`，别混 src
  - 用 `page.clock.install()` + `page.clock.fastForward(60_000)` 模拟专注 1 分钟，**别真 sleep 60s**
  - 每个 describe 开头 `await page.goto('/')`，结束前回到首页避免状态污染

### 3.4 命名规范（避免 review 时一堆命名问题）

| 领域                  | 前缀                                                                                              | 例子                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| VoyageController 状态 | idle / running / paused / completed / aborted                                                     | `VoyageStatus` 不要改枚举名字                                                  |
| 星表 tier             | tier0-solar / tier1-nearby-100ly / tier2-bright-mag6 / tier3-gaia-million                         | CatalogTier 字面量类型不要改                                                   |
| Store action 动词     | `start` / `pause` / `resume` / `abort` / `save` / `load` / `updateSettings` / `selectDestination` | 别用同义词 toggle/change/apply，保持与 VoyageController 5 种 EventMap 命名一致 |
| 文件命名              | kebab-case：`voyage-timer.worker.ts` / `star-catalog-utils.ts`                                    | React 组件是唯一 PascalCase：`SetupPanel.tsx`                                  |
| 常量（非类型）        | CONST_CASE                                                                                        | `DEFAULT_SETTINGS` / `DB_VERSION_V1` / `LIGHT_SPEED`                           |
| 类型 / 类 / 接口      | PascalCase                                                                                        | `VoyageRecord` / `NovaDatabase`                                                |
| 测试 `it()` 描述      | 中文 + 业务语义，别写 `should work`                                                               | `it('比邻星 4.246ly > 半人马α A/B 4.36ly > 巴纳德星 5.96ly 真实排序正确')`     |

---

## 四、快速自测 Checklist（每次提交 PR 前自查）

- [ ] `pnpm check` 4/4 全过（lint / typecheck / test / format）—— 任何 1 项红都别 push
- [ ] 没有新增任何 `// 注释`、`/* 注释 */`（业务文档注释只允许写 ADR / README）
- [ ] 引擎层 `src/engine/**`（除 renderer）的新文件里 `grep -E 'from "react"|from "three"'` 0 命中
- [ ] Store 层 / UI 层没有**绕过 Zustand** 直接调用 VoyageController.start()
- [ ] Storage 层新代码只 import 了 `@/contract/*` / `@/engine/contract/*` / `dexie`
- [ ] StarCatalog 的 `findNearest(origin, k=9)` 断言 Proxima 4.246ly 仍在第 1 位（改 fixture 后必跑这个）
- [ ] 代码变量命名遵循 3.4 规范，无中文变量 / 随意命名
- [ ] commit message 通过 commitlint（`feat(S11): add useSettingsStore with default hydration` 格式）
- [ ] 新建了文件 → 路径别名正确（用 `@/store/xxx` 而不是 `../../store/xxx`）
- [ ] 提交前 `git status` 确认没把 `node_modules/` / `.env` / `dist/` 意外 add（.gitignore 已写，但自己 double check）

---

## 五、如果卡住怎么办（Debug 优先级）

1. 先 `grep -r` 代码库搜类似模式——引擎层/存储层/类型层的 ADR 模式都在：
   - 纯 TS EventEmitter 模式 → 看 [VoyageController.ts](file:///Users/fiona/Documents/trae_projects/Nova/src/engine/navigation/VoyageController.ts)
   - Dexie CRUD + 集成测试模式 → 看 [VoyageRepository.ts](file:///Users/fiona/Documents/trae_projects/Nova/src/storage/VoyageRepository.ts) 和 [repositories.test.ts](file:///Users/fiona/Documents/trae_projects/Nova/src/storage/__tests__/repositories.test.ts)
   - 手写树算法 + brute-force 对拍 → 看 [KdTree3.ts](file:///Users/fiona/Documents/trae_projects/Nova/src/engine/data/KdTree3.ts) 和 KdTree3.test.ts
2. 再看 ADR / ROADMAP 对应条目——设计文档永远比代码先行，90% 的「为什么不这样做」在 ADR 里有明确结论
3. 如果是 ESLint / TS typecheck 报错：**先 `pnpm lint:fix` / `pnpm format` 自动修一轮**，再看剩下的（大概能自动修 70% 问题）
4. 真遇到架构级抉择（例如要不要把 tier3 百万星改成 WASM、要不要引入 RxJS 替代 EventEmitter3）：**先开新 ADR 再写代码**，按 CONTRIBUTING.md 的 ADR 流程

---

**交接完成祝语**：祝接手 Agent 星辰大海顺遂。Nova 的引擎层已经是可测试、可扩展、低耦合的干净底座，UI + R3F 接上就能开花。🚀
