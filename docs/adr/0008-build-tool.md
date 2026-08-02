# ADR-0008: 构建工具与包管理 - Vite + pnpm

- 状态: Accepted
- 日期: 2026-07-29
- 决策者: 项目初始团队

## 背景与问题陈述

Nova 需要一套现代前端工程化方案，满足：

1. **开发体验**：冷启动 < 2s，HMR < 200ms
2. **类型安全**：TypeScript 严格模式，构建时类型检查
3. **代码质量**：提交前自动 lint + format + typecheck
4. **测试**：单测 + E2E 测试，CI 可运行
5. **依赖一致性**：多人协作依赖版本严格一致
6. **部署简单**：纯静态产物，可部署到任意静态托管（Vercel / Netlify / GitHub Pages）

## 考虑过的方案

### 方案 A: Vite + pnpm + Vitest + Playwright

**完整工具链：**

- **构建工具**：Vite 5.x（esbuild + Rollup）
- **包管理**：pnpm 8.x（严格依赖，symlink 模式）
- **单测**：Vitest（Vite 原生集成，Jest 兼容 API）
- **E2E**：Playwright（跨浏览器，无头运行）
- **Git 钩子**：Husky + lint-staged（提交前检查）
- **类型检查**：tsc --noEmit（单独步骤，不阻塞 dev server）

**优点:**

- Vite 冷启动和 HMR 速度碾压 Webpack（原生 ESM，无需打包）
- pnpm 严格模式避免幽灵依赖（phantom dependencies），依赖体积比 npm/yarn 少 50%
- Vitest 与 Vite 共享配置，零配置启动，速度是 Jest 的 2-3 倍
- Playwright 一次装所有浏览器，API 现代，支持 Trace Viewer 调试 E2E 失败

**缺点:**

- ESM-first：部分老旧 CommonJS 包可能需要 `optimizeDeps` 配置
- 团队中若有人习惯 npm/yarn，需强制切换 pnpm

### 方案 B: Next.js (App Router) + npm

**优点:**

- SSR / ISR 内置（但 Nova 是纯客户端，不需要）
- 路由系统、API Routes 等全栈能力（不需要）

**缺点:**

- **过度设计**：Nova 100% 客户端运行，SSR 能力完全用不上，反而增加 bundle 和复杂度
- Next.js 的 Image / Font 优化与 Nova 的 WebGL/SVG 场景不匹配
- 本地开发服务器（Next dev）性能不如纯 Vite
- 部署需 Vercel（或额外配置），不如纯静态灵活

### 方案 C: Webpack 5 + CRA / Vue CLI

**优点:**

- 生态最成熟（但在走下坡路）

**缺点:**

- 冷启动慢（CRA 新项目需 10s+，依赖多了分钟级）
- HMR 速度远逊于 Vite
- 配置地狱（ eject 之后难维护）
- 业界已全面转向 Vite，继续选 Webpack 属于历史倒车

## 决策

采用 **方案 A：Vite + pnpm + Vitest + Playwright**。

## 决策依据

1. **开发体验为王**：Nova 有大量 WebGL 和 UI 调整的迭代，HMR 快是硬需求
2. **依赖纯净**：pnpm 的严格模式能避免「我这能跑你那不能跑」的经典问题
3. **测试一体化**：Vitest 和 Vite 共享 TS/alias 配置，零额外配置成本
4. **未来兼容**：纯静态产物可部署到任意地方，不绑定平台
5. **业界趋势**：Vite + pnpm 是 2024+ 新前端项目的标准组合

## 后果

### 正面影响

- 新成员 `pnpm install && pnpm dev` 10 秒内可以看到界面
- CI 构建时间比 Webpack 方案少 60%
- 依赖体积小（节省 CI 缓存空间和下载时间）

### 负面影响

- 部分老的 CJS-only 库需要手动加 `optimizeDeps.include`
- 团队成员需要学习 pnpm 常用命令（差异很小，和 npm 几乎一致）
- ESLint 配置需要处理 ESM 导入规则

### 风险与缓解措施

| 风险                                  | 影响 | 概率 | 缓解措施                                                                                        |
| ------------------------------------- | ---- | ---- | ----------------------------------------------------------------------------------------------- |
| Node.js 版本不一致导致安装/运行失败   | 中   | 高   | 使用 `.nvmrc` + `package.json` 的 `engines` 字段；CI 中 lockfile 校验；README 明确要求 Node 18+ |
| 某依赖包不兼容 ESM（CJS 写坏了）      | 中   | 中   | 维护一个 `vite.config.ts` 的 `optimizeDeps` 白名单；尽量选 ESM-first 的库                       |
| Playwright 浏览器下载缓慢（国内环境） | 中   | 中   | 配置 `PLAYWRIGHT_DOWNLOAD_HOST` 镜像；CI 使用官方 Docker 镜像自带浏览器                         |
| 安装后出现幽灵依赖（有人用 npm 安装） | 中   | 低   | 使用 `preinstall` 脚本检测包管理器（`npm_config_user_agent`），非 pnpm 则报错退出并提示         |
