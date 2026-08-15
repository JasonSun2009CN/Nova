# ADR-0017: 官网（GitHub Pages）+ 应用更新检测

- 状态: Accepted
- 日期: 2026-08-15
- 决策者: 用户（产品决策）+ 工程评审

## 背景与问题陈述

项目已有完整功能（计时 / 星图 / 航行 / 成就 / 统计），并开始桌面打包（Tauri，`release.yml` tag 触发 5 平台构建）。缺两件事：

1. **官网**：没有一个对外发布页。用户希望用 GitHub Pages 托管，有统一设计语言、亮 / 暗双主题、各平台下载位置。
2. **更新检测**：应用要能发现「有新版本」——从官网静态页读最新版本号，与本机版本比较；落后则提示，用户可「前往官网」或「跳过此版本」。

同时本次发版版本号 = **0.6.0**（CI tag `v0.6.0`）。

## 考虑过的方案

### 官网托管位置

- **方案 A: 同一 repo 的 `website/` 目录 + GitHub Pages（Actions 部署）**（选定）
  纯静态 HTML/CSS/JS，零构建。`deploy-site.yml` 把 `website/` 部署到站点根，把 PWA 构建产物部署到 `/app/` 子路径。
- **方案 B: 独立 repo** —— 仓库割裂，需单独管理；否决。
- **方案 C: `docs/` 目录部署** —— `docs/` 已被项目文档占用；否决。

### 更新数据源

- **方案 A: 静态 `latest.json`**（选定）
  应用 fetch `https://jasonsun2009cn.github.io/Nova/latest.json`，比较版本。用户明确要求「从这个静态 page 里看 page 的最新版」。GitHub Pages 所有响应带 `Access-Control-Allow-Origin: *`，跨域可用。
- **方案 B: GitHub API `releases/latest`** —— 返回实时但依赖 API 限流（未认证 60/h）；且不满足「读静态页」的诉求；否决为数据源（官网下载区仍用 API 获取各平台资产链接，失败回退 release 页）。

### 应用版本来源

- **方案 A: Vite `define` 构建时注入 `__APP_VERSION__`**（选定）
  `vite.config.ts` 读 `package.json` 版本，注入全局常量。Web 与 Tauri 都走 `pnpm build`，单一来源。
- **方案 B: Tauri runtime `getVersion()`** —— 异步且仅桌面端可用，Web/PWA 拿不到；否决。

### PWA 网页版部署

- **方案 A: 子路径 `/Nova/app/` + `vite build --base=/Nova/app/`**（选定）
  官网与网页版同站：官网根 `/Nova/`，PWA 在 `/Nova/app/`。`public/manifest.json` 路径改相对（`./`），SW 用 base 生成作用域；`StarCatalogRepository` 本就用 `document.baseURI` 解析相对资源，天然适配子路径。
- **方案 B: 单独域名 / 不部署网页版** —— 增加运维复杂度 / 丢失「在线使用」入口；否决。

### 跳过版本持久化

- **方案 A: settings 新增 `skippedUpdateVersion`（仿 `acceptedTermsVersion`）**（选定）
  Dexie `settings` 表无固定列，加键 + 默认值即可，无需 DB 迁移；`resetToDefaults` 自动覆盖。
- **方案 B: localStorage** —— 可行但与应用「settings 存 Dexie」的习惯不一致；否决。

## 决策

1. 官网 = `website/` 纯静态站点，GitHub Pages（Actions）部署，根路径为官网，`/app/` 为 PWA 网页版。
2. 官网设计语言：亮 / 暗双主题（CSS Custom Properties，`data-theme`），金色唯一强调色，Space Grotesk 展示字体，中英双语（`site.js` 内置字典 + 切换）。
3. 更新检测：`src/utils/version.ts`（`compareVersions` 纯函数）+ `src/utils/update-check.ts`（fetch `latest.json`、校验、评估）+ `UpdateNotice` 底部细条（前往官网 / 跳过此版本）。
4. 版本号统一 `0.6.0`（`package.json` / `src-tauri/tauri.conf.json` / `Cargo.toml` / `Cargo.lock` / `website/latest.json`）。
5. 发版：合并 main → 推 `v0.6.0` tag → `release.yml` 构建 5 平台并发布 Release；官网下载区经 GitHub API 读资产直链。

## 决策依据

- 用户明确要求「用 gitpage 托管」「从静态 page 读最新版」「双色系亮暗双主题」。
- 纯静态官网零构建、零后端，与静态托管天然匹配；相对路径保证任何 base 可用。
- `latest.json` 作为更新检测唯一权威，语义简单、可被 curl / 浏览器直接读。
- 更新检测跨域 fetch 依赖 GitHub Pages 的 `Access-Control-Allow-Origin: *`（部署后验证）。

## 后果

### 正面影响

- 更新检测零后端、零账户，纯静态清单 + 纯函数比较，可完全单测。
- 官网与 PWA 同站，用户「下载 / 在线使用」一站式。
- 版本单一来源（package.json → `__APP_VERSION__`），Tauri 与 Web 一致。

### 负面影响

- `website/latest.json` 需**随每次发版手动同步**版本号，否则已部署的旧版本不会提示更新（`website/README.md` 已注明）。
- PWA 部署路径固定为 `/Nova/app/`，若仓库改名 / 迁移需同步改 `build:pages` 的 base 与 manifest。

### 风险与缓解

- **PWA 子路径**：base 影响 SW 作用域与 manifest → `--base` + 相对 manifest 路径，已本地 `build:pages` 验证（index.html 引用 `/Nova/app/assets/...`，SW 42 项 precache）。
- **GitHub Pages CORS**：预期返回 `*`；部署后 `curl -I` 验证，若无则改走 GitHub raw。
- **下载区 GitHub API 限流**：60 次/小时，失败时按钮回退指向 GitHub Releases 页，不影响主流程。
