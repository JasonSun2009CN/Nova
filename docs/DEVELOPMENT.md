# Nova 开发规范 (Development Guide)

> 让代码像星空一样有序、优雅、可维护。

---

## 1. 前置要求

### 1.1 环境准备

| 工具    | 最低版本 | 验证命令        |
| ------- | -------- | --------------- |
| Node.js | 18.17+   | `node -v`       |
| pnpm    | 8.6+     | `pnpm -v`       |
| Git     | 2.40+    | `git --version` |

**推荐使用 nvm 管理 Node.js 版本**：

```bash
# 项目根目录有 .nvmrc，直接切换
nvm use
```

### 1.2 IDE 配置

推荐使用 **VS Code**，并安装以下插件：

- **ESLint**（dbaeumer.vscode-eslint）- 实时语法检查
- **Prettier**（esbenp.prettier-vscode）- 代码格式化
- **Tailwind CSS IntelliSense**（bradlc.vscode-tailwindcss）- Tailwind 补全
- **TypeScript Vue Plugin (Volar)** - 可选，增强 TS 支持
- **GLSL Lint**（circledev.glsl-lint）- Shader 文件语法检查
- **Error Lens** - 行内错误提示

**项目根目录已包含 `.vscode/settings.json`**，打开项目时会自动应用推荐配置（保存时自动格式化 + 自动修复 ESLint）。

---

## 2. 开发工作流

### 2.1 日常命令速查

```bash
# 安装依赖（必须用 pnpm，否则会被 preinstall hook 拒绝）
pnpm install

# 启动开发服务器（默认 http://localhost:5173）
pnpm dev

# 生产构建
pnpm build

# 预览构建产物
pnpm preview

# 运行代码检查（ESLint）
pnpm lint
pnpm lint:fix   # 自动修复可修复的问题

# 运行格式化（Prettier）
pnpm format
pnpm format:check   # 仅检查，不修改

# 类型检查（TypeScript）
pnpm typecheck

# 单元测试
pnpm test
pnpm test:watch     # watch 模式
pnpm test:coverage  # 覆盖率报告

# E2E 测试
pnpm test:e2e            # 无头模式运行
pnpm test:e2e:ui         # 带 UI 的调试模式
pnpm test:e2e:trace      # 失败时生成 Trace Viewer

# 一键本地全量自检（提交前必跑）
pnpm check
```

### 2.2 提交流程

```
开发完成
   ↓
pnpm check （lint + typecheck + test + format:check）
   ↓
全部通过 ✅
   ↓
git add <files>
git commit -m "符合 Conventional Commits 的 message"
   ↓
husky pre-commit hook 自动运行（lint-staged + commitlint）
   ↓
Push → 提交 PR
```

> 如果 commit 失败，请根据提示修改 commit message 或修复 lint 错误。

---

## 3. 代码风格

### 3.1 TypeScript 规范

#### 3.1.1 类型定义原则

- **默认启用 strict 模式**（tsconfig 已配置），禁止 `any`
- **宁可类型复杂，不可使用 any**。实在需要时用 `unknown` + 类型守卫
- **导出的类型**放在 `src/types/` 对应模块文件中
- **优先使用 type 而非 interface**，除非需要声明合并（declaration merging）

```typescript
// ✅ 推荐
type Star = {
  id: string;
  name: string | null;
  position: Vector3;
  spectralType: SpectralType;
  distance: number;
};

// ❌ 不推荐（interface 没有必要用）
interface Star {
  // ...
}

// ❌ 绝对禁止
function parseStar(json: any): any {
  return JSON.parse(json);
}

// ✅ 正确写法
function parseStar(json: string): Star | null {
  try {
    const parsed = JSON.parse(json) as unknown;
    if (isStar(parsed)) return parsed;
    return null;
  } catch {
    return null;
  }
}

// 类型守卫
function isStar(v: unknown): v is Star {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as Star).id === 'string' &&
    typeof (v as Star).distance === 'number'
  );
}
```

#### 3.1.2 函数签名

- **参数不超过 3 个**，超过时用对象参数（options pattern）
- **返回 Promise 的函数必须标注 async**（即使内部没用 await，保持语义一致）
- 函数式组件使用 `React.FC<Props>` 或直接标注 props

```typescript
// ✅ 推荐（options pattern）
type StartVoyageOptions = {
  destination: Star;
  durationMinutes: number;
  engineLevel: number;
  onProgress?: (progress: number) => void;
};

async function startVoyage(opts: StartVoyageOptions): Promise<VoyageResult> {
  // ...
}

// ❌ 不推荐（参数太多）
async function startVoyage(
  destination: Star,
  duration: number,
  engine: number,
  onProgress: any,
  onError: any,
  useRelativity: boolean,
): Promise<any> {
  // ...
}
```

#### 3.1.3 枚举与联合类型

- 有限集合**优先用联合类型 + as const**，次选 enum（避免 TS 生成额外代码）

```typescript
// ✅ 推荐（联合类型 + as const）
export const VoyageMode = {
  Timed: 'timed',
  Jump: 'jump',
  Free: 'free',
} as const;

export type VoyageMode = (typeof VoyageMode)[keyof typeof VoyageMode];

// 使用：VoyageMode.Timed → 'timed'
// 类型：VoyageMode → 'timed' | 'jump' | 'free'

// ❌ 不推荐（传统 enum，运行时有开销）
export enum VoyageMode {
  Timed = 'timed',
  Jump = 'jump',
  Free = 'free',
}
```

### 3.2 React 规范

#### 3.2.1 组件结构

每个组件一个文件，文件名 `PascalCase.tsx`。组件内部结构顺序：

```typescript
// 1. Imports（按分组排序：外部库 → 内部模块 → 资源）
import { useState, useMemo } from 'react';
import { twMerge } from 'tailwind-merge';
import { Star } from '@/types/star';
import { formatDistance } from '@/utils/format';
import StarIcon from '@/assets/icons/star.svg?react';

// 2. Props 类型定义
type StarCardProps = {
  star: Star;
  selected?: boolean;
  onClick?: (star: Star) => void;
  className?: string;
};

// 3. 组件定义
export function StarCard({
  star,
  selected = false,
  onClick,
  className,
}: StarCardProps) {
  // 4. 内部状态
  const [hovered, setHovered] = useState(false);

  // 5. Derived values（useMemo / useCallback）
  const displayName = useMemo(() =>
    star.name ?? formatHIPId(star.id),
    [star.id, star.name]
  );

  // 6. Handlers
  const handleClick = () => onClick?.(star);

  // 7. Return JSX
  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={twMerge(
        'rounded-lg p-4 border transition-all',
        selected ? 'border-star-gold bg-star-gold/10' : 'border-deep-500',
        hovered && 'scale-[1.02]',
        className
      )}
    >
      <StarIcon className="w-6 h-6" fill={spectralColor(star.spectralType)} />
      <h3 className="text-white font-medium">{displayName}</h3>
      <p className="text-deep-300 text-sm">{formatDistance(star.distance)} 光年</p>
    </div>
  );
}
```

#### 3.2.2 Hooks 规范

- **Hook 命名 `usePascalCase`**，放在 `src/hooks/` 目录
- 自定义 Hook 必须返回 **对象**（便于未来扩展，不破坏调用方）
- 不要在条件 / 循环中调用 Hook

```typescript
// ✅ 推荐：返回对象，可扩展
export function useVoyageTimer() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);

  const start = useCallback(() => setRunning(true), []);
  const pause = useCallback(() => setRunning(false), []);
  const reset = useCallback(() => {
    setElapsed(0);
    setRunning(false);
  }, []);

  return { elapsed, running, start, pause, reset };
}

// 调用方：
const { elapsed, running, start } = useVoyageTimer();

// ❌ 不推荐：返回数组，扩展困难
// 以后加字段会改变数组下标，所有调用方都要改
return [elapsed, running, start, pause, reset];
```

#### 3.2.3 性能注意事项

- 航行视图（每帧更新）的组件，**不要让 React 每帧 re-render**：
  - 高频更新的值用 `useRef` 存储，用 Canvas / WebGL 渲染
  - 低频显示（如剩余时间）：每 250ms 同步一次到 state 即可
- 列表渲染必须加稳定的 `key`（用 star.id / voyage.id，不要用数组下标）
- 大列表用 `react-window` 或 Canvas 虚拟渲染

### 3.3 命名规范速查表

| 类型              | 规范                       | 示例                                    |
| ----------------- | -------------------------- | --------------------------------------- |
| React 组件文件    | PascalCase.tsx             | `StarMap.tsx`, `VoyageDashboard.tsx`    |
| Hook 文件         | camelCase.ts（use 开头）   | `useVoyageTimer.ts`, `useStarSearch.ts` |
| Store 文件        | camelCase.ts（store 结尾） | `voyageStore.ts`, `settingsStore.ts`    |
| 工具函数文件      | camelCase.ts               | `formatTime.ts`, `lorentz.ts`           |
| 类型文件          | camelCase.ts               | `star.types.ts` 或放在 `src/types/`     |
| 组件名 / Class    | PascalCase                 | `StarCard`, `StarRenderer`              |
| 函数 / 变量       | camelCase                  | `calculateDistance`, `currentSpeed`     |
| 常量（primitive） | UPPER_SNAKE_CASE           | `MAX_STARS_RENDERED`, `LIGHT_SPEED`     |
| 常量（对象/数组） | camelCase + as const       | `spectralColors` as const               |
| 布尔变量          | is/has/should/can 前缀     | `isSelected`, `hasStarted`, `canJump`   |
| 事件处理函数      | onXxx / handleXxx          | `onClick`, `handleStarSelected`         |

### 3.4 注释规范

- **默认不写注释**：代码应该自文档化（命名清晰、结构简洁）
- **为什么 > 怎么做**：只注释"为什么这样写"，不要注释"这行代码在做什么"
- **公共 API 必须写 JSDoc**：所有从 `@/engine/index`、`@/utils/index` 导出的函数

```typescript
// ✅ 好注释：解释为什么
// 这里不用 Math.sqrt 是因为 v 非常接近 c 时会有浮点精度丢失，
// 改用渐近展开式 1 + v²/(2c²) + ... 获得更稳定的结果
const gamma = approximateLorentzFactor(v, c);

// ❌ 垃圾注释：重复代码内容
// 开根号计算 gamma
const gamma = Math.sqrt(1 - (v * v) / (c * c));

// ✅ 公共 API JSDoc
/**
 * 计算洛伦兹因子 γ = 1 / √(1 - v²/c²)
 *
 * 当 v 接近 c (v/c > 0.999) 时自动切换为双精度渐近展开，
 * 避免单精度浮点下的精度灾难。
 *
 * @param v - 飞船速度，单位 m/s
 * @param c - 光速，默认取 299_792_458 m/s
 * @returns 洛伦兹因子 γ，范围 [1, +∞)
 * @throws {RangeError} 当 v >= c 时抛出（物理上不可能）
 */
export function lorentzFactor(v: number, c: number = LIGHT_SPEED): number {
  // ...
}
```

### 3.5 Tailwind CSS 使用规范

- **禁止硬编码颜色值**：必须用 design token（`bg-deep-900`，不能 `bg-[#0A0E27]`）
- **重复出现的样式组合抽组件**，不要到处复制粘贴同一串 class
- **组件顺序**：position → display → box model → typography → background → effects → 其他

```
className="
  absolute top-0 left-0                      /* position */
  flex flex-col justify-center items-center   /* display */
  w-full h-full p-4 mx-auto mt-2              /* box model */
  text-xl font-bold text-white                /* typography */
  bg-deep-900/80 backdrop-blur-sm             /* background */
  rounded-lg shadow-lg transition-all          /* effects */
"
```

---

## 4. 项目结构与架构约束

### 4.1 导入边界（强制 ESLint 规则）

```
✅ 允许的依赖方向：

  src/pages ──→ src/components ──→ src/hooks ──→ src/store
                              ↘                       │
                                src/engine ←──────────┘
                                       ↘
                                         src/utils
                                         src/types
                                         src/data
```

**禁止反向依赖**：

- ❌ `src/engine/physics/` import React 组件或 Zustand store
- ❌ `src/utils/` import 来自 `components` / `pages` 的东西
- ❌ 跨层直接 import 内部实现：`components/StarMap` 直接 `import from '@/engine/renderer/internal/StarShader.glsl'`（只能走 `@/engine` 的公开出口）

### 4.2 路径别名

项目已配置以下别名（tsconfig + vite 同步）：

| 别名             | 指向               | 用途            |
| ---------------- | ------------------ | --------------- |
| `@/`             | `src/`             | 通用根别名      |
| `@/components/*` | `src/components/*` | UI 组件         |
| `@/engine/*`     | `src/engine/*`     | 引擎层（纯 TS） |
| `@/hooks/*`      | `src/hooks/*`      | 自定义 Hooks    |
| `@/store/*`      | `src/store/*`      | Zustand stores  |
| `@/utils/*`      | `src/utils/*`      | 工具函数        |
| `@/types/*`      | `src/types/*`      | 类型定义        |
| `@/data/*`       | `src/data/*`       | 静态数据        |
| `@/styles/*`     | `src/styles/*`     | 全局样式        |
| `@/assets/*`     | `src/assets/*`     | 资源文件        |

**永远使用别名，禁止相对路径 `../../components/...`**。

### 4.3 引擎层开发规范（详见 ADR-0005）

1. **0 React 依赖**：`src/engine/` 下的文件不允许 `import 'react'`
2. **纯函数优先**：所有算法暴露为 `(输入) → 输出` 的纯函数，便于测试
3. **状态隔离**：有状态类（`StarRenderer`、`VoyageController`）显式管理生命周期：
   - `constructor()` / `init()` 初始化
   - `start()` / `stop()` 启停
   - `dispose()` 清理资源（WebGL 资源、定时器、监听器）
4. **事件通信**：引擎通过 EventEmitter 或回调通知外部，绝不直接调用 React 或 Store

```typescript
// ✅ 引擎层正确的事件通知方式
type VoyageControllerEvents = {
  progress: (elapsed: number, progress: number) => void;
  arrived: (result: VoyageResult) => void;
  aborted: (reason: VoyageAbortReason) => void;
};

export class VoyageController extends EventEmitter<VoyageControllerEvents> {
  // ...

  private tick() {
    // ... 计算进度 ...
    this.emit('progress', this.elapsed, this.progress);

    if (this.progress >= 1) {
      this.emit('arrived', { destination: this.destination });
    }
  }
}

// React 适配层连接：
useEffect(() => {
  const controller = new VoyageController(opts);
  controller.on('progress', (e, p) => setProgress(p));
  controller.on('arrived', handleArrived);
  controller.start();
  return () => {
    controller.dispose();
  };
}, []);
```

---

## 5. 测试规范

### 5.1 测试金字塔

```
          / E2E 测试 \          ← 少量：关键用户旅程
         /───────────\         ← 占比 ~10%
        / 集成测试     \        ← 引擎多模块协作
       /───────────────\       ← 占比 ~20%
      /   单元测试        \      ← 最多：纯函数/算法
     /─────────────────────\     ← 占比 ~70%
```

### 5.2 单元测试（Vitest）

- 文件命名：`<被测试文件>.test.ts`，放在 `__tests__/` 目录或同目录
- **覆盖率要求**：
  - `src/engine/`（物理 / 导航 / 算法）：≥ 90%
  - `src/utils/`：≥ 80%
  - `src/store/`：≥ 70%
  - UI 组件：> 50%（关键交互必须有）
- 测试文件结构：

```typescript
import { describe, it, expect } from 'vitest';
import { lorentzFactor } from '@/engine/physics/lorentz';

describe('lorentzFactor', () => {
  it('returns 1 when v = 0', () => {
    expect(lorentzFactor(0)).toBe(1);
  });

  it('returns ~7.09 when v = 0.99c', () => {
    const v = 0.99 * LIGHT_SPEED;
    expect(lorentzFactor(v)).toBeCloseTo(7.0888, 3);
  });

  it('throws RangeError when v >= c', () => {
    expect(() => lorentzFactor(LIGHT_SPEED)).toThrow(RangeError);
  });

  it('has sub 1e-9 relative error for v between 0.5c..0.9999c', () => {
    // 数值精度的属性化测试
    for (const factor of [0.5, 0.9, 0.99, 0.999, 0.9999]) {
      const v = factor * LIGHT_SPEED;
      const naive = 1 / Math.sqrt(1 - (v * v) / (LIGHT_SPEED * LIGHT_SPEED));
      const computed = lorentzFactor(v);
      const relErr = Math.abs(computed - naive) / naive;
      expect(relErr).toBeLessThan(1e-9);
    }
  });
});
```

### 5.3 E2E 测试（Playwright）

- 放在 `tests/e2e/` 目录
- 只覆盖**关键用户旅程**，不要覆盖 UI 细节（那是单测的事）
- 每个 spec 一个用户场景：

```typescript
// tests/e2e/voyage-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('专注航行主流程', () => {
  test('用户设定 25 分钟定时航行 → 可到达半人马座α附近', async ({ page }) => {
    // 1. 打开首页
    await page.goto('/');
    await expect(page.locator('text=NOVA')).toBeVisible();

    // 2. 设定 25 分钟
    await page.getByLabel('专注时长').fill('25');
    await page.getByRole('button', { name: '开始航行' }).click();

    // 3. 验证进入航行模式
    await expect(page.locator('[data-testid="voyage-view"]')).toBeVisible();
    await expect(page.locator('text=剩余时间')).toBeVisible();

    // 4. 模拟航行完成（调用测试钩子快进时间）
    await page.evaluate(() => {
      (window as any).__TEST_ONLY__.fastForward(25 * 60 * 1000);
    });

    // 5. 验证到达页面
    await expect(page.locator('text=到达目的地')).toBeVisible();
  });
});
```

### 5.4 测试命令

```bash
# 只跑某个文件
pnpm test src/engine/physics/lorentz.test.ts

# 更新快照
pnpm test -u

# 调试 E2E 失败
pnpm test:e2e:trace
# 然后打开 playwright-report/trace.zip
```

---

## 6. 性能规范

### 6.1 性能预算（Performance Budget）

| 指标                  | 目标值                                  | 测量方式                    |
| --------------------- | --------------------------------------- | --------------------------- |
| 首屏加载 (LCP)        | < 2.0s（4G 网络）                       | Lighthouse                  |
| JS Bundle gzip        | < 300KB（v1.0）                         | `pnpm build` 输出           |
| 航行视图帧率          | ≥ 60fps (MBP 2019) / ≥ 30fps (中端手机) | Chrome DevTools Performance |
| 星图交互（缩放/平移） | 无明显卡顿（帧时间 < 32ms）             | 手动测试                    |
| 专注过程中主线程空闲  | ≥ 90%（计时器不卡 UI）                  | Performance 面板            |

### 6.2 WebGL / 渲染性能 Checklist

- [ ] 同一时刻渲染点不超过 20,000（LOD + 距离裁剪）
- [ ] 使用 `BufferGeometry` 而非手工 `Geometry`，使用 InstancedMesh 绘制大量恒星
- [ ] Shader 中避免分支（`if/else`），改用 `mix` / `step` 等函数
- [ ] 每帧调用的 JS：只改 uniform，不重建 material / geometry
- [ ] 页面隐藏时（`visibilitychange`）暂停渲染循环，节省 CPU/GPU
- [ ] Three.js `dispose()` 所有不再使用的 geometry / material / texture，避免内存泄漏

### 6.3 React 性能 Checklist

- [ ] 航行视图中**绝不**每帧 setState（用 useRef + requestAnimationFrame）
- [ ] 大列表（航行记录 > 100 条）必须虚拟化（react-window / 自研 Canvas 列表）
- [ ] `React.memo` 只在有明确性能数据证明需要时才加（不要过度 memo）
- [ ] 图片：WebP 格式，带 width/height 属性，设置 `loading="lazy"`
- [ ] 路由级代码分割（Vite 自动 `lazy(() => import(...))`）

---

## 7. 无障碍 (A11y) 规范

- **所有按钮**必须有可访问名称（纯图标按钮加 `aria-label`）
- **语义化 HTML**：`<button>` 做按钮（不要 div + onClick）、`<nav>` 做导航、`<main>` 做内容区
- **键盘可达**：Tab 键可走到所有交互元素，focus ring 不要用 outline: none 粗暴去掉
- **颜色对比度**：文字 / 背景 ≥ 4.5:1（WCAG AA）
- **减少动效**：检测 `prefers-reduced-motion`，关闭星光拖尾、滑动动画等重动效

```tsx
// ✅ 可访问的图标按钮
<button
  aria-label={paused ? '继续航行' : '暂停航行'}
  onClick={togglePause}
  className="p-2 rounded-full hover:bg-deep-500 transition"
>
  {paused ? <PlayIcon /> : <PauseIcon />}
</button>

// ❌ 不可访问
<div onClick={togglePause}>
  <Icon />  {/* 屏幕阅读器读不出任何东西 */}
</div>
```

---

## 8. 安全规范

- **绝不**在前端代码中硬编码任何密钥（API Key / Token / 数据库密码）
- **绝不** `JSON.parse(userInput)` 无防护地解析用户输入（会原型污染）
- 用户输入（搜索框、任务笔记）渲染时 React 会自动转义，**禁止使用 `dangerouslySetInnerHTML`**（除非白名单过滤）
- Dexie / IndexedDB 存储不加密（v1.0 范围），**禁止存储隐私敏感数据**（真实姓名、手机号、密码）
- 所有外链（`target="_blank"`）必须加 `rel="noopener noreferrer"`

---

## 9. 常见问题 (FAQ)

**Q: lint 报错 `Cannot find module '@/engine/...'` 怎么办？**
A: 运行 `pnpm install` 重新同步依赖，或重启 TS Server（VS Code Cmd+Shift+P → "TypeScript: Restart TS Server"）。

**Q: 新增 ADR 的流程？**
A: 复制 `docs/adr/adr-template.md` → 改名为 `NNNN-title.md` → 填写内容 → 在 `docs/adr/README.md` 中添加链接 → 提 PR 讨论。

**Q: 新增一个组件应该放哪里？**
A: 通用组件（可能多处复用）放 `src/components/Common/`；专属某模块的放 `src/components/StarMap/`、`src/components/VoyageView/` 等；页面级组合放 `src/pages/`。

**Q: 物理公式应该放哪里？**
A: 纯算法放 `src/engine/physics/`，写完配单元测试 ≥ 90% 覆盖率。UI 中不要出现公式，一律调用引擎 API。

**Q: 如何调试 WebGL Shader？**
A: 安装 Chrome 扩展 "WebGL Inspector" 或使用 Three.js 的 `ShaderMaterial.onBeforeCompile` + Spector.js。

**Q: 运行 E2E 测试提示浏览器未安装？**
A: 运行 `pnpm exec playwright install` 安装所有浏览器。

---

> 规范是工具，不是枷锁。当你确信某个约束不合理时，**先提 PR 修改本规范文档**，再按新规范执行。
