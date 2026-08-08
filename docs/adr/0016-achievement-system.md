# ADR-0016: 成就系统（S32）

- 状态: Accepted
- 日期: 2026-08-08
- 决策者: 用户（产品决策）+ 工程评审

## 背景与问题陈述

Phase 4（v0.5）需要「成就系统」：用户可因不同行为解锁成就（航行里程、探索发现、专注时长、特殊挑战、里程碑），有成就墙 + 解锁动画 + 成就点。ROADMAP 4.2 列出的示例中，一部分在当前数据模型下无法落地：

1. **首次发现系外行星**：应用无行星数据（S30 已砍「已发现行星数」），无法实现。
2. **访问全部 12 黄道星座**：真实星表中 60 颗可设目的地（properName 非空）的星只覆盖 **7/12** 黄道星座（缺 ARI/TAU/LIB/SCO/AQR），在当前数据下该成就**不可达成**。
3. **到达黑洞（连续 4 小时专注）**：应用无黑洞天体，但「连续超长专注」的挑战精神可用「单次专注 ≥ 4 小时」表达。

同时，ADR-0012 已承诺「跃迁引擎 = 里程碑成就解锁」——S32 正是成就系统落地处，需要把这一联动闭环（成就授予引擎档位）。

## 考虑过的方案

### 方案 A: 引擎层纯函数评估 + 完全从航行记录派生（选定）

- 成就定义（目录 + 条件谓词）放 `src/engine/achievements/`（纯 TS，0 React/0 Three/0 Dexie，复用 S30 `captains-log.ts` 聚合）。
- **解锁状态不从历史派生**：`evaluateAchievements(records, endTime, starFacts)` 纯函数，任何时刻可用 records 重算；无需新建 Dexie 表、无「已解锁」持久化。
- 新解锁检测：ResultView 打开时对比 `records` 与「去掉刚保存记录」的解锁集，得到增量即新成就，不依赖跨会话状态。
- 星元数据：内置 `BUILTIN_STAR_FACTS`（17 颗 DESTINATION_STARS 光谱型）+ 可注入目录星事实（`buildAchievementStarFacts(catalogStars)`），引擎不裸引目录。
- 跃迁引擎：`resolveEngineTier(focusHours, grantedTiers)` 纯函数，授权档位来自成就（`distance-1000` 成就 `grantsEngineTier: 'jump'`）。

**优点:** 与 S27（引擎解锁按累计专注派生）、S30（船长日志从 records 派生）完全同构；状态永不漂移（清空历史即清空成就，语义自洽）；测试 = 构造 records + 断言纯函数；无 schema 迁移。
**缺点:** 删除某条记录可能使对应成就消失（与 S30 统计同理，可接受）；解锁时间戳需额外计算（S32 不做，见下文）。

### 方案 B: 新增 Dexie 表持久化解锁状态 + 事件驱动评估

- 建 `achievements` 表（id/unlockedAt），航行完成事件评估并落库。

**优点:** 解锁状态独立于历史（删记录成就还在）、可存解锁时间戳。
**缺点:** 新 schema + 迁移；成就与历史产生双数据源，清空历史时「成就不清空」语义需额外约定；S30/S27 已确立「派生」先例，引入持久化不一致。

### 方案 C: 状态全存 localStorage + 前端事件

- localStorage 存 `nova-achievements`，航行完成时由组件更新。

**优点:** 实现最直接。
**缺点:** 绕过引擎层、不可单测；localStorage 与 Dexie 历史分裂，清空历史逻辑要联动；违背「引擎 = 真相源」分层。

## 决策

采用**方案 A**：

1. **引擎层** `src/engine/achievements/`（纯 TS，经 `src/engine/index.ts` 暴露）：
   - `types.ts`：`AchievementId`（15 个成就的联合类型）、`AchievementDefinition`（category/title/description/points/rarity/`grantsEngineTier?`/condition）、`AchievementContext`（records + endTime + summary + 访问恒星集合 + starFacts）、`AchievementState`。
   - `catalog.ts`：`ACHIEVEMENTS` 目录 + `ACHIEVEMENT_CATEGORIES` 分类元数据 + `getAchievementById`。
   - `evaluate.ts`：`buildAchievementContext` / `evaluateAchievements` / `unlockedAchievementIds` / `newlyUnlockedAchievementIds(prevRecords, fullRecords, …)`（增量 = 全量解锁集 − 前序解锁集）。
   - `star-facts.ts`：`BUILTIN_STAR_FACTS`（17 颗目的地星光谱型，与生成星表一致）+ `buildAchievementStarFacts(catalogStars?)` 合并注入。
   - 复用 `summarizeCaptainsLog`（S30）：距离/专注/streak/已探索全部由它供给。
2. **成就清单（15 个，ROADMAP 4.2 示例裁剪到当前数据可达成）**：

   | 分类      | id                 | 标题           | 条件                                   | 点数 | 稀有度    |
   | --------- | ------------------ | -------------- | -------------------------------------- | ---- | --------- |
   | 🌠 里程   | distance-1         | 启程           | 累计航行 ≥ 1 ly                        | 10   | common    |
   | 🌠 里程   | distance-10        | 近邻           | 累计航行 ≥ 10 ly                       | 20   | common    |
   | 🌠 里程   | distance-100       | 远航           | 累计航行 ≥ 100 ly                      | 50   | rare      |
   | 🌠 里程   | distance-1000      | 星河           | 累计航行 ≥ 1000 ly                     | 100  | legendary |
   | ⭐ 探索   | first-voyage       | 初次启航       | 产生第一条航行记录                     | 10   | common    |
   | ⭐ 探索   | leave-solar-system | 离开太阳系     | 存在 traveledLy>0 且目的地非太阳的记录 | 15   | common    |
   | ⭐ 探索   | visit-m-star       | 红矮星访客     | 完成航行抵达一颗 M 型星                | 30   | rare      |
   | ⭐ 探索   | explore-10         | 开拓者         | 已探索 ≥ 10 颗不同恒星                 | 40   | rare      |
   | ⏱️ 专注   | first-pomodoro     | 首个番茄钟     | 存在单次专注 ≥ 25 分钟的记录           | 10   | common    |
   | ⏱️ 专注   | streak-7           | 七日连航       | 连续专注 ≥ 7 天                        | 40   | rare      |
   | ⏱️ 专注   | focus-100h         | 百时舰长       | 累计专注 ≥ 100 小时                    | 60   | rare      |
   | 🌟 挑战   | single-focus-4h    | 耐力航行       | 存在单次专注 ≥ 4 小时（替代「黑洞」）  | 50   | rare      |
   | 🎖️ 里程碑 | alpha-centauri     | 半人马座征服者 | 完成航行抵达 α Cen A/B 或比邻星        | 25   | common    |
   | 🎖️ 里程碑 | sirius             | 天狼星访客     | 完成航行抵达天狼星                     | 25   | common    |
   | 🎖️ 里程碑 | vega               | 织女星开拓者   | 完成航行抵达织女星                     | 25   | common    |

   合计 **510 成就点**。星表覆盖 7/12 黄道星座 → **「访问全部 12 黄道星座」延后**（S35 500ly 扩展补星后评估）；「发现系外行星」无数据不实现。

3. **跃迁引擎联动**：`distance-1000` 成就 `grantsEngineTier: 'jump'`；`engine-tiers.ts` 新增 `resolveEngineTier(focusHours, grantedTiers = [])`（纯函数，`getUnlockedTier` 之上取授权档位与专注档位的最高者）；SetupPanel 当前引擎 / VoyageView 功率表 / StarInfoCard 最短专注改走 `resolveEngineTier`。
4. **UI**（无新 store、无持久化）：
   - `src/components/useAchievements.ts` hook：订阅 `useHistoryStore.records` + `useCatalogStore.stars`，`useMemo` 派生 `{ states, unlocked, points, grantedEngineTiers }`。
   - 顶栏 idle 新增「成就」按钮 → `AchievementDialog`（镜像 CaptainLogDialog）+ `AchievementPanel` 成就墙（分类分组、锁定/解锁、成就点、进度）。
   - `ResultView` 航行结束后展示新解锁成就：`newlyUnlockedAchievementIds(records minus lastSavedRecord, records, …)`，无跨会话状态、天然不重复播报。
   - 解锁动画按稀有度（common 淡入 / rare 金色边框 / legendary 金色脉冲），遵循极简克制（无装饰性背景）。

## 决策依据

1. **与既有「派生」先例同构**：S27 引擎解锁 = `getUnlockedTier(totalFocusHours)`，S30 船长日志 = `summarizeCaptainsLog(records, endTime)`——成就继续「从航行记录派生」，心智模型统一、测试成本最低。
2. **无 schema 迁移 / 无状态漂移**：不建表、不存解锁状态，清空历史即清空成就，语义自洽；不存在「历史删了成就还在」的双源不一致。
3. **新解锁检测无持久化**：用「当前记录集 vs 去尾记录集」增量，天然只在新航行后出现、不重复播报、不依赖跨会话标记。
4. **跃迁引擎兑现 ADR-0012 承诺**：里程碑成就授予引擎档位，把成就系统与既有引擎进度轴连成一条线。
5. **可达成性优先**：成就清单裁剪到当前 60 颗可访问星 + 数据模型能支撑的条件，避免「永久锁死」的成就（黄道延后并记录原因）。

## 后果

### 正面影响

- 成就评估为纯函数，单测即构造 records + 断言，覆盖每个成就阈值与增量。
- 引擎层保持 0 React/0 Three/0 Dexie，无新持久化层。
- 清空/删除记录时成就随之变化，用户认知一致（「这是我的航行史」）。
- 跃迁引擎有了真实的解锁路径，SetupPanel 当前引擎状态条自然反映。

### 负面影响

- 删除某条达成里程碑的记录会导致对应成就消失（与 S30 统计同理，用户在清空历史时应预期）。
- 无解锁时间戳展示（需按 endTime 排序逐步评估，S32 未做；后续可加 `unlockedAt` 演进）。
- 「访问全部 12 黄道星座」延后至 S35，成就墙暂缺一个「集邮类」挑战。

### 风险与缓解措施

| 风险                                      | 影响 | 概率 | 缓解措施                                                                                   |
| ----------------------------------------- | ---- | ---- | ------------------------------------------------------------------------------------------ |
| 成就条件语义含糊（completed vs 全部状态） | 中   | 中   | 条件谓词集中定义，单测逐条固化语义（里程碑/探索类=completed，里程/专注类=全部记录）        |
| M 型星事实与星表不一致                    | 低   | 低   | 内置事实按生成星表逐颗抄录，目录注入优先于内置；`buildAchievementStarFacts` 单测断言 17 颗 |
| 跃迁引擎授权影响现有可达性 UI             | 中   | 低   | `resolveEngineTier` 向后兼容（空授权 = 原 `getUnlockedTier`），只改 3 个调用点             |
| ResultView 增量因记录乱序误判             | 低   | 低   | 用 `lastSavedRecord.id` 精确剔除最新记录，而非依赖排序                                     |

## 关联 ADR

- ADR-0012 统一飞行模型：跃迁引擎解锁条件（里程碑成就）在本 ADR 落地为 `grantsEngineTier`。
- ADR-0005 分层架构：成就目录/评估放 `src/engine/achievements/`（纯 TS），UI 经 store + hook 读取。
- ADR-0014/0015 航行视图/响应式：成就墙弹窗镜像 CaptainLogDialog 结构（inset 弹窗 + 滚动），沿用 `lg` 断点。
