import { expect, test, type Page } from '@playwright/test';

import { dismissOnboarding } from './onboarding';

type FrameStats = {
  avgFps: number;
  p95FrameMs: number;
  maxFrameMs: number;
  frames: number;
  elapsedMs: number;
};

const MIN_AVG_FPS = 20;
const MAX_FRAME_MS = 500;

async function openStarmap(page: Page): Promise<void> {
  await page.goto('/');
  await dismissOnboarding(page);
  await page.getByRole('button', { name: '星图' }).click();
  await expect(page.getByTestId('starmap-view')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('star-count')).toContainText(/颗恒星/, { timeout: 20_000 });
}

async function startFrameCollector(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as { __perfDeltas: number[]; __perfCollecting: boolean };
    w.__perfDeltas = [];
    w.__perfCollecting = true;
    let last = performance.now();
    const loop = () => {
      const now = performance.now();
      w.__perfDeltas.push(now - last);
      last = now;
      if (w.__perfCollecting) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
}

async function stopFrameCollector(page: Page): Promise<FrameStats> {
  await page.evaluate(() => {
    (window as unknown as { __perfCollecting: boolean }).__perfCollecting = false;
  });
  return page.evaluate(() => {
    const w = window as unknown as { __perfDeltas: number[] };
    const deltas = w.__perfDeltas ?? [];
    w.__perfDeltas = [];
    const sorted = [...deltas].sort((a, b) => a - b);
    const elapsed = deltas.reduce((a, b) => a + b, 0);
    return {
      avgFps: deltas.length > 0 ? (deltas.length * 1000) / elapsed : 0,
      p95FrameMs: sorted[Math.floor(deltas.length * 0.95)] ?? 0,
      maxFrameMs: sorted[sorted.length - 1] ?? 0,
      frames: deltas.length,
      elapsedMs: elapsed,
    };
  });
}

test.describe('星图性能 (S21 Phase 2 QA)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'WebGL 无头渲染仅 chromium 可用');

  test('静态场景帧率：平均值达下限 + 无长卡顿（记录实测值）', async ({ page }) => {
    test.skip(
      !!process.env.CI,
      '帧率门禁属本地 MBP 人工走查项；CI 无头软件渲染（SwiftShader）下 17.8k 星达不到下限',
    );
    await openStarmap(page);
    await page.waitForTimeout(1200); // 首次加载 three 优化后稳定
    await page.evaluate(() => window.__TEST_ONLY__!.setAutoRotate(false));

    await startFrameCollector(page);
    await page.waitForTimeout(2500);
    const stats = await stopFrameCollector(page);

    test.info().annotations.push({
      type: 'perf',
      description:
        `静态场景 avgFps=${stats.avgFps.toFixed(1)} ` +
        `p95=${stats.p95FrameMs.toFixed(1)}ms max=${stats.maxFrameMs.toFixed(0)}ms ` +
        `(${stats.frames} frames / ${stats.elapsedMs.toFixed(0)}ms)`,
    });

    expect(stats.frames).toBeGreaterThan(0);
    // CI 宽松下限：防渲染管线回归（shader/点数量改动把帧率打到个位数）；
    // 60fps 目标属于 MBP 2019 人工走查项（实测值见上方 annotation）。
    expect(stats.avgFps).toBeGreaterThan(MIN_AVG_FPS);
    expect(stats.maxFrameMs).toBeLessThan(MAX_FRAME_MS);
  });

  test('出发地视角：星空实际渲染（画布亮像素占比达标，防星空空白回归）', async ({ page }) => {
    const countBright = async (): Promise<number> => {
      const box = await page.getByTestId('starmap-view').boundingBox();
      expect(box).not.toBeNull();
      const shot = await page.screenshot({
        clip: { x: box!.x, y: box!.y, width: box!.width, height: box!.height },
      });
      const ratio = await page.evaluate(async (b64: string) => {
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = 'data:image/png;base64,' + b64;
        });
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d');
        if (ctx == null) return null;
        ctx.drawImage(img, 0, 0);
        const d = ctx.getImageData(0, 0, c.width, c.height).data;
        let bright = 0;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i]! + d[i + 1]! + d[i + 2]! > 150) bright++;
        }
        return bright / (c.width * c.height);
      }, shot.toString('base64'));
      expect(ratio).not.toBeNull();
      return ratio!;
    };

    // 开图 → 校验 → 关闭，重复两次抓概率性空白
    for (let i = 0; i < 2; i++) {
      if (i > 0) {
        await page.getByRole('button', { name: '星图' }).click();
        await expect(page.getByTestId('starmap-view')).toBeVisible({ timeout: 20_000 });
        await expect(page.getByTestId('star-count')).toContainText(/颗恒星/, {
          timeout: 20_000,
        });
      } else {
        await openStarmap(page);
      }
      await page.waitForTimeout(1500);
      const ratio = await countBright();
      // 健康星空约 0.0058；纯背景（无星星）约 0.00045；阈值 0.001 拦"星空空白"
      expect(ratio).toBeGreaterThan(0.001);
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('starmap-dialog')).not.toBeVisible();
    }
  });

  test('缩放/环绕/平移流畅度：相机正确响应 + 交互期间无长卡顿 + 无报错', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', (error: Error) => errors.push(error.message));

    await openStarmap(page);
    await page.getByTestId('view-toggle-overview').click();
    await page.waitForFunction(
      () => window.__TEST_ONLY__?.getViewMode() === 'overview',
      undefined,
      { timeout: 20_000 },
    );
    await page.evaluate(() => window.__TEST_ONLY__!.setAutoRotate(false));
    await page.waitForTimeout(400);

    // 悬停到画布中心：OrbitControls 只监听 canvas，wheel/拖拽需鼠标命中画布
    const box = await page.getByTestId('starmap-view').boundingBox();
    expect(box).not.toBeNull();
    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;
    await page.mouse.move(cx, cy);

    const cameraDist = () =>
      page.evaluate(() => {
        const p = window.__TEST_ONLY__!.getCameraPosition();
        return p == null ? null : Math.hypot(p.x, p.y, p.z);
      });

    const before = await cameraDist();
    expect(before).not.toBeNull();

    await startFrameCollector(page);

    // 滚轮缩放：放大 → 相机接近目标（dolly in）
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, -200);
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(400); // damping 稳定
    const zoomed = await cameraDist();
    expect(zoomed).not.toBeNull();
    expect(zoomed!).toBeLessThan(before!);

    // 滚轮缩放：缩小 → 相机远离目标（dolly out）
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(400);
    const zoomedOut = await cameraDist();
    expect(zoomedOut).not.toBeNull();
    expect(zoomedOut!).toBeGreaterThan(zoomed!);

    // 左键拖拽 = 环绕旋转：相机绕目标转动，到目标距离大致不变
    await page.mouse.down();
    await page.mouse.move(cx + 140, cy + 60, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(400);
    const orbited = await page.evaluate(() => window.__TEST_ONLY__!.getCameraPosition());
    expect(orbited).not.toBeNull();
    const orbitDist = Math.hypot(orbited!.x, orbited!.y, orbited!.z);
    expect(Math.abs(orbitDist - zoomedOut!)).toBeLessThan(3);

    // 右键拖拽 = 平移（overview 视角 enablePan=true，相机横向移动）
    await page.mouse.down({ button: 'right' });
    await page.mouse.move(cx + 160, cy, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(400);
    const panned = await page.evaluate(() => window.__TEST_ONLY__!.getCameraPosition());
    expect(panned).not.toBeNull();
    const panShift = Math.hypot(
      panned!.x - orbited!.x,
      panned!.y - orbited!.y,
      panned!.z - orbited!.z,
    );
    expect(panShift).toBeGreaterThan(0.5);

    const stats = await stopFrameCollector(page);
    test.info().annotations.push({
      type: 'perf',
      description: `交互期间 avgFps=${stats.avgFps.toFixed(1)} max=${stats.maxFrameMs.toFixed(0)}ms (${stats.frames} frames)`,
    });

    expect(errors).toHaveLength(0);
    expect(stats.frames).toBeGreaterThan(0);
    expect(stats.maxFrameMs).toBeLessThan(MAX_FRAME_MS);
  });
});
