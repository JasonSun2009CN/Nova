# Nova · 工程交接须知（Agent 接手必读）

> 项目名称：**Nova · 星际专注软件**
> 技术栈：**Vite 5 + React 18 + TypeScript strict（noUncheckedIndexedAccess）+ Tailwind CSS 4（单一暗色 Neutral 主题）+ R3F/Three.js + Zustand + Dexie IndexedDB + Vitest + fake-indexeddb + Playwright + ESLint 9 Flat Config + Tauri 2（骨架已配）**
> 本文件只讲「读哪里 / 怎么继续 / 注意事项」，不讲业务背景（背景去 README / ROADMAP / ADR）。

---

## ⚠️ 当前进度（2026-08-06 交接）

- **Phase 1 MVP（S11~S15）已全部完成**：Zustand 状态层 / React UI / Web Worker 计时 + 崩溃恢复 / CI + e2e / PWA 离线。
- **Phase 2 已交付（S16+S17）**：R3F 3D 星空渲染器 + **星图弹窗交互**（点星 → 确认设目的地 + 当前位置标记）。
- **星图双视角增量**：出发地第一人称视角（默认，站在当前位置星环视星空，圆环标记目的地）/ 上帝全览视角（太阳居中 + 以太阳为中心的半径圈 10/25/50 光年）；左缘按钮切换。当前位置（出发地）持久化于 settings `currentStarId`，航行完成后出发地 = 上次目的地。
- **用户驱动变更**：UI 极简克制化重设计、星际航行术语弹窗、**单一暗色 Neutral 主题（删除原 4 套主题，见 ADR-0009）**。
- **S18 导航增量**（已合并，PR #3 → main）：设置页目的地改用**真实星表唯一数据源**——目录就绪时下拉列出全部 ~60 颗命名星（按距离排序）、未加载回退 17 颗 `DESTINATION_STARS`，修复「星图选中非 `DESTINATION_STARS` 的星后，设置页显示无目的地」的 bug；新增 `requiredFocusMinutes`（`travelDistance` 逆运算，引擎层）与 `formatFocusEstimate`（分钟→小时→天→年），点星确认卡与设置页显示预计专注时长。
- **S19 时长滑杆 + 反推航线（已 commit `945ec2e`，分支 `feature/S19-duration-scrubber`，未合并）**：`DurationScrubber`（1~240 分钟刻度滑杆）+ 自定义分钟输入；引擎层 `cruisePlan({focusMinutes, distanceLy})` 反推所需速度 γ 与地球年（`rapidity = d/(t·c)` 双曲线式），设了目的地时设置页改显「推算速度」隐藏手动 v 滑杆；`formatVOverC` 高精度、`formatGamma` 千分位。
- **S20 星图搜索 + 推荐目的地（未 commit，等用户确认）**：`src/data/star-search.ts` `searchStars`（常用名 / bayer / flamsteed / HIP 编号 / 星座，评分排序）→ 星图弹窗顶部搜索框 `StarSearch`（下拉即选 → 弹信息卡）；`recommendDestination(options, focusMinutes)`（`cruisePlan` 反推 γ ≤ `RECOMMEND_MAX_GAMMA=50000` 的最远可达星，无可达时回退最近星）→ 设置页「推荐目的地」提示 + 选用按钮。星表加载中搜索显示「星表加载中…」而非误报无结果。
- **增量3 变动出发地（已 commit `3f39e62`，随 S21 分支未 push，ADR-0013）**：出发地 = `settings.currentStarId`（上次目的地，完成航行后已写；默认 `hip-sol`）。`SetupPanel.handleStart` 与 `ResultView.handleRestart` 不再硬编码 `hip-sol`——改为以 `currentStarId` 为 origin；规划/推荐按出发地→目的地**实际两星距离**（`src/data/destination-stars.ts` 新增 `distanceBetweenStars` leg 距离），首航（太阳系出发）退化为目的地太阳距；设置页副标题显示「出发地 → 目的地」。
- **S21 Phase 2 收尾 QA（已 commit `fbc3bae` + 空星图修复 `68c80bd`，均在 origin）**：`starmap-perf`（FPS 下限 + 无长卡顿 + 缩放/轨道/平移流畅度）+ `starmap.spec` 验收走查（半人马座α → 点星 → 设为目的地 → 航行）+ `generated-catalog` 抽样校验（13 颗已知星距离，8 单测通过）。ROADMAP 2.3 三项 + 验收标准已全部勾选。
- **S22 统一飞行模型 + 引擎 γ 分级（ADR-0012，已提交分支 `feature/S22-unified-flight-model` 未合并）**：d=β·γ·τ 单一模型（`travelDistance`/`cruisePlan`/`requiredFocusMinutes` 收拢为同族）+ `ENGINE_TIERS` 五档引擎（常规 10万 / 曲速一级 40万 / 二级 120万 / 三级 500万 / 跃迁 2000万 × 解锁条件，跃迁为里程碑）+ 可达性 API（`requiredGamma` / `minFocusMinutes` / `reachableRadiusLy` / `isReachable`，引擎层纯函数）+ 退役 `RECOMMEND_MAX_GAMMA`（`recommendDestination` 改传 γ_max）+ 推荐按默认引擎 γ_max（默认 25 分钟 → 半人马座 α A）+ SetupPanel 不可达阻止（红色警告：所需 γ / 解锁档位 / 当前引擎最短专注，禁用启动）+ StarInfoCard 信息卡改「最短专注」（比邻星 ≈22 分钟）。升级路径「还需累计专注 X 小时」随 S27（跨历史 stats 聚合器）。
- **S23 航行视图真实星表化 + S25 仪表盘提前（ADR-0011 修订 + ADR-0014，已提交分支 `feature/S23-voyage-real-stars` 未合并）**：VoyageView 从 Canvas 2D 抽象星流升级为 R3F（`React.lazy` 懒加载，three 967KB chunk 不进主包，build 实测主包 70KB），相机立出发地星朝目的地真实推进（封顶 98%）；**主视角 = 目的地单星居中放大（8→300px，光谱色核心 + 光晕）+ 暗星点阵背景**（StarField 撤销光行差/拖尾、加 opacity 0.3/sizeScale 0.5）；`VoyageStarFlow` 退役删除；**S25 实时仪表盘提前交付**：航行进度仪表（出发地→目的地两星 + 名称 + 金线填充 `voyage-progress-gauge`）、主/客观双时间（船上/地球已过）、速度/γ/已航行/剩余距离/ETA/引擎功率（γ÷γ_max %）。验证：259 单测 / 28 文件、e2e chromium 12 过、build exit 0。
- **S24 前向蓝移 Doppler（已提交分支 `feature/S24-doppler-blueshift` 未合并）**：`doppler.ts` 纯函数（`dopplerFactor`=γ(1+βcosθ) / `blueShiftAmount` / `blueShiftColor`，**只蓝不红**）+ StarField `doppler` prop（vertex 按前方程度算 `vDoppler`，fragment 蓝移，默认关不影响星图）+ 目的地星光晕色按 γ 蓝移（αCen γ≈91k e≈0.78 强蓝、自由漂流 0.99c e≈0.17 轻微蓝）。验证：270 单测 / 29 文件、e2e chromium 7/7、build exit 0。
- **S26 跃迁过渡动画（已提交分支 `feature/S26-warp-transition`，用户手动合并 main 中）**：`VoyagePhase` 相位状态机（launching/cruising/arriving/braking，store 同步 + App 3s 定时推进，引擎零改动）+ `warp-flow.ts` 纯函数 + 近观星流 `NearFieldFlow`（launching/braking 挂载，ADR-0014 遗留评估落地）+ 到达目标星 settle 入轨。验证：282 单测 / 30 文件、voyage e2e chromium 5/5。
- **S27 引擎解锁 + 不可达推荐（已 commit `10f7ff7` + `f93b7a3`，已合并 main PR #11）**：`getUnlockedTier(focusHours)` / `getNextUnlock(focusHours)` 纯函数（引擎层，jump 里程碑不自动解锁）+ 设置页「当前引擎」状态条（引擎名 + 下一级解锁进度/已全部解锁）+ 不可达警告加「升级路径：再累计 X 解锁下一级」+ 推荐目的地 / StarInfoCard 最短专注 / VoyageView 引擎功率表全部改用当前引擎 γ_max（数据源 `useHistoryStore.stats.totalFocusHours`，完成航行后 refresh 自动更新，解锁即时生效）+ **目的地不可达时也显示「可改选」推荐**（`recommendDestination` 返回当前引擎可达最远星）+ dev-hooks 新增 `setHistoryStatsForTest`。任务模式 UI（定时/跃迁/自由漂流）留后续。
- **S28 白噪音（已开发，分支 `feature/S28-white-noise` 未合并）**：Web Audio 合成零音频资源——`src/engine/audio/audio-engine.ts`（`AudioEngine` 单例：引擎嗡鸣双振荡器 + 频率调制、CMB 白噪音低通、脉冲星周期增益门控、launch/arrive/brake 三事件包络音效；`AudioContextLike` 接口抽象 Web Audio 供 mock 单测）+ `synthesis.ts` 纯函数（噪声 buffer / 脉冲形状）；`SoundSettingsPanel` 设置页音效区（引擎嗡鸣开关+音量、环境音 none/CMB/脉冲星 选择+音量、事件音效开关，settings 新增 `engineSoundEnabled`/`eventSoundsEnabled`/`ambientSoundType` 复用 `soundVolume`/`musicVolume`）；autoplay 规避：首次「启动航行」手势 `ensureAudioEngineStarted()` 才建 AudioContext，jsdom 无 AudioContext 守卫跳过；事件音效在 VoyageStore start/complete/abort 触发。验证：306 单测 / 31 文件、build exit 0（主包 80KB）。
- **Phase 3 重规划（本次讨论，三处文档已同步至 S38）**：S22~S38 重排——新增 **S22 统一飞行模型**（合并 `travelDistance`/`cruisePlan` 为 d=β·γ·τ + 引擎 γ_max 约束，退役 `RECOMMEND_MAX_GAMMA`，ADR-0012）；**S23 航行视图真实星表化**（修订：主视角 = 目的地单星放大 + 暗星点阵，ADR-0011 + ADR-0014，S25 仪表盘随 S23 提前）；**S24 前向蓝移 Doppler**（已交付）；**S27 引擎 γ 分级解锁** + 不可达阻止/升级路径；**砍掉瞬时跃迁**（跃迁 = 最高 γ 档）。
- **macOS 打包**：Tauri 2 骨架已配好（`src-tauri/`），**Rust 未装**，`pnpm tauri build` 待用户装 Rust 后跑。
- **当前分支**：`feature/S28-white-noise`（自 main `01c9af9` 分出；S28 已开发未 commit）。上一级链：S22~S27 已全部合并 main（S26 PR #10、S27 PR #11）。（基线：`pnpm check` 4/4、**306 单测**、31 test files，见下方 2.2。）
- **文档已同步**：ROADMAP Phase 3 加状态行 + 3.1 主视角/仪表盘/蓝移更新、ADR 索引（14 份，含 ADR-0014）、**STAGES S22/S23/S24 已标 🚧 已提交 + S25 提前**、本文件均已刷新至 S24。
- **注意**：用户在某时刻编辑了 ROADMAP，移除了 2.2 的「推荐目的地 / 多级跃迁」两个 checkbox（已按建议实施推荐目的地但保留 checkbox 移除，勿擅自加回）。

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
2. [docs/ROADMAP.md](file:///Users/fiona/Documents/trae_projects/Nova/docs/ROADMAP.md) — **唯一的阶段验收依据**。Phase 1 MVP 验收已全部勾选。当前在 **Phase 3 完整航行系统 + 相对论视觉（v0.3）**：航行视图真实星表化（S23 已交付）、实时仪表盘（S25 已交付）、引擎等级系统、跃迁过渡、白噪音。每次接事先看对应 Phase 的 Acceptance Criteria，别自己加 scope。
3. [docs/adr/README.md](file:///Users/fiona/Documents/trae_projects/Nova/docs/adr/README.md) + 14 份 ADR — **所有「为什么这么做」全在这**。尤其是 **ADR-003 分层架构**（引擎 vs 渲染 vs UI vs 数据 vs 基础设施严格隔离，不允许跨层 import）。最新 ADR-0014（航行单星放大 + S25 仪表盘提前，修订 ADR-0011）。

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
│   ├── physics/lorentz.ts     ✅ S7 γ = 1/√(1-β²) 泰勒分段；S18 requiredFocusMinutes 逆运算；S19 cruisePlan 反推航线（rapidity 双曲式）
│   ├── navigation/VoyageController.ts ✅ S8 状态机 + snapshot↔恢复 + S13 tick(wallTime?)/setExternalTicker，22 tests
│   ├── data/                  ✅ S9
│   │   ├── KdTree3.ts         ✅ 手写 3D KD-Tree，5 tests
│   │   ├── StarCatalog.ts     ✅ 4 tiered tree + 6 索引 + 8 StarFilter + LOD，10 tests
│   │   ├── star-mapper.ts     ✅ S16 赤经赤纬 → 银道坐标（J2000 常数 + X 符号修正）
│   │   ├── __fixtures__/stars-500.ts ✅ STARS_500_FIXTURE（前 31 真星 + 469 假星）
│   │   └── __tests__/*.test.ts
│   ├── renderer/              ✅ S16 R3F 星空（唯一允许 import three/R3F 的子目录）
│   │   ├── star-colors.ts     ✅ 光谱 OBAFGKM → 颜色（黑体近似），纯函数
│   │   ├── build-star-points.ts ✅ 星 → position/color/size Float32Array，纯函数
│   │   ├── pick-star.ts       ✅ 拾取（屏幕坐标 → 最近星）
│   │   ├── StarField.tsx      ✅ `<points>` + 自定义 ShaderMaterial（圆点、越近越大=视差）
│   │   ├── StarMapCameraRig.tsx / MapMarkers.tsx / RadiusGuides.tsx / PickController.tsx / FollowStarBridge.tsx ✅ 双视角相机 + 标记 + 半径圈 + 拾取
│   │   └── __tests__/         ✅ 9 tests（star-colors 5 + build-star-points 4）
│   └── index.ts               ✅ 引擎统一出口（纯 TS，**不含 renderer**）
├── storage/                   ✅ 基础设施层（Dexie + localStorage）
│   ├── NovaDatabase.ts        ✅ Dexie 子类 + v1 schema + temp<T>
│   ├── VoyageRepository.ts    ✅ save/getById/list/delete/clearAll/stats
│   ├── SettingsRepository.ts  ✅ get/getOrDefault/set/remove/bulkApply/resetToDefaults
│   ├── StarCatalogRepository.ts ✅ S18 真实星表分块 JSON + IndexedDB 缓存（sourceVersion 当缓存键）
│   ├── live-voyage-storage.ts ✅ S13 localStorage 崩溃恢复快照（仅 running/paused 可恢复）
│   └── __tests__/             ✅ repositories + live-voyage-storage
├── store/                     ✅ Zustand 4 stores
│   ├── useSettingsStore.ts    ✅ load/updateSettings/setTheme/...（hydrate 自 Dexie）
│   ├── useVoyageStore.ts      ✅ S11+S13：worker 桥接 + 崩溃恢复 + fastForwardVoyageForTest
│   ├── useHistoryStore.ts     ✅ load/refresh/delete/clearAll/loadPage
│   ├── useCatalogStore.ts     ✅ S18 星表加载状态（idle/loading/ready/error + cache/network）
│   ├── store-deps.ts          ✅ getStoreDeps/setStoreDepsForTest
│   └── __tests__/             ✅ 含 useVoyageStoreTimer（worker 模式集成）
├── workers/                   ✅ S13 voyage-timer.worker.ts（后台每 250ms 广播 tick）
├── data/                      ✅ destination-stars.ts（星图目的地下拉的真星数据；S18 目录驱动解析 destinationOptionsFromStars / findDestinationOption / starDistanceLy / starDisplayName；S20 recommendDestination 推荐最远可达星；增量3 distanceBetweenStars 两星 leg 距离）+ star-search.ts（S20 searchStars 评分搜索，常用名/bayer/flamsteed/HIP/星座）
├── components/                ✅ React 组件
│   ├── DurationScrubber.tsx   ✅ S19 专注时长滑杆（1~240 刻度 + 金线填充）
│   ├── VoyageStarFlow.tsx     ✅ Canvas 2D 星流（航行视图背景）
│   ├── SpaceBackdrop.tsx      ✅ 纯渐变背景层（用户要求极简，**不要加装饰**）
│   ├── HistoryPanel.tsx       ✅ 航行日志列表
│   ├── GlossaryDialog.tsx     ✅ 星际航行术语弹窗（γ/光年/时间膨胀等 8 词条）
│   └── StarMap/
│       ├── StarInfoCard.tsx   ✅ 点星确认卡（详情 + 设为目的地/取消/完成）
│       └── StarSearch.tsx     ✅ S20 星图搜索框（下拉即选；星表加载中显示加载态）
├── pages/
│   ├── SetupPanel.tsx         ✅ 设置面板（S18 目的地来源真实星表 + 预计专注显示；S19 时长滑杆 + 设目的地后推算速度；S20 推荐目的地提示 + 选用；增量3 出发地 = currentStarId + leg 距离规划 + 副标题显示「出发地距太阳 / 目的地距太阳 / 航行距离」三项距离）
│   ├── VoyageView.tsx         ✅ 航行视图（倒计时/指标/进度/暂停结束）
│   ├── ResultView.tsx         ✅ 结果视图
│   ├── StarMapDialog.tsx      ✅ S17 星图弹窗外壳（顶栏 + 当前位置图例 + Esc 关闭）
│   └── StarMapView.tsx        ✅ S16+S17 3D 星图（Canvas + 分层渲染 + 拾取 + 标记，弹窗内）
├── test/                      ✅ setup.ts（fake-indexeddb + canvas stub + matchMedia stub）+ dev-hooks.ts（__TEST_ONLY__.fastForward / getStarScreenPosition / setAutoRotate）+ star-map-hooks.ts
├── styles/index.css           ✅ 单一 Neutral 主题 tokens（暗色灰阶 + 金色强调）+ Space Grotesk @font-face + duration-scrubber 样式
├── main.tsx / App.tsx         ✅ App：idle 主视图（设置/日志）+ 星图弹窗 + 术语弹窗 + data-theme=neutral
├── utils/format.ts            ✅ formatDurationMs/formatLy/formatGamma/formatVOverC/formatFocusEstimate/formatMinuteLabel/... + 34 tests
└── vite-env.d.ts              ✅ Window.__TEST_ONLY__ 增强（declare global interface Window）
```

**Tauri（macOS 打包，骨架已配，未构建）**：`src-tauri/`（tauri.conf.json 指向 `../dist`、Cargo、icons、capabilities）。Rust 未装，`pnpm tauri dev/build` 需先 `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`。

---

## 二、怎么继续开发（当前阶段：Phase 2 星图导航已收尾，S16~S21 + 增量3 已完成，待合并 main 进 Phase 3）

### 2.1 标准开发循环

```bash
# 0. 开新分支（严格遵守 CONTRIBUTING.md）
git checkout -b feature/S20-xxx

# 1. 写完代码 → 立刻跑全量校验（唯一入口，别只跑 test）
pnpm check

# 2. 单次调试某个文件 → vitest watch
pnpm vitest src/engine/renderer --reporter=verbose

# 3. 端到端（3 浏览器；starmap 测试仅 chromium）
pnpm test:e2e
```

### 2.2 当前已完成（S11~S21 + 用户驱动增量 + 增量3）

| Sprint | 内容                                                                                                                                   | 状态                                                 |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| S11    | Zustand 3 stores                                                                                                                       | ✅ 7/10/6 actions + 测试                             |
| S12    | React UI（Setup/Voyage/Result/History + App 路由）                                                                                     | ✅                                                   |
| S13    | Web Worker 计时 + localStorage 崩溃恢复                                                                                                | ✅                                                   |
| S14    | GitHub Actions CI + mvp.e2e（3 浏览器）                                                                                                | ✅                                                   |
| S15    | PWA 离线 + manifest + README 指引                                                                                                      | ✅                                                   |
| S16    | R3F 3D 星空渲染器 + 星图视图（懒加载）                                                                                                 | ✅                                                   |
| S17    | 星图弹窗 + 点星确认设目的地 + 当前位置标记（+ 拾取/分层）                                                                              | ✅                                                   |
| 增量   | UI 极简克制化重设计 + 术语弹窗 + 单一暗色 Neutral 主题                                                                                 | ✅                                                   |
| 增量2  | 星图双视角（出发地/全览）+ 半径圈 + 出发地随航行更新                                                                                   | ✅                                                   |
| 增量3  | 变动出发地（出发地 = 上次目的地）+ 两星 leg 距离规划（ADR-0013）                                                                       | ✅ commit 3f39e62 未 push                            |
| S18    | 目的地数据源统一（真实星表）+ 反推预计专注时长                                                                                         | ✅ 已合并（PR #3）                                   |
| S19    | 时长滑杆 `DurationScrubber` + `cruisePlan` 反推航线                                                                                    | ✅ commit 945ec2e 未合并                             |
| S20    | 星图搜索 `searchStars`/`StarSearch` + 推荐目的地 `recommendDestination`                                                                | ✅ commit c3817bf 未合并                             |
| S21    | Phase 2 收尾 QA：perf / 验收走查 / 抽样校验，关闭 v0.2                                                                                 | ✅ commit fbc3bae + 68c80bd（已在 origin）           |
| S22    | 统一飞行模型 d=β·γ·τ + ENGINE_TIERS 五档 + 可达性 API + 退役 RECOMMEND_MAX_GAMMA + 不可达阻止（ADR-0012）                              | 🚧 commit（feature/S22-unified-flight-model 未合并） |
| S23    | 航行视图真实星表化（主视角 = 目的地单星放大 + 暗星点阵，ADR-0011 修订 + ADR-0014）+ S25 仪表盘提前（进度/双时间/速度/γ/距离/ETA/功率） | 🚧 commit（feature/S23-voyage-real-stars 未合并）    |
| S24    | 前向蓝移 Doppler：doppler.ts 纯函数 + StarField doppler prop（只蓝不红）+ 目的地星蓝移                                                 | ✅ 已合并 main                                       |
| S26    | 跃迁过渡动画：VoyagePhase 相位状态机 + warp-flow 纯函数 + 近观星流 + 到达入轨放大 + 三过渡标签                                         | ✅ 已合并 main（PR #10）                             |
| S27    | 引擎解锁（getUnlockedTier/getNextUnlock）+ 设置页当前引擎/升级路径 + 不可达推荐 + 推荐/最短专注/功率按当前引擎 γ_max                   | ✅ 已合并 main（PR #11）                             |
| S28    | 白噪音（Web Audio 合成：嗡鸣/CMB/脉冲星 + 三事件音效）+ 设置页 SoundSettingsPanel + autoplay 规避                                      | 🚧 已开发（feature/S28-white-noise 未合并）          |

**验证基线**：`pnpm check` 4/4（**306 单测**，31 test files）；e2e 3 浏览器 18 过 + 6 跳过（starmap/voyage WebGL 仅 chromium）；`pnpm build` 主包 ~80KB（three 967KB 懒加载进星图/航行 chunk）。

### 2.3 下一步（Phase 3 航行系统，按 ROADMAP）

Phase 2 目标是 **v0.2 星图导航**：真实星图 + 选目的地 + 专注。S16~S21 + 增量3 已全部交付（渲染 / 交互 / 双视角 / 真实星表 / 时长反推 / 搜索 / 推荐目的地 / 变动出发地 / 质量保障与验收走查），v0.2 已关闭。**S22 统一飞行模型已交付**（ADR-0012）；**S23 航行视图真实星表化 + S25 仪表盘已交付**（ADR-0011 修订 + ADR-0014）；**S24 前向蓝移已交付**；**S26 跃迁过渡动画已交付**；**S27 引擎解锁已交付**；**S28 白噪音已交付**（见上方当前进度）。下一阶段为 **S29 Phase 3 收尾**（航行视图 60fps 自动降级 / γ 数值精度对拍 / 8h 稳定性 + 验收走查，关闭 v0.3）→ Phase 4 S30 船长日志，顺序见 STAGES 第五节。以下为 Phase 2 期间的建议顺序回顾（已全部交付）：

| 顺序 | 内容                                                                                                    | 说明                                                                                                                 |
| ---- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 1    | ~~星图交互：点星信息卡 + 设为目的地 + 当前位置标记~~（**已交付 S17**）                                  | 弹窗内拾取 + 确认卡；`__TEST_ONLY__.getStarScreenPosition` 驱动 e2e                                                  |
| 2    | ~~星表数据集成：内嵌 50ly 内完整星表替代 500 fixture~~（**已交付，见 ADR-0010**）                       | 数据分块 JSON + IndexedDB 缓存；真实 HIP，`DESTINATION_STARS` 已改真星表                                             |
| 3    | ~~星图双视角 + 半径圈 + 出发地随航行更新~~（**已交付增量2**）                                           | `StarMapCameraRig` / `RadiusGuides`；settings `currentStarId`；`getViewMode` 驱动 e2e                                |
| 4    | ~~选目的地 → 反推所需专注时长~~（**已交付 S18**）+ **推荐目的地**（**已交付 S20**）                     | `requiredFocusMinutes` 逆运算 + 确认卡/设置页预计专注显示；`recommendDestination` 推荐最远可达星（无可达回退最近星） |
| 5    | ~~星图搜索（常用名 + HIP 编号）~~（**已交付 S20**）+ 定位当前 + 多级跃迁                                | `searchStars` + `StarSearch` 弹窗顶部搜索下拉即选；定位当前/多级跃迁远期                                             |
| 6    | ~~Phase 2 收尾：2.3 质量保障（60fps / 缩放平移流畅度 / 数据抽样校验）+ 验收标准走查~~（**已交付 S21**） | `starmap-perf` + `starmap.spec` 验收走查 + `generated-catalog` 抽样校验（commit `fbc3bae`）                          |

**远期**：S36 Gaia 百万星（tier3 单独 KDTree + GPU BufferGeometry）；星图「定位当前位置」一键回中 + 多级跃迁（STAGES 第六节）。

---

## 三、开发注意事项（避免踩坑 checklist）

### 3.1 踩过的坑（绝对不要重复）

| #   | 坑现象                                               | 根因                                                                                                                                                                | 现在怎么规避                                                                                                                                                   |
| --- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `git push` 报 No remote                              | 之前没 origin                                                                                                                                                       | `https://github.com/JasonSun2009CN/Nova.git` 已设                                                                                                              |
| 2   | ESLint import-x invalid interface                    | import-x peer 冲突                                                                                                                                                  | `import/order`/`import/no-cycle`/`import/no-duplicates` 全置 `off`，**别再启用**                                                                               |
| 3   | ESLint 9 `--ext not supported`                       | 脚本残留 `--ext`                                                                                                                                                    | 只用 `eslint .`                                                                                                                                                |
| 4   | Vitest fakeTimers 时间不流动                         | wallNow 用了 performance.now()                                                                                                                                      | **VoyageController.wallNow 永远只用 Date.now()**，别碰                                                                                                         |
| 5   | TS `noUncheckedIndexedAccess` 一堆 type error        | 数组访问不判空                                                                                                                                                      | `arr[i]!` 或 helper `as const`                                                                                                                                 |
| 6   | StarCatalog 泛型约束不满足                           | Star 没有 x/y/z                                                                                                                                                     | 内部 `CatalogPoint` 包装，别给 Star 加 x/y/z                                                                                                                   |
| 7   | findNearest k=8 第 0 名是太阳                        | fixture 太阳在原点                                                                                                                                                  | 假星 tier1 下限 70ly；「第 0 = hip-sol，第 1 = Proxima」是业务真理                                                                                             |
| 8   | findByHip 返回 undefined                             | 只填 id 没填 hipId                                                                                                                                                  | `protoToStar()` 自动抽 hipId                                                                                                                                   |
| 9   | manualChunks 改乱后首屏 2MB+                         | 没按分包策略                                                                                                                                                        | vite.config.ts 4 包；**别把 three 塞进主包**                                                                                                                   |
| 10  | Playwright e2e 报 page closed                        | webServer 启动超时                                                                                                                                                  | webServer.timeout 120s 已设                                                                                                                                    |
| 11  | **fake-indexeddb + vi.useFakeTimers 挂起**           | fake-indexeddb 用 setImmediate/setTimeout 提交事务，被 fakeTimers mock 掉                                                                                           | **测试里用 `vi.useFakeTimers({ toFake: ['setInterval','clearInterval','Date'] })`**，Dexie 的 macrotask 保持真实                                               |
| 12  | **jsdom 里 canvas.getContext 抛 "Not implemented"**  | jsdom 无 canvas 包                                                                                                                                                  | `src/test/setup.ts` 已 stub getContext 返回 null；组件里也 try/catch                                                                                           |
| 13  | **R3F Canvas 只占屏幕顶部一小条**                    | Canvas 的 `height:100%` 对 flex 撑起的高度解析失败 → canvas 默认 150px                                                                                              | **把 `<Canvas>` 包进 `<div className="absolute inset-0">`**（有确定高度可解析）；见 StarMapView.tsx                                                            |
| 14  | **星图 e2e 首次跑超时**                              | Vite 首次按需优化 three 很慢（冷加载）                                                                                                                              | starmap.spec 断言给 20s timeout；`test.skip` 非 chromium（WebGL 无头仅 chromium 可用）                                                                         |
| 15  | **GUI 提交后其实没 commit**                          | 用户用 GUI commit 有时只 stage 没 commit                                                                                                                            | 接手时先 `git log -1` + `git status` 确认；发现 staged 未提交要提醒用户                                                                                        |
| 16  | **星图弹窗 e2e 的 `getByText(/织女/)` 命中多个元素** | 弹窗模式下 SetupPanel 仍渲染在 DOM 后面，其目的地下拉 option 也有「织女」                                                                                           | 星图断言**限定在 `getByTestId('star-info-card')` 内**；别裸用 getByText 匹配星名                                                                               |
| 17  | **旧主题值（retro 等）残留 IndexedDB**               | 主题收敛为单一 `neutral`                                                                                                                                            | `useSettingsStore.load()` 迁移 coerce 为 `neutral` 并回写（有单测覆盖）                                                                                        |
| 18  | **星图星星挤成一侧扇形**                             | HYG `ra` 列单位是**小时**（0-24），生成脚本没 ×15 就存进 `raDeg`；且 `equatorialToGalacticCartesian` 银经公式 X 分量符号反（l 偏 ~66°）+ 用 B1950 常数跑 J2000 数据 | 生成器 `raDeg = ra×15`；mapper 换 J2000 常数（192.859/27.128/122.932）并修正 X 符号；`generated-catalog.test` 有 RA 角度 + 各向同性（mean 方向 <0.15）断言守住 |
| 19  | **改了数据用户仍看到旧星图**                         | `StarCatalogRepository` 用 `sourceVersion` 当缓存键，版本相同就一直用 IndexedDB 旧缓存不重拉                                                                        | **重新生成数据时必须 bump `scripts/build-star-catalog.ts` 的 `SOURCE_VERSION`**（r1→r2…），否则旧浏览器永不刷新                                                |

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
