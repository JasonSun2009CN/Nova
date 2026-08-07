# ADR-0013: 变动出发地（出发地 = 上次目的地）

- 状态: Accepted
- 日期: 2026-08-06
- 决策者: 用户（产品决策）+ 工程评审

## 背景与问题陈述

星图增量 2 已实现「当前位置随航行更新」：航行完成时 `useVoyageStore` 的 complete 事件把 `settings.currentStarId` 写为 `destStarId`，星图出发地第一人称视角与全览「当前位置」标记都读它。

但**航行本身始终从太阳系出发**：

1. `SetupPanel.handleStart` 与 `ResultView.handleRestart` 硬编码 `originStarId: 'hip-sol'`，写入 `VoyageRecord` 的 origin 恒为太阳系。
2. 距离规划 `cruisePlan` / `requiredFocusMinutes` / `recommendDestination` 全部按「目的地距太阳」计算——一旦出发地不是太阳系，预计专注时长、推算速度、推荐目的地语义全部错误。

结果：用户航行到比邻星后，设置页仍显示「太阳系 → 织女星」，规划距离仍按织女距太阳的 25.04ly 计算，与产品主题「从上次抵达地继续出发」冲突。

**目标**：本次航行从「当前位置」出发，即**出发地 = 上次目的地**；距离规划按出发地→目的地的实际两星距离计算。

## 考虑过的方案

### 方案 A: 复用 `settings.currentStarId` 作为出发地（选定）

出发地唯一数据源 = `settings.currentStarId`（默认 `hip-sol`；完成航行后 = 上次目的地）。SetupPanel / ResultView 以它为 `originStarId` 传入 `prepare`，不再硬编码。规划距离 = 出发星→目的星的欧氏距离（新增 `distanceBetweenStars`）；目录未加载或无出发星坐标时退化为「距太阳」距离（首航即此情况）。

**优点:** 不新增持久化字段、无数据迁移（`currentStarId` 已在写）；单一数据源与星图「所在星」完全一致；语义自洽。
**缺点:** 无。

### 方案 B: 新增独立 `originStarId` 持久化设置

在 `SettingsKey` 里新增字段，与 `currentStarId` 双轨并存。

**优点:** 出发地与「星图所在星」解耦（理论上可不同）。
**缺点:** 引入两份「我在哪」的状态，需处理二者一致性；无实际使用场景支撑，徒增维护成本。

### 方案 C: 只改 `originStarId`，距离规划仍按距太阳

仅把起点字段换成 `currentStarId`，`cruisePlan` / 推荐继续用目的地的太阳距。

**优点:** 改动最小。
**缺点:** 出发地变了但距离没变，到比邻星再规划织女星仍按 25.04ly（实际约 20.8ly），预计时长与推荐落点错误，半吊子实现。

## 决策

采用**方案 A**：

1. **出发地 = `settings.currentStarId`**（默认 `hip-sol`；完成航行后 = 上次目的地）。`SetupPanel.handleStart` 与 `ResultView.handleRestart` 不再硬编码 `hip-sol`。
2. **规划距离 = 出发星→目的星的两星欧氏距离**（`distanceBetweenStars`，`src/data/destination-stars.ts` 新增纯函数）。出发星为太阳系 / 坐标不可解析时退化为目的地太阳距（首航即此情况，数值一致）。
3. **推荐目的地按出发地起算**：`recommendDestination` 收到的 `DestinationStar[]` 的 `distanceLy` 由 SetupPanel 先换算成 leg 距离（出发星→候选星），不可达/回退判定基于真实出发地。
4. **ResultView「再来一次」**：completed → 从本次目的星出发；aborted → 从本次出发地出发（未抵达，位置未变）。不依赖异步的 `setCurrentStar` 写回，避免竞态。
5. **UI**：设置页副标题显示「出发地 → 目的地 · leg 距离」，无目的地时显示「飞船将从 {出发地} 出发」；太阳系出发显示「太阳系」。

## 决策依据

1. **单一数据源**：`currentStarId` 已是「我在哪」的权威字段，星图、出发地视角都读它；航行起点沿用同一字段，三处一致。
2. **零迁移**：字段与默认值均已存在，老用户升级无感；仅新 `VoyageRecord` 的 origin 变真实。
3. **语义完整**：leg 距离同时修正预计时长、推算速度、推荐目的地三个面，避免「出发点移动了但规划还按太阳算」的错位。
4. **与 ADR-0012 衔接**：leg 距离正是 S22 统一飞行模型 `d = β·γ·τ` 里 `d` 的真实取值；本 ADR 先把它落地，S22 的 γ 分级直接复用。

## 后果

### 正面影响

- 出发地 = 上次目的地的产品闭环打通，`VoyageRecord.originStarId` 记录真实起点。
- 规划/推荐/显示三点基于同一 leg 距离，无歧义。
- 纯函数（`distanceBetweenStars`、leg 换算）可单测。

### 负面影响

- 非太阳出发时，目的地下拉里显示的仍是「距太阳」距离（`destinationOptionsFromStars`），与设置页 leg 距离并存；下拉未改，避免范围膨胀（S22 统一模型时可一并收敛）。
- 历史 `VoyageRecord` 的 origin 字段为新语义，仅影响新记录，旧记录不变。

### 风险与缓解措施

| 风险                            | 影响 | 概率 | 缓解措施                                                                                         |
| ------------------------------- | ---- | ---- | ------------------------------------------------------------------------------------------------ |
| 目录未加载时出发星坐标不可解析  | 中   | 中   | 回退为「目的地太阳距」（首航即此情况）；`currentStarId` 始终是已设过目的地的星，目录就绪后可解析 |
| 出发星 = 目的星（距离 0）       | 低   | 低   | `legLy > 0` 判定沿用现有 guard，距离 0 时无推算 plan，走手动速度滑杆                             |
| `setCurrentStar` 异步写回竞态   | 低   | 中   | ResultView 重启不走 settings 快照，completed 直接用 store 的 `destStarId`                        |
| 下拉距离与 leg 距离并存造成困惑 | 低   | 低   | 设置页副标题与预计专注均用 leg 距离为准；下拉距离仅在 S22 收敛                                   |

## 关联 ADR

- ADR-0010 真实星表：leg 距离依赖星表 cartesian 坐标（`coords.cartesian`）。
- ADR-0012 统一飞行模型：本 ADR 落地的 leg 距离是 S22 `d = β·γ·τ` 中 `d` 的真实取值。
- ADR-0005 分层架构：`distanceBetweenStars` 放 `src/data/`（纯 TS，UI 可 import）。
