# ADR-0007: 样式方案 - Tailwind CSS + CSS Variables

- 状态: Accepted（多主题部分被 ADR-0009 取代）
- 日期: 2026-07-29
- 决策者: 项目初始团队

## 背景与问题陈述

Nova 的 UI 样式有以下需求：

1. **快速迭代**：MVP 阶段需要频繁调整 UI，样式方案不能成为瓶颈
2. **主题支持**：通过 CSS Variables 支持主题化；当前收敛为单一暗色中性主题（见 ADR-0009，原 4 套主题已删除）
3. **动效精细**：星空、仪表盘、过渡动画需要精确控制 CSS 变量
4. **视觉一致性**：组件之间需要统一的间距、圆角、阴影、色彩 Token
5. **团队协作**：多人开发需要统一的命名和组织方式

## 考虑过的方案

### 方案 A: Tailwind CSS (Utility-First) + CSS Variables（主题层）

**分层方式：**

```
┌─────────────────────────────────────────────┐
│  组件内样式 (Tailwind utilities)             │
│  className="bg-deep-900 text-star-gold ..." │
├─────────────────────────────────────────────┤
│  设计 Token 层 (CSS Variables)              │
│  :root { --color-deep-900: #0A0E27; ... }   │
│  [data-theme="cyberpunk"] { --color... }    │
├─────────────────────────────────────────────┤
│  全局覆盖层 (少量 CSS 写在 /styles)          │
│  滚动条样式、全局 reset、keyframes          │
└─────────────────────────────────────────────┘
```

**主题系统实现：**

- 所有颜色/阴影/圆角 Token 用 CSS Variables 定义
- 主题通过 `document.documentElement.dataset.theme` 应用；当前为单一 `neutral`（见 ADR-0009）
- 主题定义集中在 `src/styles/index.css` 的 `:root`，未来如需回归多主题可扩展 `[data-theme=...]` 块

**优点:**

- Utility-First 开发极快，无需来回切 CSS 文件
- 天然避免命名冲突（BEM 的噩梦）
- 生产构建可 PurgeCSS（Tailwind JIT 模式），产出 CSS < 20KB
- 团队协作风格统一（不用纠结「这个 class 该叫 card\_\_title 还是 card-title」）
- CSS Variables 切换主题零成本，无需重编译

**缺点:**

- HTML class 属性变成长串，初次看代码的人不习惯
- 复杂动效（多关键帧）还是要写原生 CSS
- 学习曲线：需要记住常用 utility 缩写（p-4 / mx-auto / text-xl 等）

### 方案 B: CSS Modules + SCSS

**优点:**

- 样式与组件文件分离，代码结构清晰
- SCSS 的 mixin / function / @extend 适合复用复杂样式
- 团队熟悉度高

**缺点:**

- 开发速度慢：写一个按钮需要切 2-3 个文件
- 主题系统需要自己搭（SCSS 变量 + 动态 class 切换）
- 样式文件数量爆炸，最终 bundle 比 Tailwind 大
- 命名规范需要团队约定，容易不一致

### 方案 C: CSS-in-JS (styled-components / Emotion)

**优点:**

- 样式与逻辑耦合，组件完全自包含
- 动态主题方便（ThemeProvider）
- 类型安全（TS 可检查样式 props）

**缺点:**

- **性能问题**：航行视图需要 60fps，CSS-in-JS 的运行时注入会增加 JS 主线程负担
- 包体积：styled-components runtime ~15KB gzip
- 调试困难：生成的 class 名是 hash，DevTools 不好定位
- **核心冲突**：WebGL 渲染场景下，JS 主线程越轻越好，CSS-in-JS 的运行时开销不可接受

## 决策

采用 **Tailwind CSS + CSS Variables** 方案。

另外：

- **Inline SVG 内部样式**：直接在 SVG 内用 `style` 属性或内联 `fill` / `stroke`，精确控制像素级视觉效果（契合用户对「光学对齐、视觉平衡」的高要求）
- **全局 Keyframes / Shader 相关 CSS**：写在独立 CSS 文件中，通过 `@layer utilities` 扩展 Tailwind

## 决策依据

1. **开发效率**：MVP 阶段快速迭代 UI，Tailwind 的 Utility-First 是最快方案
2. **主题友好**：CSS Variables 是浏览器原生主题切换方案，无运行时开销
3. **性能最优**：零 runtime，纯静态 CSS，不占用 JS 主线程
4. **SVG 友好**：Tailwind 不干预 SVG 内部，符合用户偏好的 Inline SVG 精细化控制
5. **生态工具**：Tailwind IntelliSense 插件提供智能补全，降低学习曲线

## 后果

### 正面影响

- 新成员上手一个下午即可开始写 UI
- 主题切换丝滑（毫秒级，无需重绘 JS）
- 最终 CSS 包体积极小，首屏更快

### 负面影响

- HTML 文件 class 属性长，PR review 时需要看语义而不是看 class 名
- 复杂自定义动画需要写 CSS 文件，与 Tailwind 混合写
- 需要团队统一约定：何时写在 class、何时抽成组件、何时写原生 CSS

### 风险与缓解措施

| 风险                            | 影响 | 概率 | 缓解措施                                                                                                     |
| ------------------------------- | ---- | ---- | ------------------------------------------------------------------------------------------------------------ |
| 滥用 `className` 导致重复代码   | 中   | 高   | 约定：同一处样式组合出现 ≥ 3 次必须抽成 React 组件；禁止用 CSS 类名包装 Tailwind（用 @apply 或直接组件封装） |
| 主题变量遗漏（深色/浅色适配差） | 中   | 中   | 定义完整的 Design Token 颜色对（--bg / --fg / --accent 等），ESLint 规则禁止在组件中使用硬编码颜色           |
| SVG 内部样式与主题不同步        | 中   | 低   | SVG 的 `fill` / `stroke` 使用 `currentColor` 或 CSS Variables，禁止硬编码颜色值                              |
