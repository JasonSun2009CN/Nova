# Nova · 阶段索引（Stage Index）

> 本文档是 **每个 Sprint/Stage 的唯一索引**：按 S 编号列出所有已定义阶段（已完成 + 规划中），标注所属 Phase / 版本 / 状态 / 关联 commit。
> 阶段验收标准以 `docs/ROADMAP.md` 为唯一权威（本文档不做验收判断）；工程细节见 `HANDOFF.md`；设计决策见 `docs/adr/`。

---

## 一、编号约定

- 阶段编号与分支命名一致：`feature/S{nn}-description`（见 `docs/CONTRIBUTING.md`）。
- **S 编号自 S11（Phase 1 MVP）起正式用于分支命名**；更早的引擎基础（S7~S9）按交接/代码标注逻辑编号，无独立分支。
- **S1~S6、S10、S22~S28 从未定义**，保持留空，不要自行占用。
- 交付新阶段时 **同步刷新三处**：本文档 + `HANDOFF.md` + `docs/ROADMAP.md`（现状已交付至 S20）。

## 二、状态图例

| 标记 | 含义                  |
| ---- | --------------------- |
| ✅   | 已完成（已合入 main） |
| 🚧   | 开发中 / 已提交未合并 |
| ⏳   | 远期规划（尚未开始）  |
| —    | 未定义 / 未使用       |

## 三、阶段总表

| Stage   | 所属 Phase | 版本 | 内容                                                                                           | 状态      | 关联 commit / PR                  |
| ------- | ---------- | ---- | ---------------------------------------------------------------------------------------------- | --------- | --------------------------------- |
| S1–S6   | —          | —    | 未使用（阶段编号自 S7 起）                                                                     | —         | —                                 |
| S7      | Phase 1    | v0.1 | 相对论物理 `lorentz.ts`：γ = 1/√(1-β²) 泰勒分段、`travelDistance`、`LIGHT_SPEED`               | ✅        | 无独立分支                        |
| S8      | Phase 1    | v0.1 | 航行状态机 `VoyageController`（idle/running/paused/completed/aborted + snapshot↔恢复 + tick） | ✅        | 无独立分支                        |
| S9      | Phase 1    | v0.1 | 星表数据结构：`KdTree3`（手写 3D KD-Tree）+ `StarCatalog`（4 层树 + 索引 + LOD）               | ✅        | 无独立分支                        |
| S10     | —          | —    | 未使用                                                                                         | —         | —                                 |
| S11     | Phase 1    | v0.1 | Zustand 3 stores（settings/voyage/history）                                                    | ✅        | `3a14b17`                         |
| S12     | Phase 1    | v0.1 | React UI（Setup/Voyage/Result/History + App 路由）                                             | ✅        | `4ebf2fc`                         |
| S13     | Phase 1    | v0.1 | Web Worker 计时 + localStorage 崩溃恢复                                                        | ✅        | `7cdf0c4`                         |
| S14     | Phase 1    | v0.1 | GitHub Actions CI + mvp.e2e（3 浏览器）                                                        | ✅        | `e37f499`                         |
| S15     | Phase 1    | v0.1 | PWA 离线 + manifest + README 指引                                                              | ✅        | `0b94761`（PR #1）                |
| S16     | Phase 2    | v0.2 | R3F 3D 星空渲染器 + 星图视图（懒加载）                                                         | ✅        | `fe808af` / `5313028` / `bbd849e` |
| S17     | Phase 2    | v0.2 | 星图弹窗 + 点星确认设目的地 + 当前位置标记（拾取/分层）                                        | ✅        | 同 S16                            |
| S18     | Phase 2    | v0.2 | 目的地数据源统一（真实星表）+ 反推预计专注时长 `requiredFocusMinutes`                          | ✅ 已合并 | `0b5dcfb`（PR #3）                |
| S19     | Phase 2    | v0.2 | 时长滑杆 `DurationScrubber` + `cruisePlan` 反推航线                                            | ✅ 已提交 | `945ec2e`                         |
| S20     | Phase 2    | v0.2 | 星图搜索 `searchStars`/`StarSearch` + 推荐目的地 `recommendDestination`                        | ✅ 已提交 | `c3817bf`                         |
| 增量    | Phase 1/2  | —    | UI 极简克制化重设计 + 术语弹窗 + 单一暗色 Neutral 主题（ADR-0009）                             | ✅        | `8b9b466` 等                      |
| 增量 2  | Phase 2    | —    | 星图双视角（出发地第一人称 / 上帝全览）+ 半径圈 + 出发地随航行更新                             | ✅        | 无独立 commit                     |
| S21     | Phase 3    | v0.3 | γ 视觉（Doppler 红移/蓝移 uniform）                                                            | ⏳        | —                                 |
| S22–S28 | Phase 3/4  | —    | 未定义（Phase 3/4 条目待拆分编号）                                                             | —         | —                                 |
| S29     | Phase 5    | v1.0 | Gaia 百万星（tier3 单独 KDTree + GPU BufferGeometry）                                          | ⏳        | —                                 |

## 四、Phase ↔ 版本 ↔ Stage 对照（跨阶段视图）

| Phase   | 版本   | 目标                           | 对应 Stage                                                 | 状态                                     |
| ------- | ------ | ------------------------------ | ---------------------------------------------------------- | ---------------------------------------- |
| Phase 0 | v0.0.1 | 项目奠基（脚手架/文档/规范）   | 无独立编号（早期 commit：`24a2b46`、`3fbcc0b`、`d0bcf50`） | 部分完成（脚手架、CI 等未竟）            |
| Phase 1 | v0.1.0 | MVP 基础专注闭环               | S7~S15                                                     | ✅ 已完成                                |
| Phase 2 | v0.2.0 | 星图导航系统                   | S16~S20 + 增量 / 增量 2                                    | 🚧 功能闭合；2.3 质量保障 + 验收走查待做 |
| Phase 3 | v0.3.0 | 完整航行系统 + 相对论视觉      | S21 起（其余条目待拆分编号）                               | ⏳                                       |
| Phase 4 | v0.5.0 | 成就系统 + 航行日志            | 未编号                                                     | ⏳                                       |
| Phase 5 | v1.0.0 | 正式版发布                     | S29（Gaia）等                                              | ⏳                                       |
| Phase 6 | v2.x   | 未来探索（多人/多端/高级天文） | 未编号                                                     | ⏳                                       |

## 五、Phase 3~6 待拆分 Stage 候选（未编号 backlog）

以下条目抄录自 `docs/ROADMAP.md`，尚未分配 S 编号。开工前先在第三节登记编号（取下一个可用 `S{nn}`），再建分支 `feature/S{nn}-desc`。

### Phase 3（v0.3）候选

- **S21** ✅ 已占用：γ 视觉（Doppler 红移/蓝移 uniform）
- 第一人称航行视图（分层星流 / 星光拖尾 / 光行差畸变）
- 实时仪表盘（主/客观双时间轴、γ、速度、已航行/剩余距离、引擎功率）
- 跃迁过渡动画（启动 / 停止 / 中断）
- 引擎等级解锁系统（0.90c → 0.99c → 0.999c → 0.9999c → 跃迁）
- 白噪音 / 环境音系统（引擎嗡鸣、CMB、脉冲星）

### Phase 4（v0.5）候选

- 船长日志统计面板（总览 / 热力图 / 时间线 / 航线地图 / 周月柱状图）
- 导出功能（CSV / JSON / 航线图图片）
- 成就系统（分类 / 成就墙 / 解锁动画 / 成就点）
- 好友雏形（本地 + 云端账户、分享链接）

### Phase 5（v1.0）候选

- **S29** ✅ 已占用：Gaia 百万星（tier3 单独 KDTree + GPU BufferGeometry）
- 扩展至 500ly 亮星（Hipparcos 完整星表）+ 星云/星团 + 银河结构
- i18n（中/英）/ 无障碍 / 性能极致优化
- Bug Bash、跨浏览器/跨设备测试、数据迁移、发布准备

### Phase 6（v2.x）候选

- 多人实时协作 / 自定义内容 / 多端同步 / 硬件生态 / 高级天文

## 六、维护约定

1. **新阶段开工**：先在第三节 / 第五节登记编号与内容 → 建分支 `feature/S{nn}-desc`。
2. **阶段交付**：更新本表状态与关联 commit；同时刷新 `HANDOFF.md` 与 `docs/ROADMAP.md`（三处保持一致）。
3. **验收**：某阶段是否「算完成」以 ROADMAP 对应 Phase 的验收标准为准，本文档只做索引，不自行判定完成。
