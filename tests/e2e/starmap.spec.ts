import { expect, test } from '@playwright/test';

import { dismissOnboarding } from './onboarding';

test.describe('星图视图 (S16 R3F)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'WebGL 无头渲染仅 chromium 可用');

  test('进入星图：WebGL canvas 渲染 + 星数显示 + 无报错', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', (error: Error) => errors.push(error.message));

    await page.goto('/');
    await dismissOnboarding(page);
    await expect(page.getByTestId('setup-panel')).toBeVisible();

    await page.getByRole('button', { name: '星图' }).click();
    await expect(page.getByTestId('starmap-view')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('star-count')).toContainText(/颗恒星/, { timeout: 20_000 });

    await page.waitForTimeout(1200);
    const canvasOk = await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>(
        '[data-testid="starmap-view"] canvas',
      );
      if (canvas == null) return false;
      return canvas.getContext('webgl2') != null || canvas.getContext('webgl') != null;
    });
    expect(canvasOk).toBe(true);
    expect(errors).toHaveLength(0);

    await page.getByTestId('starmap-view').hover();
    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(400);
    expect(errors).toHaveLength(0);
  });

  test('弹窗点星 → 确认 → 设为目的地 → 完成关闭 → 设置页预选', async ({ page }) => {
    await page.goto('/');
    await dismissOnboarding(page);
    await page.getByRole('button', { name: '星图' }).click();
    await expect(page.getByTestId('starmap-dialog')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('starmap-view')).toBeVisible();

    // 默认是出发地视角，切到全览视角再点星（织女星需在画面内）
    await page.getByTestId('view-toggle-overview').click();
    await page.waitForFunction(
      () => window.__TEST_ONLY__?.getViewMode() === 'overview',
      undefined,
      { timeout: 20_000 },
    );

    await page.waitForFunction(
      () => window.__TEST_ONLY__?.getStarScreenPosition('hip-91262') != null,
      undefined,
      { timeout: 20_000 },
    );

    await page.evaluate(() => window.__TEST_ONLY__!.setAutoRotate(false));
    await page.waitForTimeout(100);

    const pos = await page.evaluate(() => window.__TEST_ONLY__!.getStarScreenPosition('hip-91262'));
    expect(pos).not.toBeNull();

    await page.mouse.click(pos!.clientX, pos!.clientY);
    await expect(page.getByTestId('star-info-card')).toBeVisible();
    await expect(page.getByTestId('star-info-card').getByText(/织女/)).toBeVisible();

    await page.getByRole('button', { name: '取消' }).click();
    await expect(page.getByTestId('star-info-card')).not.toBeVisible();

    await page.mouse.click(pos!.clientX, pos!.clientY);
    await expect(page.getByTestId('star-info-card')).toBeVisible();

    await page.getByRole('button', { name: '设为目的地' }).click();
    await expect(page.getByText('已设为目的地')).toBeVisible();

    await page.getByRole('button', { name: '完成' }).click();
    await expect(page.getByTestId('starmap-dialog')).not.toBeVisible();
    await expect(page.getByTestId('setup-panel')).toBeVisible();
    await expect(page.getByLabel('目的地')).toHaveValue('hip-91262');
  });

  test('星图搜索：输入中文名 → 下拉 → 点结果弹出信息卡', async ({ page }) => {
    await page.goto('/');
    await dismissOnboarding(page);
    await page.getByRole('button', { name: '星图' }).click();
    await expect(page.getByTestId('starmap-view')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('star-search')).toBeVisible();
    await expect(page.getByTestId('star-count')).toContainText(/颗恒星/, { timeout: 20_000 });

    await page.getByLabel('搜索恒星').fill('织女');
    await expect(page.getByTestId('star-search-results')).toBeVisible();
    const firstResult = page.getByTestId('star-search-result').first();
    await expect(firstResult).toContainText(/织女/);

    await firstResult.click();
    await expect(page.getByTestId('star-info-card')).toBeVisible();
    await expect(page.getByTestId('star-info-card').getByText(/织女/)).toBeVisible();
  });

  test('双视角切换：出发地视角 ↔ 全览视角（相机定位 + 半径圈 + 无报错）', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', (error: Error) => errors.push(error.message));

    await page.goto('/');
    await dismissOnboarding(page);
    await page.getByRole('button', { name: '星图' }).click();
    await expect(page.getByTestId('starmap-view')).toBeVisible({ timeout: 20_000 });
    await page.waitForFunction(() => window.__TEST_ONLY__?.getViewMode() != null, undefined, {
      timeout: 20_000,
    });

    // 默认出发地视角：相机站在太阳近旁，无半径圈，显示「所在星：太阳」
    expect(await page.evaluate(() => window.__TEST_ONLY__!.getViewMode())).toBe('from-departure');
    await page.waitForFunction(() => {
      const p = window.__TEST_ONLY__?.getCameraPosition();
      return p != null && Math.hypot(p.x, p.y - 0.5, p.z - 1.1) < 0.5;
    });
    await expect(page.getByTestId('view-toggle-from-departure')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByText(/所在星：太阳/)).toBeVisible();
    await expect(page.getByText(/半径圈/)).not.toBeVisible();

    // 切到全览视角：相机拉远到太阳系上方，太阳居中，显示半径圈
    await page.getByTestId('view-toggle-overview').click();
    await page.waitForFunction(
      () => window.__TEST_ONLY__?.getViewMode() === 'overview',
      undefined,
      { timeout: 20_000 },
    );
    await page.evaluate(() => window.__TEST_ONLY__!.setAutoRotate(false));
    await page.waitForFunction(() => {
      const p = window.__TEST_ONLY__?.getCameraPosition();
      return p != null && Math.hypot(p.x, p.y - 20, p.z - 80) < 1.5;
    });
    await expect(page.getByTestId('view-toggle-overview')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText(/当前位置：太阳/)).toBeVisible();
    await expect(page.getByText(/半径圈 10 \/ 25 \/ 50 光年/)).toBeVisible();

    // 切回出发地视角
    await page.getByTestId('view-toggle-from-departure').click();
    await page.waitForFunction(
      () => window.__TEST_ONLY__?.getViewMode() === 'from-departure',
      undefined,
      { timeout: 20_000 },
    );
    await page.waitForFunction(() => {
      const p = window.__TEST_ONLY__?.getCameraPosition();
      return p != null && Math.hypot(p.x, p.y - 0.5, p.z - 1.1) < 0.5;
    });
    await expect(page.getByText(/所在星：太阳/)).toBeVisible();
    await expect(page.getByText(/半径圈/)).not.toBeVisible();

    expect(errors).toHaveLength(0);
  });

  test('Phase 2 验收走查：搜索半人马座α → 信息卡 → 设目的地 → 启动航行 → 航行视图', async ({
    page,
  }) => {
    await page.goto('/');
    await dismissOnboarding(page);
    await page.getByRole('button', { name: '星图' }).click();
    await expect(page.getByTestId('starmap-view')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('star-search')).toBeVisible();

    // 按名称搜索半人马座 α（真实星表中文名命中）
    await page.getByLabel('搜索恒星').fill('半人马');
    await expect(page.getByTestId('star-search-results')).toBeVisible();
    const firstResult = page.getByTestId('star-search-result').first();
    await expect(firstResult).toContainText(/半人马/);
    await firstResult.click();

    // 信息卡 → 设为目的地
    await expect(page.getByTestId('star-info-card')).toBeVisible();
    await page.getByRole('button', { name: '设为目的地' }).click();
    await expect(page.getByText('已设为目的地')).toBeVisible();
    await page.getByRole('button', { name: '完成' }).click();
    await expect(page.getByTestId('starmap-dialog')).not.toBeVisible();

    // 设置页预选目的地
    await expect(page.getByTestId('setup-panel')).toBeVisible();
    const destValue = await page.getByLabel('目的地').inputValue();
    expect(destValue.length).toBeGreaterThan(0);

    // 填 25 分钟（常规引擎 γ_max=10 万下最短专注约 23 分钟，25 分钟可达）→ 启动航行
    await page.getByLabel('自定义专注时长（分钟）').fill('25');
    await page.getByRole('button', { name: '启动航行' }).click();
    await expect(page.getByTestId('voyage-view')).toBeVisible({ timeout: 20_000 });

    // 航行视图显示真实目的地名 + R3F 星场（S23 真实星表化）
    await expect(page.getByTestId('voyage-view').getByText(/半人马/)).toBeVisible();
    await expect(page.getByTestId('voyage-star-field')).toBeVisible({ timeout: 20_000 });
  });
});
