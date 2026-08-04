# Nova · 工程交接须知（Agent 接手必读）

> 项目名称：**Nova · 星际专注软件**
> 技术栈：**Vite 5 + React 18 + TypeScript strict（noUncheckedIndexedAccess）+ Tailwind CSS 4（单一暗色 Neutral 主题）+ R3F/Three.js + Zustand + Dexie IndexedDB + Vitest + fake-indexeddb + Playwright + ESLint 9 Flat Config + Tauri 2（骨架已配）**
> 本文件只讲「读哪里 / 怎么继续 / 注意事项」，不讲业务背景（背景去 README / ROADMAP / ADR）。

---

## ⚠️ 当前进度（2026-08-03 交接）

- **Phase 1 MVP（S11~S15）已全部完成**：Zustand 状态层 / React UI / Web Worker 计时 + 崩溃恢复 / CI + e2e / PWA 离线。
- **Phase 2 已交付（S16+S17）**：R3F 3D 星空渲染器 + **星图弹窗交互**（点星 → 确认设目的地 + 当前位置标记）。
- **用户驱动变更**：UI 极简克制化重设计、星际航行术语弹窗、**单一暗色 Neutral 主题（删除原 4 套主题，见 ADR-0009）**。
- **macOS 打包**：Tauri 2 骨架已配好（`src-tauri/`），**Rust 未装**，`pnpm tauri build` 待用户装 Rust 后跑。
- **当前分支**：`feature/S16-starmap-renderer`；S17 改动已完成并本地验证（`pnpm check` 4/4、e2e 全绿、143 单测），**未 commit（等用户确认）**。

---

## 〇、用户偏好（必须遵守）

1. **不要自动 git commit** —— 写完代码、跑完验证后，把改动/截图展示给用户，等用户确认后再提交。用户经常自己提交（用 GUI），所以不要抢着 commit。
2. **UI 方向 = 极简克制**（用户明确选择，Linear/Apple 风）：大留白、细字重、零装饰、平按钮、发丝线分隔。**不要**加星云光斑/辉光/shimmer 之类花哨背景元素——用户明确说"背景圆圈干扰视线，都去掉"。
3. **单一暗色 Neutral 主题，无主题切换**（ADR-0009）：近黑灰阶 + 金色强调色；`data-theme` 恒为 `neutral`。用户因「暖色背景 + 黑色星图不搭」砍掉 4 套主题，别再加回主题切换。
4. 用户不是大众用户，审美有要求，UI 改动做完要展示截图等确认。

---

## 一、先读什么（30 分钟快速上手顺序）

### 1.1 总览与路线图（业务 & 阶段验收标准）

1. [README.md](file:///Users/fiona/Documents/trae_projects/Nova/README.md) — 项目定义、技术选型原因、用户故事、**用户使用指引**。
2. [docs/ROADMAP.md](file:///Users/fiona/Documents/trae_projects/Nova/docs/ROADMAP.md) — **唯一的阶段验收依据**。Phase 1 MVP 验收已全部勾选。当前在 **Phase 2 星图导航系统（v0.2）**：WebGL 星空渲染、星表集成、交互（拖拽/缩放/点星/搜索）、导航（设目的地/当前位置）。每次接事先看对应 Phase 的 Acceptance Criteria，别自己加 scope。
3. [docs/adr/README.md](file:///Users/fiona/Documents/trae_projects/Nova/docs/adr/README.md) + 8 份 ADR — **所有「为什么这么做」全在这**。尤其是 **ADR-003 分层架构**（引擎 vs 渲染 vs UI vs 数据 vs 基础设施严格隔离，不允许跨层 import）。

### 1.2 开发规范 & 工程化（写代码前必读，避免 CI 红）

1. [docs/CONTRIBUTING.md](file:///Users/fiona/Documents/trae_projects/Nova/docs/CONTRIBUTING.md) — 提交流程、分支命名 `feature/S{nn}-xx`、PR 模板、commitlint 强制 Conventional Commits。
2. [docs/DEVELOPMENT.md](file:///Users/fiona/Documents/trae_projects/Nova/docs/DEVELOPMENT.md) — 环境要求 + 全部常用命令：`pnpm install` / `pnpm dev` / `pnpm check` / `pnpm test` / `pnpm test:e2e` / `pnpm build` / `pnpm preview` / `pnpm tauri`。
3. [eslint.config.js](file:///Users/fiona/Documents/trae_projects/Nova/eslint.config.js) — 注意两处：
   - **no-restricted-imports**：`src/engine/**`（除 `src/engine/renderer/**`）禁止 import `react` / `three` / `@react-three/*` / `dexie`。引擎层纯 TS。
   - **renderer 白名单**：`src/engine/renderer/**` 的 `react/no-unknown-property` 已放行 R3F 属性（attach/args/vertexShader 等），**别乱改**。
4. [tsconfig.json](file:///Users/fiona/Documents/trae_projects/Nova/tsconfig.json) — `strict: true` + `noUncheckedIndexedAccess: true`。数组访问 `arr[i]!` 或先判空。
5. [package.json](file:///Users/fiona/Documents/trae_projects/Nova/package.json) — `only-allow pnpm`，**别用 npm/yarn**。全部依赖已装（three/R3F/drei、dexie、zustand、vite-plugin-pwa、@tauri-apps/cli）。
6. [vite.config.ts](file:///Users/fiona/Documents/trae_projects/Nova/vite.config.ts) — 12 个路径别名（`@/` → `src/`、`@/engine/*`、`@/contract/*`、`@/store/*`、`@/components/*`、`@/pages/*`、`@/styles/*`、`@/test/*`、`@/workers/*`、`@/utils/*`、`@/data/*`、`@/assets/*`）。所有 import 用别名，禁止相对路径 `../../`。manualChunks 分 4 包（react / three / state / db）；**`src/pages/StarMapView.tsx` 在 App 里是 React.lazy 懒加载**（three/R3F 967KB 只进星图，不进主包）。

### 1.3 分层架构图（当前已交付的模块位置）

```
src/
├── contract/                  ✅ 跨层共享类型（只含 type/interface，0 运行时）
│   ├── storage-types.ts       ✅ VoyageRecord / SettingsEntry / SettingsValueMap
│   └── worker-types.ts        ✅ VoyageTimerWorkerRequest/Response（S13）
├── engine/                    ✅ 引擎层（纯 TS，0 React / 0 Three / 0 Dexie，renderer 例外）
│   ├── contract/              ✅ voyage-types.ts + catalog-types.ts（Star/SpectralType/CatalogTier）
│   ├── physics/lorentz.ts     ✅ S7 γ = 1/√(1-β²) 泰勒分段，11 tests
│   ├── navigation/VoyageController.ts ✅ S8 状态机 + snapshot↔恢复 + S13 tick(wallTime?)/setExternalTicker，22 tests
│   ├── data/                  ✅ S9
│   │   ├── KdTree3.ts         ✅ 手写 3D KD-Tree，5 tests
│   │   ├── StarCatalog.ts     ✅ 4 tiered tree + 6 索引 + 8 StarFilter + LOD，10 tests
│   │   ├── __fixtures__/stars-500.ts ✅ STARS_500_FIXTURE（前 31 真星 + 469 假星）
│   │   └── __tests__/*.test.ts
│   ├── renderer/              ✅ S16 R3F 星空（唯一允许 import three/R3F 的子目录）
│   │   ├── star-colors.ts     ✅ 光谱 OBAFGKM → 颜色（黑体近似），纯函数
│   │   ├── build-star-points.ts ✅ 星 → position/color/size Float32Array，纯函数
│   │   ├── StarField.tsx      ✅ `<points>` + 自定义 ShaderMaterial（圆点、越近越大=视差）
│   │   └── __tests__/         ✅ 9 tests（star-colors 5 + build-star-points 4）
│   └── index.ts               ✅ 引擎统一出口（纯 TS，**不含 renderer**）
├── storage/                   ✅ 基础设施层（Dexie + localStorage）
│   ├── NovaDatabase.ts        ✅ Dexie 子类 + v1 schema + temp<T>
│   ├── VoyageRepository.ts    ✅ save/getById/list/delete/clearAll/stats
│   ├── SettingsRepository.ts  ✅ get/getOrDefault/set/remove/bulkApply/resetToDefaults
│   ├── live-voyage-storage.ts ✅ S13 localStorage 崩溃恢复快照（仅 running/paused 可恢复）
│   └── __tests__/             ✅ repositories + live-voyage-storage
├── store/                     ✅ S11 Zustand 3 stores
│   ├── useSettingsStore.ts    ✅ load/updateSettings/setTheme/...（hydrate 自 Dexie）
│   ├── useVoyageStore.ts      ✅ S11+S13：worker 桥接 + 崩溃恢复 + fastForwardVoyageForTest
│   ├── useHistoryStore.ts     ✅ load/refresh/delete/clearAll/loadPage
│   ├── store-deps.ts          ✅ getStoreDeps/setStoreDepsForTest
│   └── __tests__/             ✅ 含 useVoyageStoreTimer（worker 模式集成）
├── workers/                   ✅ S13 voyage-timer.worker.ts（后台每 250ms 广播 tick）
├── data/                      ✅ destination-stars.ts（星图目的地下拉的真星数据）
├── components/                ✅ React 组件
│   ├── SetupPanel 相关的…      （见 pages）
│   ├── VoyageStarFlow.tsx     ✅ Canvas 2D 星流（航行视图背景）
│   ├── SpaceBackdrop.tsx      ✅ 纯渐变背景层（用户要求极简，**不要加装饰**）
│   ├── HistoryPanel.tsx       ✅ 航行日志列表
│   ├── GlossaryDialog.tsx     ✅ 星际航行术语弹窗（γ/光年/时间膨胀等 8 词条）
│   └── StarMap/
│       └── StarInfoCard.tsx   ✅ 点星确认卡（详情 + 设为目的地/取消/完成）
├── pages/
│   ├── SetupPanel.tsx         ✅ 设置面板（时长/目的地/速度 + 启动）
│   ├── VoyageView.tsx         ✅ 航行视图（倒计时/指标/进度/暂停结束）
│   ├── ResultView.tsx         ✅ 结果视图
│   ├── StarMapDialog.tsx      ✅ S17 星图弹窗外壳（顶栏 + 当前位置图例 + Esc 关闭）
│   └── StarMapView.tsx        ✅ S16+S17 3D 星图（Canvas + 分层渲染 + 拾取 + 标记，弹窗内）
├── test/                      ✅ setup.ts（fake-indexeddb + canvas stub + matchMedia stub）+ dev-hooks.ts（__TEST_ONLY__.fastForward / getStarScreenPosition / setAutoRotate）+ star-map-hooks.ts
├── styles/index.css           ✅ 单一 Neutral 主题 tokens（暗色灰阶 + 金色强调）+ Space Grotesk @font-face
├── main.tsx / App.tsx         ✅ App：idle 主视图（设置/日志）+ 星图弹窗 + 术语弹窗 + data-theme=neutral
├── utils/format.ts            ✅ formatDurationMs/formatLy/formatGamma/... + 17 tests
└── vite-env.d.ts              ✅ Window.__TEST_ONLY__ 增强（declare global interface Window）
```

**Tauri（macOS 打包，骨架已配，未构建）**：`src-tauri/`（tauri.conf.json 指向 `../dist`、Cargo、icons、capabilities）。Rust 未装，`pnpm tauri dev/build` 需先 `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`。

---

## 二、怎么继续开发（当前阶段：Phase 2 星图导航，S16+S17 已完成）

### 2.1 标准开发循环

```bash
# 0. 开新分支（严格遵守 CONTRIBUTING.md）
git checkout -b feature/S17-xxx

# 1. 写完代码 → 立刻跑全量校验（唯一入口，别只跑 test）
pnpm check

# 2. 单次调试某个文件 → vitest watch
pnpm vitest src/engine/renderer --reporter=verbose

# 3. 端到端（3 浏览器；starmap 测试仅 chromium）
pnpm test:e2e
```

### 2.2 当前已完成（S11~S17 + 用户驱动增量）

| Sprint | 内容                                                      | 状态                     |
| ------ | --------------------------------------------------------- | ------------------------ |
| S11    | Zustand 3 stores                                          | ✅ 7/10/6 actions + 测试 |
| S12    | React UI（Setup/Voyage/Result/History + App 路由）        | ✅                       |
| S13    | Web Worker 计时 + localStorage 崩溃恢复                   | ✅                       |
| S14    | GitHub Actions CI + mvp.e2e（3 浏览器）                   | ✅                       |
| S15    | PWA 离线 + manifest + README 指引                         | ✅                       |
| S16    | R3F 3D 星空渲染器 + 星图视图（懒加载）                    | ✅                       |
| S17    | 星图弹窗 + 点星确认设目的地 + 当前位置标记（+ 拾取/分层） | ✅                       |
| 增量   | UI 极简克制化重设计 + 术语弹窗 + 单一暗色 Neutral 主题    | ✅                       |

**验证基线**：`pnpm check` 4/4（**143 单测**，19 test files）；e2e 3 浏览器全过（starmap 仅 chromium）；`pnpm build` 主包 ~64KB（three 967KB 懒加载进星图弹窗 chunk）。

### 2.3 下一步（Phase 2 星图导航，按 ROADMAP）

Phase 2 目标是 **v0.2 星图导航**：真实星图 + 选目的地 + 专注。S16 渲染 + S17 弹窗交互已完成。接下来按 ROADMAP 2.1/2.2 推进，建议顺序：

| 顺序 | 内容                                                                   | 说明                                                                              |
| ---- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 1    | ~~星图交互：点星信息卡 + 设为目的地 + 当前位置标记~~（**已交付 S17**） | 弹窗内拾取 + 确认卡；`__TEST_ONLY__.getStarScreenPosition` 驱动 e2e               |
| 2    | **星表数据集成**：内嵌 50ly 内完整星表（~1800 颗）替代 500 fixture     | 数据分块 JSON + IndexedDB 缓存（ROADMAP 2.1）；`DESTINATION_STARS` 届时改用真星表 |
| 3    | **导航系统**：选目的地 → 反推所需专注时长 / 推荐目的地                 | 复用 `travelDistance` + γ；确认卡里可显示预计专注时长                             |
| 4    | 搜索、定位当前、多级跃迁                                               | 远期                                                                              |

**远期**：S20 γ 视觉（Doppler 红移蓝移 uniform）；S29 Gaia 百万星（tier3 单独 KDTree + GPU BufferGeometry）。

---

## 三、开发注意事项（避免踩坑 checklist）

### 3.1 踩过的坑（绝对不要重复）

| #   | 坑现象                                               | 根因                                                                      | 现在怎么规避                                                                                                     |
| --- | ---------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1   | `git push` 报 No remote                              | 之前没 origin                                                             | `https://github.com/JasonSun2009CN/Nova.git` 已设                                                                |
| 2   | ESLint import-x invalid interface                    | import-x peer 冲突                                                        | `import/order`/`import/no-cycle`/`import/no-duplicates` 全置 `off`，**别再启用**                                 |
| 3   | ESLint 9 `--ext not supported`                       | 脚本残留 `--ext`                                                          | 只用 `eslint .`                                                                                                  |
| 4   | Vitest fakeTimers 时间不流动                         | wallNow 用了 performance.now()                                            | **VoyageController.wallNow 永远只用 Date.now()**，别碰                                                           |
| 5   | TS `noUncheckedIndexedAccess` 一堆 type error        | 数组访问不判空                                                            | `arr[i]!` 或 helper `as const`                                                                                   |
| 6   | StarCatalog 泛型约束不满足                           | Star 没有 x/y/z                                                           | 内部 `CatalogPoint` 包装，别给 Star 加 x/y/z                                                                     |
| 7   | findNearest k=8 第 0 名是太阳                        | fixture 太阳在原点                                                        | 假星 tier1 下限 70ly；「第 0 = hip-sol，第 1 = Proxima」是业务真理                                               |
| 8   | findByHip 返回 undefined                             | 只填 id 没填 hipId                                                        | `protoToStar()` 自动抽 hipId                                                                                     |
| 9   | manualChunks 改乱后首屏 2MB+                         | 没按分包策略                                                              | vite.config.ts 4 包；**别把 three 塞进主包**                                                                     |
| 10  | Playwright e2e 报 page closed                        | webServer 启动超时                                                        | webServer.timeout 120s 已设                                                                                      |
| 11  | **fake-indexeddb + vi.useFakeTimers 挂起**           | fake-indexeddb 用 setImmediate/setTimeout 提交事务，被 fakeTimers mock 掉 | **测试里用 `vi.useFakeTimers({ toFake: ['setInterval','clearInterval','Date'] })`**，Dexie 的 macrotask 保持真实 |
| 12  | **jsdom 里 canvas.getContext 抛 "Not implemented"**  | jsdom 无 canvas 包                                                        | `src/test/setup.ts` 已 stub getContext 返回 null；组件里也 try/catch                                             |
| 13  | **R3F Canvas 只占屏幕顶部一小条**                    | Canvas 的 `height:100%` 对 flex 撑起的高度解析失败 → canvas 默认 150px    | **把 `<Canvas>` 包进 `<div className="absolute inset-0">`**（有确定高度可解析）；见 StarMapView.tsx              |
| 14  | **星图 e2e 首次跑超时**                              | Vite 首次按需优化 three 很慢（冷加载）                                    | starmap.spec 断言给 20s timeout；`test.skip` 非 chromium（WebGL 无头仅 chromium 可用）                           |
| 15  | **GUI 提交后其实没 commit**                          | 用户用 GUI commit 有时只 stage 没 commit                                  | 接手时先 `git log -1` + `git status` 确认；发现 staged 未提交要提醒用户                                          |
| 16  | **星图弹窗 e2e 的 `getByText(/织女/)` 命中多个元素** | 弹窗模式下 SetupPanel 仍渲染在 DOM 后面，其目的地下拉 option 也有「织女」 | 星图断言**限定在 `getByTestId('star-info-card')` 内**；别裸用 getByText 匹配星名                                 |
| 17  | **旧主题值（retro 等）残留 IndexedDB**               | 主题收敛为单一 `neutral`                                                  | `useSettingsStore.load()` 迁移 coerce 为 `neutral` 并回写（有单测覆盖）                                          |

### 3.2 严格的分层禁令（ESLint 卡死别硬绕）

1. **引擎层** `src/engine/**`（除 renderer）：禁 import react/three/R3F/dexie。
2. **Storage 层** `src/storage/**`：禁 import React/Three；只 import `@/contract/*` + `@/engine/contract/*` + dexie。
3. **Store 层** `src/store/**`：禁 import Three/R3F；状态桥只接 engine + storage + contract。
4. **UI 层**：React 组件**不要**直接 `import { VoyageController } from '@/engine'`；一切操作走 Zustand store。
5. **通用**：别加注释（除非用户/ADR 要求）；别用 emoji 写代码；相对路径超两层换 `@/别名`；`SpectralType` 枚举必须用类型。

### 3.3 怎么安全写测试

- **Vitest**：命名 `__tests__/<Name>.test.ts`；引擎/storage 层别写浏览器 API（除非 S13 store worker 测试用 stub）；Dexie 用 `NovaDatabase.temp` 且每 it 不同 DB 名；**fake timers 见坑 11**；R3F 组件 jsdom 测不了（无 WebGL）→ 纯函数单测 + Playwright 冒烟。
- **Playwright**：`tests/e2e/*.spec.ts`；**快进计时用 `window.__TEST_ONLY__.fastForward(ms)`**（dev-hooks 已实现，注入 `VoyageController.tick`），**别用 page.clock**（S13 后计时走 Web Worker，clock 控制不了）；WebGL 测试只跑 chromium。

### 3.4 命名规范

| 领域                  | 规则                                   | 例子                                |
| --------------------- | -------------------------------------- | ----------------------------------- |
| VoyageController 状态 | idle/running/paused/completed/aborted  | `VoyageStatus`                      |
| 星表 tier             | tier0-solar/.../tier3-gaia-million     | `CatalogTier`                       |
| Store action 动词     | start/pause/resume/abort/save/load/... | 与 EventMap 一致                    |
| 文件命名              | kebab-case                             | `voyage-timer.worker.ts`            |
| React 组件            | PascalCase.tsx                         | `SetupPanel.tsx`                    |
| 常量                  | CONST_CASE                             | `DEFAULT_SETTINGS`                  |
| 测试 it()             | 中文 + 业务语义                        | `it('比邻星 4.246ly 真实排序正确')` |

---

## 四、快速自测 Checklist（每次提交 PR 前自查）

- [ ] `pnpm check` 4/4 全过
- [ ] 没有新增注释（业务注释只允许 ADR/README）
- [ ] 引擎层（除 renderer）`grep -E 'from "react"|from "three"'` 0 命中
- [ ] UI 层没绕过 Zustand 直接调 VoyageController
- [ ] Storage 层只 import contract + dexie
- [ ] 没破坏 `findNearest(origin, 9)` 的「第 0=太阳，第 1=Proxima」断言
- [ ] 命名遵循 3.4，无中文变量
- [ ] `data-theme` 恒为 `neutral`，无主题切换 UI（ThemeToggle 已删）
- [ ] commit message 过 commitlint
- [ ] `git status` 确认没误 add node_modules/dist
- [ ] **UI 改动做完给用户看截图，等确认再提交**（见「〇、用户偏好」）

---

## 五、如果卡住怎么办（Debug 优先级）

1. `grep -r` 找相似模式：
   - 纯 TS EventEmitter → `src/engine/navigation/VoyageController.ts`
   - Dexie CRUD + 集成测试 → `src/storage/VoyageRepository.ts` + `repositories.test.ts`
   - 手写树 + brute-force 对拍 → `src/engine/data/KdTree3.ts`
   - R3F 渲染 + ShaderMaterial → `src/engine/renderer/StarField.tsx`
   - Worker 驱动 + 崩溃恢复 → `src/store/useVoyageStore.ts` + `useVoyageStoreTimer.test.ts`
2. 看 ADR / ROADMAP 对应条目——设计文档永远比代码先行。
3. ESLint / TS 报错：先 `pnpm lint:fix` / `pnpm format` 自动修一轮。
4. 架构级抉择（WASM 百万星、RxJS 等）：**先开新 ADR 再写代码**。

---

**交接完成祝语**：祝接手 Agent 星辰大海顺遂。Nova 已完成 Phase 1 MVP + S16 星图渲染器，引擎/状态/存储/渲染分层干净，Phase 2 星图导航等你接棒。🚀
