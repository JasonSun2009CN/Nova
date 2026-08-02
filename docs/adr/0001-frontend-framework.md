# ADR-0001: 前端框架选择 - React + TypeScript

- 状态: Accepted
- 日期: 2026-07-29
- 决策者: 项目初始团队

## 背景与问题陈述

Nova 需要一个前端框架来支撑：

1. **复杂状态管理**：专注计时器、航行进度、星图交互等多个同步状态
2. **高性能图形渲染**：WebGL 星空渲染与 DOM UI 混合
3. **组件复用**：星图组件、天体卡片、仪表盘等在多个场景复用
4. **长期可维护性**：项目预期持续迭代多年，需要类型安全和良好生态
5. **团队协作**：多人并行开发需要清晰的模块边界和工具链支持

## 考虑过的方案

### 方案 A: React 18 + TypeScript

**优点:**

- 生态最成熟，组件库、Hooks、工具链丰富
- TypeScript 一等公民支持，类型安全
- Concurrent Mode / Suspense 支持异步渲染，对 WebGL 场景友好
- 社区资源多，问题容易找到解决方案
- Three.js 生态（@react-three/fiber）成熟可用

**缺点:**

- 相比 Vue，学习曲线稍陡（Hooks 心智模型）
- JSX 与模板分离，习惯 Vue 的开发者需要适应
- 相对较重，首屏加载需优化

### 方案 B: Vue 3 + TypeScript

**优点:**

- 模板语法直观，上手快
- Composition API 灵活度接近 React Hooks
- Vite 原生支持，开发体验好

**缺点:**

- Three.js 生态（TresJS / TroisJS）不如 React Three Fiber 成熟
- 复杂状态管理方案（Pinia vs Vuex）选型争议
- 对于大型项目，类型推断不如 React 生态严密

### 方案 C: 原生 JavaScript (Vanilla) + Web Components

**优点:**

- 无框架依赖，bundle 最小
- 完全控制，性能极致
- 符合用户技术栈偏好（memory 中提到 Vanilla HTML/CSS/JS）

**缺点:**

- 状态管理、组件通信需要自己造轮子
- 多人协作容易出现代码风格不一致
- 没有类型系统，重构风险高
- Three.js 集成、路由、数据持久化等都需要自建基础设施
- **致命问题**：项目规模预期较大（星图、航行、成就、多人等模块），纯 Vanilla 维护成本呈指数级上升

## 决策

选择 **React 18 + TypeScript** 作为前端框架。

## 决策依据

1. **图形渲染生态**：`@react-three/fiber` 和 `@react-three/drei` 是目前 WebGL 与 React 结合最成熟的方案，极大降低星图渲染开发成本
2. **类型安全优先**：项目包含大量物理计算（相对论、轨道力学），TypeScript 强类型可显著减少运行时 Bug
3. **团队与未来**：React 人才池最大，未来扩招或社区贡献的门槛最低
4. **折中方案**：虽然用户偏好 Vanilla，但对于 Nova 这个量级的项目，选择 React + TS 是长期可维护性和开发效率的最佳平衡点。UI 组件内部实现仍可大量使用 Inline SVG（符合用户审美偏好），只是外层用 React 组织。
5. **渐进式采用**：核心引擎层（physics / navigation / renderer）设计为纯 TS 类库，与 React 解耦，未来如需迁移框架也可复用

## 后果

### 正面影响

- 星图渲染开发效率显著提升（R3F 现成组件：OrbitControls、Stars、EffectComposer 等）
- 类型系统大幅降低物理计算和数据处理中的低级错误
- 状态管理可用 Zustand 等轻量方案，避免 Redux boilerplate
- 社区组件丰富，UI 组件（弹窗、下拉、日期选择等）可直接选用 shadcn/ui 或 Radix

### 负面影响

- Bundle 体积增大，需要在构建阶段做代码分割和 tree-shaking 优化
- 开发者必须熟悉 React Hooks 最佳实践（useMemo/useCallback 滥用或不足都会影响性能）
- SSR/SSG 暂不支持（不过 Nova 是纯客户端应用，不是问题）

### 风险与缓解措施

| 风险                          | 影响 | 概率 | 缓解措施                                                                                             |
| ----------------------------- | ---- | ---- | ---------------------------------------------------------------------------------------------------- |
| React 渲染频繁导致 WebGL 掉帧 | 高   | 中   | 引擎层与 React 状态严格分离；使用 useRef 存渲染对象，避免 re-render；使用 requestAnimationFrame 驱动 |
| 包体积过大首屏加载慢          | 中   | 中   | 路由级 code split；星图数据按需加载；Web Worker 处理计算                                             |
| 团队成员不熟悉 TS/React       | 中   | 低   | 提供 onboarding 文档；Codereview 关注类型质量；逐步引入 TS strict 模式                               |
