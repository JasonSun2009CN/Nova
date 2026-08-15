# Nova 官网

纯静态站点，随 GitHub Pages 自动部署到 `https://jasonsun2009cn.github.io/Nova/`（见 `.github/workflows/deploy-site.yml`）。

## 目录

```
website/
├── index.html            官网首页（中英双语，data-i18n 由 site.js 渲染）
├── latest.json           更新检测清单 —— 应用的「最新版本」数据源（唯一权威）
├── assets/
│   ├── site.css          设计系统（亮/暗双主题 tokens + 布局）
│   ├── site.js           主题/语言切换、星点阵、版本与下载资产填充
│   ├── space-grotesk-latin.woff2  展示字体（与 app 一致）
│   ├── favicon.svg       站点图标（与 app 一致）
│   └── app-hero.png      首页首屏实机截图
└── README.md
```

## 发版时（必做）

1. 把 `latest.json` 的 `version` 改为新版本号（应用更新检测会读它，与 `package.json` / `src-tauri/tauri.conf.json` 保持一致）。
2. 有需要可更新 `notes` / `releasedAt`。
3. 推送 main → Pages 自动部署。

## 本地预览

```bash
python3 -m http.server 8080 --directory website
# 打开 http://localhost:8080
```

注意：`file://` 直接打开时 fetch `latest.json` / GitHub API 会跨域失败（属预期，会回退为 GitHub Releases 链接）；部署后无此问题。
