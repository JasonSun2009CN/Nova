# ADR-0003: 状态管理方案 - Zustand

- 状态: Accepted
- 日期: 2026-07-29
- 决策者: 项目初始团队

## 背景与问题陈述

Nova 有多个需要全局共享的状态：
1. **航行状态**：当前模式（idle/voyaging/paused/arrived）、开始时间、剩余时间、速度、当前位置、目标天体
2. **用户偏好**：主题、默认引擎、白噪音设置、通知偏好
3. **星图状态**：当前缩放级别、视图中心、选中天体、搜索过滤条件
4. **航行记录**：历史航行列表、累计统计（异步写入 IndexedDB）
5. **成就进度**：已解锁成就、当前进度

需要一个既能高效处理上述状态、又不会引入过度复杂度的状态管理方案。

## 考虑过的方案

### 方案 A: Zustand

**优点:**
- 极简 API，学习成本低（~5 分钟入门）
- 无需 Provider，组件外也可调用（对 Web Worker、非 React 模块极友好）
- 包体积极小（< 2KB gzip）
- 原生支持 selector 精确订阅，避免不必要 re-render
- 支持 devtools、immer、persist 中间件
- 异步 action 直接写 async/await，无样板代码

**缺点:**
- 相比 Redux Toolkit，缺少规范化/标准化的数据操作模式
- 缺少 action 追踪，调试大型复杂状态流不如 Redux DevTools 全面
- 社区相对小（但增长迅速）

### 方案 B: Redux Toolkit (RTK)

**优点:**
- 工业级方案，模式标准化，团队协作成本低
- DevTools 体验最佳（时间旅行调试）
- RTK Query 可覆盖未来 API 请求需求

**缺点:**
- Boilerplate 仍然较多（slice、reducer、extraReducer）
- 概念重：需理解 Store / Dispatch / Selector / Middleware / Thunk
- 跨模块调用需要额外处理
- **不匹配**：Nova 状态以高频小更新（计时器每 250ms 触发）为主，RTK 的 action 开销过于繁重

### 方案 C: Context + useReducer

**优点:**
- React 原生方案，无第三方依赖
- 概念简单

**缺点:**
- Context 变更会导致所有子组件 re-render，需要大量 memo 优化
- 组件外无法调用（Web Worker 通知 UI 更新需要额外桥接）
- 异步 action 需要自己写包装
- 中间状态多（航行中每秒多次更新）时性能堪忧
- 状态持久化、debug 工具需要自建

### 方案 D: Jotai / Recoil（原子化状态）

**优点:**
- 原子化模型适合细粒度状态，可避免 prop drilling
- 按需更新，性能优秀

**缺点:**
- 对于"块状"状态（如整个航行状态对象）不如 Zustand 直觉
- Recoil 已停止维护（Meta 放弃）
- Jotai 派生状态（derived atom）对于新手心智负担较重

## 决策

选择 **Zustand** 作为全局状态管理方案。
局部状态（表单输入、UI开关）仍使用 React 原生 `useState` / `useReducer`。

## 决策依据

1. **场景匹配**：Nova 的核心状态（航行进度）是高频、高变更的单一对象，Zustand 的 object + selector 模型天然适合
2. **跨模块调用**：计时器运行在 Web Worker 中，需要从 Worker 直接更新 store（Zustand 支持 store.setState 脱离 React 调用）
3. **学习曲线**：团队成员可快速上手，无需理解 Redux 那套概念体系
4. **体积与性能**：2KB 的体积对首屏友好；正确使用 selector 可避免不必要的 re-render
5. **未来扩展性**：配合 immer middleware 可简化深层更新，配合 persist middleware 可快速实现偏好持久化

## 后果

### 正面影响
- Web Worker 中可直接 `import { useVoyageStore } from '@/store'` 并调用 `useVoyageStore.setState(...)`，无需 postMessage 复杂桥接
- 状态切片（store 按领域拆分：voyage / settings / starmap / achievements）清晰
- 代码量比 Redux 方案少 30% 以上

### 负面影响
- 需要约定"状态更新的单一数据源"原则（避免多个地方随意 setState 导致调试困难）
- DevTools 需要手动开启（配置 middleware）
- 大团队协作时，如果不严格遵守约定，store 容易变成"上帝对象"

### 风险与缓解措施

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|---------|
| store 拆分不当导致循环依赖 | 中 | 中 | 强制按领域拆分 store（voyage / starmap / user）；store 之间通过订阅而非直接 import |
| 高频更新引发性能问题 | 高 | 中 | 时间更新走 `subscribe` + `requestAnimationFrame`；UI 组件用 `shallow` 选择精确字段；每 250ms 更新而非每 16ms |
| 缺少严格 action 导致 bug 难追踪 | 中 | 低 | 约定：所有更新操作封装在 store 的 action 方法中，禁止外部直接 setState；关键 action 打 console.debug 日志 |
