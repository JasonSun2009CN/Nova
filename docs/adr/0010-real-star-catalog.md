# ADR-0010: 真实星表数据集成（50ly 内 ~1800 颗恒星）

- 状态: Accepted
- 日期: 2026-08-04
- 决策者: 项目负责人（用户）驱动 + 工程评审

## 背景与问题陈述

星图当前使用 `src/engine/data/__fixtures__/stars-500.ts` 的 500 颗 fixture（31 颗真星 + 469 颗种子假星）。ROADMAP 2.1「星表数据集成」要求：

- 内嵌 50 光年内完整星表（约 1800 颗真实恒星）
- 数据格式：JSON 分块 + IndexedDB 缓存
- 字段：HIP 编号、名称、赤经赤纬、视差/距离、视星等、光谱型、B-V 色指数

假星数据无法支撑「真实天体数据」的核心卖点，且 fixture 的 HIP 编号与真实天文不符（如 fixture 把 `hip-102098` 标为织女星，但真实织女星 HIP=91262），导致星图/目的地/存储里的 id 与真实数据错位。

## 考虑过的方案

### 方案 A: 真实星表 + 构建期生成分块 JSON + 运行时 IndexedDB 缓存（选定）

- 数据源：**HYG v3**（`astronexus/HYG-Database`，`hygdata_v3.csv`，CC-BY-SA），字段含 hip/hd/gl/proper/ra/dec/dist/mag/absmag/spect/ci/bayer/flam/con/lum。
- `dist` 单位为**秒差距**（parsec），需 `×3.2616` 转光年；`dist >= 100000` 视为缺失/可疑视差，跳过。
- 构建期脚本 `scripts/build-star-catalog.ts`（Node 22 `--experimental-strip-types` 运行）过滤 `distLy <= 50`，映射为 `Star[]`，生成 `public/data/stars/manifest.json` + `chunk-000.json`…（每块 ≤400 颗），**产物提交到仓库**（`public/` 被 git 跟踪）。
- 运行时 `src/storage/StarCatalogRepository.ts`：优先 IndexedDB 分块缓存，未命中则 fetch 分块并回写缓存；`src/store/useCatalogStore.ts` 提供 `{ stars, status, source, error }`。
- 纯转换函数（`parseSpectral` / `equatorialToGalacticCartesian` / `protoToStar`）从 fixture 提升到 `src/engine/data/star-mapper.ts`（引擎层纯 TS，生成器与运行时可复用，单一数据源）。
- 中文名覆盖表 keyed by 真实 HIP；`DESTINATION_STARS` 改为真实 HIP 并**裁剪掉 >50ly 的 15 颗**。

**优点:** 真实数据；id 与真实天文一致；离线可用（产物提交 + PWA 预缓存）；分块缓存粒度细，便于未来 LOD 扩展；生成脚本可复现。
**缺点:** 首次生成需联网下载 CSV（仅重新生成时需要）；新增存储层/状态层代码；`DESTINATION_STARS` 从 31 缩减到 ~17。

### 方案 B: 运行时直接 fetch 整包 JSON，不缓存

**优点:** 实现最简单。
**缺点:** 违背 ROADMAP「IndexedDB 缓存」要求；每次打开星图都网络请求；离线不可用。

### 方案 C: 单一大 JSON 打包进 bundle（`import ... from '*.json'`）

**优点:** 无运行时请求，打包即用。
**缺点:** 无缓存粒度；~300KB 进主包或单独 chunk；无法按需分块加载；未来百万星 LOD 不可扩展。

### 方案 D: 继续用程序化生成假星（纯程序化占位）

**优点:** 无外部依赖。
**缺点:** 违背「真实天体数据」产品核心；ADR-0006 已否决纯程序化数据。

## 决策

采用**方案 A**：

1. 数据源为 **HYG v3**（`hygdata_v3.csv`），`dist_pc × 3.2616 <= 50` 过滤，跳过 `dist >= 100000` 行。
2. 构建期脚本生成分块 JSON，**提交** `public/data/stars/`（运行时无需网络；仅重新生成需网络）。
3. 运行时：`StarCatalogRepository` fetch + IndexedDB 分块缓存（Dexie v2：`starChunks` + `starCatalogMeta`），`useCatalogStore` 承载状态。
4. `star-mapper.ts` 提升纯转换函数（`parseSpectral` / `equatorialToGalacticCartesian` / `protoToStar` / `ProtoStar`），引擎层 `engine/index.ts` 导出。
5. 中文名覆盖表 keyed by **真实 HIP**（不再信任 fixture id）；`DESTINATION_STARS` 改真实 HIP，**裁剪 >50ly** 条目（~17 颗）。
6. 太阳（`hip-sol`，0 ly）手动加入目录，`catalogTier = 'tier0-solar'`；其余真星 `tier1-nearby-100ly`。
7. `luminositySol = 10 ** lum`（HYG `lum` 实为 log10），`bvColorIndex = ci`，温度可由 B-V 估算（可选）。
8. 无 HIP 的行回退为 `gl-{gl}` / `hyg-{id}` id，保证 50ly 内完整度。

## 决策依据

1. **真实数据**：HYG v3 是常用的免费开放星表（Hipparcos + Yale + Gliese 合并），字段齐全，覆盖 50ly 内主要恒星。
2. **工程安全**：产物提交后运行时零网络依赖；生成脚本 + 数据完整性单测（Vega≈25.05ly、Sirius≈8.6ly）守住单位换算这一最大风险点。
3. **分层约束**：fetch/IndexedDB 在 `storage`/`store` 层（引擎层纯 TS 不破坏），转换纯函数留在引擎层可被单元测试。
4. **缓存粒度**：分块缓存（每块 ≤400 颗）粒度合理，未来 L3/L4 分层加载可复用同一管线。

## 后果

### 正面影响

- 星图显示真实恒星分布（HYG v35 在 50ly 内实收 **982 颗**，含全部 Gliese 近星；HYG 基于 Hipparcos，缺暗弱 M 矮星，故少于 ROADMAP 预估的 ~1800，完整覆盖需未来接 Gaia）。
- HIP id 与真实天文一致，目的地/记录/星图数据一致。
- 离线可用：IndexedDB 缓存 + PWA `json` 预缓存。
- 生成脚本可复现、可更新数据源版本（`sourceVersion` 作为缓存失效键）。

### 负面影响

- `DESTINATION_STARS` 从 31 缩减到 ~17（15 颗 >50ly 被裁剪；多级跃迁/亮星层可在导航阶段按 ADR-0006 L2 引入）。
- 首次打开星图（无缓存）有一次分块网络加载；PWA 预缓存约增 ~300KB。
- `scripts/` 不在 `tsconfig` include 内，需加入 eslint ignore；生成 JSON 需加入 `.prettierignore`。

### 风险与缓解措施

| 风险                                                      | 影响 | 概率   | 缓解措施                                                                                                                                                                                  |
| --------------------------------------------------------- | ---- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HYG `dist` 单位（秒差距）误用                             | 高   | 中     | 生成器 `×3.2616`；数据完整性单测钉住 Vega≈25.05ly / Sirius≈8.6ly                                                                                                                          |
| HIP id 映射错误（中文名错配）                             | 中   | 中     | 中文名表 keyed by 真实 HIP，生成器自校验（对照 HYG proper）；单测钉住织女/天狼/巴纳德                                                                                                     |
| 生成数据需联网（仅重新生成时）                            | 中   | 低     | 产物提交仓库，运行时零网络；脚本支持 `--input` 本地 CSV 离线重生成                                                                                                                        |
| 50ly 内实际数量（982）少于 ROADMAP 预估 ~1800             | 低   | 高     | 页脚/文案动态化；e2e 用正则；完整性单测断言 `>=900`；ADR 记录接受 HYG 实际值，未来接 Gaia 补齐                                                                                            |
| HYG 数据瑕疵（缺 hip/重复行/spect 异常/`lum` 实为 log10） | 中   | 中     | id 回退链 `hip→gl→hyg`；按 hip+dist 去重；`lum` 取 `10**lum` 并对照已知星验证                                                                                                             |
| HYG `ra` 列单位是**小时**（0-24）而非角度                 | 高   | 已发生 | 生成器 `raDeg = ra×15`；`equatorialToGalacticCartesian` 换 J2000 常数（192.859/27.128/122.932）并修正银经 X 分量符号；单测钉住 RA 角度区间 + 各向同性（mean 方向 <0.15）+ 银心/银北极方向 |
| 首次打开无缓存需联网                                      | 低   | 中     | PWA 预缓存 `json`；e2e 超时 20s 覆盖                                                                                                                                                      |

## 关联 ADR

- ADR-0006 星图数据策略（分层 + LOD）：本 ADR 落地其 L3（50ly 内全星）数据来源。
- ADR-0005 分层架构：转换纯函数留引擎层，fetch/IndexedDB 在 storage/store 层。
