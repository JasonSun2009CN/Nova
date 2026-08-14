# Nova 桌面打包指南

Nova 用 Tauri 2 打包成桌面应用（macOS / Windows / Linux）。本文件讲「怎么打包」和「产物在哪里」。

## 前置条件

- Rust（`rustc` / `cargo`，本项目已验证 1.97.1）
- pnpm 8
- macOS 本机打包需 Xcode Command Line Tools（`xcode-select --install`）
- macOS 交叉编译需已添加对应 Rust target（见下方命令）

## 本地打包（macOS）

在项目根目录执行：

```bash
# 完整打包：先跑 pnpm build 再编译 Rust，按 tauri.conf.json 的 bundle.targets 出包
pnpm tauri build

# 指定架构（Apple Silicon 出原生 arm64）
pnpm tauri build --target aarch64-apple-darwin

# 指定 bundle 类型（app = .app，dmg = 安装盘镜像）
pnpm tauri build --bundles app
pnpm tauri build --bundles app,dmg

# 首次添加交叉编译 target
rustup target add aarch64-apple-darwin
rustup target add x86_64-apple-darwin
```

> `pnpm tauri build` 会先执行 `beforeBuildCommand`（即 `pnpm build`）生成 `dist/`，再编译 Rust 并打包。首次 Rust 编译约 5 分钟，之后有缓存很快。

## 生成文件地址

产物统一在 `src-tauri/target/` 下。macOS 默认（本机架构）产物：

| 产物            | 路径                                                            |
| --------------- | --------------------------------------------------------------- |
| 可执行文件      | `src-tauri/target/release/nova`                                 |
| 应用包 `.app`   | `src-tauri/target/release/bundle/macos/Nova.app`                |
| 安装镜像 `.dmg` | `src-tauri/target/release/bundle/dmg/Nova_<version>_<arch>.dmg` |

其中 `<version>` 来自 `tauri.conf.json` / `Cargo.toml` 的 `version`，`<arch>` 为 `x64`（Intel）或 `aarch64`（Apple Silicon）。

跨平台产物（在对应平台或 CI 上构建）：

| 平台        | 产物路径                                                                                           |
| ----------- | -------------------------------------------------------------------------------------------------- |
| Windows     | `src-tauri/target/x86_64-pc-windows-msvc/release/nova.exe` 与 `.../bundle/nsis/*.exe`              |
| Linux x64   | `src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/appimage/*.AppImage` 与 `.../deb/*.deb`  |
| Linux arm64 | `src-tauri/target/aarch64-unknown-linux-gnu/release/bundle/appimage/*.AppImage` 与 `.../deb/*.deb` |

## GitHub CI 自动打包（5 平台）

`.github/workflows/release.yml` 已配好，**推 `v*` 标签**（或手动 workflow_dispatch）即触发：

- macOS（`aarch64-apple-darwin` + `x86_64-apple-darwin`）→ `.app` + `.dmg`
- Windows x64 → `.exe` + NSIS 安装器
- Linux x64 → `.AppImage` + `.deb`
- Linux arm64（QEMU 容器内交叉编译）→ `.AppImage` + `.deb`
- 末尾 `release` job 用 `softprops/action-gh-release` 自动发布成 GitHub Release

```bash
git tag v0.1.0
git push origin v0.1.0
```

## 配置要点

- 窗口尺寸在 `src-tauri/tauri.conf.json` 的 `app.windows`（当前 1280×800，min 900×620）。
- 打包类型在 `tauri.conf.json` 的 `bundle.targets`（当前 `["app", "dmg"]`）。
- 应用标识 `identifier: "app.nova.focus"`，图标在 `src-tauri/icons/`。
- 版本号需同步改两处：`src-tauri/tauri.conf.json` 与 `src-tauri/Cargo.toml` 的 `version`。
