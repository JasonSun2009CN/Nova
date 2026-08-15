# ADR 索引 (Architecture Decision Records)

> 架构决策记录 - 记录项目中关键技术选型的决策过程与背景。

## 什么是 ADR？

ADR (Architecture Decision Record) 是一种轻量级文档，用于记录重要的架构决策。每个 ADR 描述：

- **背景**：我们面临什么问题？
- **决策**：我们决定怎么做？
- **后果**：这样做带来了什么影响（正面 + 负面）？

## ADR 格式

每个 ADR 文件遵循以下结构：

```
# ADR-XXXX: 决策标题

- 状态: {Proposed | Accepted | Deprecated | Superseded by ADR-YYYY}
- 日期: YYYY-MM-DD
- 决策者: 参与决策的人员

## 背景与问题陈述

## 考虑过的方案
- 方案 A
- 方案 B
- 方案 C

## 决策

## 决策依据

## 后果
### 正面影响
### 负面影响
### 风险与缓解
```

---

## 决策列表

| 编号                                                   | 标题                                                               | 状态     | 日期       |
| ------------------------------------------------------ | ------------------------------------------------------------------ | -------- | ---------- |
| [ADR-0001](0001-frontend-framework.md)                 | 前端框架选择：React + TypeScript                                   | Accepted | 2026-07-29 |
| [ADR-0002](0002-graphics-renderer.md)                  | 图形渲染方案：Three.js + WebGL 2.0                                 | Accepted | 2026-07-29 |
| [ADR-0003](0003-state-management.md)                   | 状态管理方案：Zustand                                              | Accepted | 2026-07-29 |
| [ADR-0004](0004-local-storage.md)                      | 本地持久化方案：IndexedDB (Dexie)                                  | Accepted | 2026-07-29 |
| [ADR-0005](0005-architecture-style.md)                 | 架构风格：引擎层与 UI 层分离                                       | Accepted | 2026-07-29 |
| [ADR-0006](0006-star-data-strategy.md)                 | 星图数据策略：分层加载 + LOD                                       | Accepted | 2026-07-29 |
| [ADR-0007](0007-styling-solution.md)                   | 样式方案：Tailwind CSS + CSS Variables                             | Accepted | 2026-07-29 |
| [ADR-0008](0008-build-tool.md)                         | 构建工具：Vite + pnpm                                              | Accepted | 2026-07-29 |
| [ADR-0009](0009-single-neutral-theme-starmap-modal.md) | 单一 Neutral 主题 + 星图弹窗                                       | Accepted | 2026-08-03 |
| [ADR-0010](0010-real-star-catalog.md)                  | 真实星表数据集成（HYG + 分块缓存）                                 | Accepted | 2026-08-04 |
| [ADR-0011](0011-voyage-view-real-stars.md)             | 航行视图真实星表渲染（R3F 复用）                                   | Accepted | 2026-08-05 |
| [ADR-0012](0012-unified-flight-model-engine-tiers.md)  | 统一飞行模型 + 引擎 γ 分级                                         | Accepted | 2026-08-05 |
| [ADR-0013](0013-variable-departure-point.md)           | 变动出发地（出发地 = 上次目的地）                                  | Accepted | 2026-08-06 |
| [ADR-0014](0014-voyage-single-star-dashboard.md)       | 航行主视角改目的地单星放大 + S25 仪表盘提前交付（修订 ADR-0011）   | Accepted | 2026-08-07 |
| [ADR-0015](0015-responsive-layout.md)                  | 响应式布局：大屏横屏双栏并排 / 窄屏竖屏单栏堆叠                    | Accepted | 2026-08-08 |
| [ADR-0016](0016-achievement-system.md)                 | 成就系统（S32）：引擎层纯函数评估 + 从航行记录派生 + 跃迁引擎授权  | Accepted | 2026-08-08 |
| [ADR-0017](0017-update-check-and-official-site.md)     | 官网（GitHub Pages）+ 应用更新检测（latest.json + 亮暗双主题官网） | Accepted | 2026-08-15 |

---

## 新增 ADR 流程

1. 复制 [adr-template.md](adr-template.md) 为新文件，命名为 `NNNN-title.md`（NNNN 为四位递增编号）
2. 填写所有章节
3. 在本索引文件的决策列表中添加新条目
4. 提交 PR，在 PR 描述中解释该 ADR 的必要性
5. 至少 1 名核心成员 Review 后合入
