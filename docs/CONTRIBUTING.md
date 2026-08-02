# Nova 协作规范 (Contributing Guide)

> 欢迎成为 Nova 的贡献者！本文档说明如何高效、规范地参与项目协作。

---

## 1. 参与方式

你可以通过以下方式为 Nova 做出贡献：

| 贡献类型      | 说明                             | 在哪里操作                             |
| ------------- | -------------------------------- | -------------------------------------- |
| 🐛 报告 Bug   | 发现应用缺陷、异常行为、渲染错误 | GitHub Issues → "Bug Report" 模板      |
| 💡 功能建议   | 提出新的功能、改进现有设计       | GitHub Issues → "Feature Request" 模板 |
| 📝 文档改进   | 修正拼写、补充说明、翻译文档     | 直接提 PR 修改 docs/ 或 README         |
| 🎨 UI/UX 优化 | 视觉改进、动效优化、无障碍改进   | 先在 Issue 中讨论，确认后提 PR         |
| 💻 代码贡献   | 修复 Bug、实现新功能、重构代码   | 按下方「代码贡献流程」进行             |

---

## 2. 代码贡献流程

### 2.1 总体流程（GitHub Flow）

```
  ① Fork 本仓库
     ↓
  ② Clone 到本地，创建 feature 分支
     ↓
  ③ 编码、写测试、本地验证通过
     ↓
  ④ Push 到你自己的 Fork
     ↓
  ⑤ 提交 Pull Request，填写 PR 模板
     ↓
  ⑥ Review（至少 1 人 Approvals + CI 全部通过）
     ↓
  ⑦ Squash Merge 到 main 分支
```

### 2.2 详细步骤

#### Step 1: Fork & Clone

```bash
# 1. 在 GitHub 页面点击 Fork 按钮，创建你自己的副本

# 2. Clone 你自己的副本到本地
git clone git@github.com:<your-username>/Nova.git
cd Nova

# 3. 添加上游仓库（保持同步）
git remote add upstream git@github.com:JasonSun2009CN/Nova.git
```

#### Step 2: 同步上游 & 创建分支

```bash
# 每次开发前先同步 main 分支
git fetch upstream
git checkout main
git rebase upstream/main

# 创建功能分支（命名规范见 §3）
git checkout -b feat/starmap-search-bar
```

#### Step 3: 编码 & 提交

```bash
# 安装依赖
pnpm install

# 启动开发
pnpm dev

# 本地自检（提交前必须全部通过）
pnpm lint
pnpm typecheck
pnpm test
```

#### Step 4: 提交 PR

```bash
# 提交到自己的 Fork
git push origin feat/starmap-search-bar
```

然后在 GitHub 页面点击 **Compare & Pull Request**，填写 PR 模板：

```markdown
## 📋 描述

简要说明本 PR 做了什么。

## 🔗 关联 Issue

Closes #123（如果修复了某个 Issue，会自动关闭）

## 📝 实现细节

- 关键点 1
- 关键点 2

## ✅ 测试

- [ ] 新增单元测试覆盖新逻辑
- [ ] 所有现有测试通过
- [ ] 手动验证过的场景（列出）

## 🖼️ 截图（如有 UI 变更）

| Before | After |
| ------ | ----- |
| 图片   | 图片  |
```

---

## 3. 分支命名规范

```
<type>/<short-description-in-kebab-case>
```

### 3.1 Type 类型

| Type         | 说明                       | 示例                                                  |
| ------------ | -------------------------- | ----------------------------------------------------- |
| **feat**     | 新功能 / 新模块            | `feat/starmap-zoom`、`feat/time-dilation-shader`      |
| **fix**      | 修复 Bug                   | `fix/timer-background-freeze`、`fix/star-color-wrong` |
| **refactor** | 代码重构（不改变功能）     | `refactor/physics-module-split`                       |
| **perf**     | 性能优化                   | `perf/starmap-render-10k-stars`                       |
| **docs**     | 文档变更                   | `docs/readme-quickstart`、`docs/adr-0009-sso`         |
| **style**    | 代码格式调整（不影响逻辑） | `style/prettier-all-files`                            |
| **test**     | 测试相关（新增/修复测试）  | `test/physics-lorentz-factor`                         |
| **chore**    | 构建脚本、CI、依赖升级等   | `chore/upgrade-react-19`、`chore/add-e2e-ci`          |
| **revert**   | 回滚之前的提交             | `revert/0a1b2c3d-bad-feature`                         |

### 3.2 命名示例

```
✅ 推荐：
feat/starmap-search-bar
fix/timer-resume-after-refresh
refactor/engine-layer-separation
docs/adr-0007-styling
chore/upgrade-vite-6

❌ 避免：
add-search（缺少 type）
fix bug123（非 kebab-case，不描述内容）
```

---

## 4. Commit 规范（Conventional Commits）

**所有 commit message 必须遵循 Conventional Commits 规范**，会自动生成 CHANGELOG 并计算版本号。

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 4.1 Type（与分支命名一致）

| Type     | 是否放入 CHANGELOG | 说明               |
| -------- | ------------------ | ------------------ |
| feat     | ✅                 | 新功能             |
| fix      | ✅                 | Bug 修复           |
| perf     | ✅                 | 性能优化           |
| refactor | ❌                 | 重构（无功能变化） |
| docs     | ❌                 | 文档               |
| style    | ❌                 | 格式               |
| test     | ❌                 | 测试               |
| chore    | ❌                 | 构建/CI/依赖       |
| revert   | ✅                 | 回滚               |

### 4.2 Scope（可选）

指变更涉及的模块，常用值：

- `starmap` - 星图相关
- `voyage` - 航行模式
- `engine` - 引擎层（物理/渲染/导航）
- `ui` - 通用 UI 组件
- `store` - 状态管理
- `data` - 星表数据 / 持久化
- `ci` - 持续集成
- `*` - 跨多模块（可省略 scope）

### 4.3 Subject

- 英文，简洁描述变更内容，不超过 50 字符
- 以动词原形开头（`add` / `fix` / `remove` / `refactor` ...）
- 首字母小写，末尾不加句号

### 4.4 Body（可选）

详细说明变更原因、设计决策、与之前行为的差异等，每行不超过 72 字符。

### 4.5 Footer（可选）

- Breaking Change: `BREAKING CHANGE: <描述>` （会触发大版本号变更）
- 关闭 Issue: `Closes #123, #456`

### 4.6 示例

```
feat(starmap): add search bar for star names and HIP IDs

- 支持搜索常用名（Polaris, Sirius）和 Hipparcos 编号
- 搜索结果按距离排序，最近的在上方
- 选中结果后自动定位并高亮

Closes #42
```

```
fix(engine): correct Lorentz factor precision at v > 0.999c

之前使用单精度浮点计算导致 v 接近 c 时误差超过 5%，
改为双精度并增加渐进展开 fallback。

Fixes #88
```

### 4.7 工具辅助

推荐使用 `commitlint` + `husky` 做提交前自动校验，不符合规范会直接拒绝提交（项目已配置）。

---

## 5. Pull Request 规范

### 5.1 PR 大小

- **推荐**：每个 PR 专注一个目标，代码量 ≤ 400 行
- **可接受**：大型重构可拆分为多个 PR，顺序合并
- **避免**：一个 PR 既加功能又修 Bug 还重构（无法 review）

如果你的 PR 超过 600 行，请在描述中说明「为什么不能拆分」。

### 5.2 PR 标题

标题遵循与 Commit Message 相同的 Conventional Commits 规范：

```
feat(starmap): add search bar for star names
fix(engine): correct Lorentz factor precision
docs: add ADR-0007 styling solution
```

### 5.3 Review 流程

1. **自动检查**：CI 会自动运行 lint / typecheck / test / build / e2e
   - ❌ 任何一项失败 → 请先修复，reviewer 不会看
   - ✅ 全部通过 → 等待 review
2. **指派 Reviewer**：PR 作者需要手动指派至少 1 名 reviewer
   - 小改动（docs / style / test）：1 人 Approvals 即可合并
   - 功能 / Bug 修复：至少 1 名核心成员 Approvals
   - **架构变更（新 ADR）**：需要 2+ Approvals + 讨论达成共识
3. **处理评论**：
   - 每条 Review 评论都需要回复（「Done」/ 「好建议，下一版改」/ 「不同意，因为 XXX」）
   - 建议性修改可直接 commit，争议性修改请在评论区讨论
4. **修改后 Push**：新增 commit 即可（不要 amend/force push，方便 reviewer 查看增量）
5. **合并**：PR Author 或 Maintainer 点击 **Squash and Merge**，保持 main 分支历史干净

### 5.4 Squash Commit 规范

Squash 后的 commit message 需要手动整理为 Conventional Commits 格式（GitHub 会默认用 PR 标题，通常就可以）。

---

## 6. Issue 规范

### 6.1 Bug Report 模板

```markdown
## 🐛 Bug 描述

清晰简洁地描述 Bug 是什么。

## 🔄 复现步骤

1. 打开 Nova
2. 设定 25 分钟专注
3. 点击「开始」
4. 切换浏览器标签页 1 分钟后切回
5. 观察计时器：显示的时间不对

## ✅ 预期行为

计时器应该正确累加时间。

## 🖥️ 环境信息

- OS: [e.g. macOS 14.5]
- Browser: [e.g. Chrome 126.0]
- Nova Version: [e.g. v0.1.0-alpha]

## 📸 截图 / 录屏

如有必要，附上截图或录屏。

## 📝 附加信息

其他可能有用的上下文（浏览器 Console 报错信息等）。
```

### 6.2 Feature Request 模板

```markdown
## 💡 功能描述

简要说明你想要的功能。

## 🎯 解决的问题

这个功能解决了什么痛点？

## 📐 你期望的实现方式

（可选）描述你设想的 UI 或交互方式。

## 🔗 参考案例

（可选）其他产品的类似功能截图或链接。
```

---

## 7. 沟通与决策

### 7.1 沟通渠道

- **日常讨论**：GitHub Discussions（公开、可搜索、异步友好）
- **Bug / Feature**：GitHub Issues
- **架构决策**：ADR PR（见 docs/adr/）

### 7.2 决策方式

| 决策类型            | 决策方式                    | 记录位置                |
| ------------------- | --------------------------- | ----------------------- |
| 代码实现细节        | Reviewer + Author 协商      | PR Review 评论          |
| 新功能 / 交互设计   | 先 Issue 讨论，后 PR 实现   | Issue + 设计文档        |
| 技术选型 / 架构变更 | ADR 提案 + 至少 2 Approvals | docs/adr/ 下的 ADR 文件 |
| 紧急 Bug 修复       | 维护者直接决策，事后同步    | PR + Issue              |

### 7.3 共识原则

- **Do-ocracy**：做事情的人做决策。如果某人愿意实现并维护某个功能，TA 在该决策上有最大权重。
- **Consensus over Voting**：优先达成共识，而不是简单投票。反对者需要提出建设性的替代方案，而不只是说「我不同意」。
- **Assume Good Faith**：相信所有贡献者都是出于善意，争议时先问清楚对方的背景和考虑。

---

## 8. 版本与发布

### 8.1 版本号

严格遵循 **Semantic Versioning 2.0.0**：

- **MAJOR**：不兼容的 API 变更（v1.0.0 前，可能频繁变更）
- **MINOR**：向后兼容的新功能
- **PATCH**：向后兼容的 Bug 修复

### 8.2 发布节奏

- **Alpha (v0.x.x)**：按需发布，功能完成就发
- **Beta (v1.x.x)**：每 2-4 周发布一次
- **Release (v2.x+)**：每 1-2 月发布一次，附带 Patch 紧急修复

### 8.3 发布流程

由 Maintainer 执行：

1. 确认 main 分支 CI 全绿
2. `pnpm version <major|minor|patch>`（自动打 tag + 更新 CHANGELOG）
3. `git push --follow-tags`
4. GitHub Release 页面填写 Release Notes
5. 部署生产环境

---

## 9. 致谢与贡献者

- 所有贡献者都会出现在 GitHub 的 Contributors 列表中
- 重大贡献（实现核心引擎、修复关键 Bug）会在 Release Notes 中单独鸣谢
- 长期活跃贡献者会被邀请成为 Maintainer

---

> 再次感谢你的贡献！每一行代码、每一个 Issue、每一次 Review，都在让 Nova 变得更好。✨
