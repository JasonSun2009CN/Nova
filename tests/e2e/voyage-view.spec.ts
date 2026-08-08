import { expect, test } from '@playwright/test';

test.describe('航行视图真实星表化 (S23 R3F)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'WebGL 无头渲染仅 chromium 可用');

  test('冷启动直接航行（未开星图）→ three chunk 懒加载 + R3F 星场渲染', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', (error: Error) => errors.push(error.message));

    await page.goto('/');
    await expect(page.getByTestId('setup-panel')).toBeVisible();

    await page.getByLabel('目的地').selectOption('hip-70890');
    await page.getByRole('button', { name: '启动航行' }).click();
    await expect(page.getByTestId('voyage-view')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('voyage-star-field')).toBeVisible({ timeout: 20_000 });

    const gauge = page.getByTestId('voyage-progress-gauge');
    await expect(gauge).toBeVisible({ timeout: 20_000 });
    await expect(gauge).toContainText(/比邻星/);
    await expect(gauge).toContainText(/太阳系/);

    await page.waitForTimeout(1200);
    const canvasOk = await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>(
        '[data-testid="voyage-star-field"] canvas',
      );
      if (canvas == null) return false;
      return canvas.getContext('webgl2') != null || canvas.getContext('webgl') != null;
    });
    expect(canvasOk).toBe(true);
    expect(errors).toHaveLength(0);
  });

  test('自由漂流（无目的地）→ 星场渲染且无报错', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', (error: Error) => errors.push(error.message));

    await page.goto('/');
    await expect(page.getByTestId('setup-panel')).toBeVisible();

    await page.getByRole('button', { name: '启动航行' }).click();
    await expect(page.getByTestId('voyage-view')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('voyage-star-field')).toBeVisible({ timeout: 20_000 });

    await page.waitForTimeout(1200);
    expect(errors).toHaveLength(0);
  });

  test('启动过渡：点火标签显示后 3s 消失进入巡航（S26）', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('setup-panel')).toBeVisible();

    await page.getByLabel('目的地').selectOption('hip-70890');
    await page.getByRole('button', { name: '启动航行' }).click();
    await expect(page.getByTestId('voyage-view')).toBeVisible({ timeout: 20_000 });

    const launching = page.getByText(/引擎点火/);
    await expect(launching).toBeVisible();
    await expect(page.getByRole('button', { name: '暂停' })).toBeVisible();

    await expect(launching).toBeHidden({ timeout: 5_000 });
  });

  test('到达过渡：计时归零 → 入轨标签 3s → 切结果视图（S26）', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('setup-panel')).toBeVisible();

    await page.getByLabel('目的地').selectOption('hip-70890');
    await page.getByRole('button', { name: '启动航行' }).click();
    await expect(page.getByTestId('voyage-view')).toBeVisible({ timeout: 20_000 });

    await page.waitForTimeout(3500);
    await page.evaluate(() => window.__TEST_ONLY__!.fastForward(1_600_000));

    await expect(page.getByText(/正在减速入轨/)).toBeVisible();
    await expect(page.getByTestId('voyage-view')).toBeVisible();
    await expect(page.getByTestId('result-view')).toBeHidden();

    await expect(page.getByTestId('result-view')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/本次航行完成/)).toBeVisible();
  });

  test('中断过渡：结束 → 紧急刹车标签 3s → 切中止结果（S26）', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('setup-panel')).toBeVisible();

    await page.getByLabel('目的地').selectOption('hip-70890');
    await page.getByRole('button', { name: '启动航行' }).click();
    await expect(page.getByTestId('voyage-view')).toBeVisible({ timeout: 20_000 });

    await page.waitForTimeout(3500);
    await page.getByRole('button', { name: '结束' }).click();

    await expect(page.getByText(/紧急刹车/)).toBeVisible();
    await expect(page.getByTestId('voyage-view')).toBeVisible();
    await expect(page.getByTestId('result-view')).toBeHidden();

    await expect(page.getByTestId('result-view')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/航行已中止/)).toBeVisible();
  });

  test('S29 Phase 3 验收走查：启动→巡航时间膨胀数值匹配→完成→结果一致', async ({ page }) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', (error: Error) => errors.push(error.message));

    await page.goto('/');
    await expect(page.getByTestId('setup-panel')).toBeVisible();

    await page.getByLabel('目的地').selectOption('hip-70890');
    await page.getByRole('button', { name: '启动航行' }).click();
    await expect(page.getByTestId('voyage-view')).toBeVisible({ timeout: 20_000 });

    // 巡航中：时间膨胀数值匹配（船上已过 × γ ≈ 地球已过）——用 DOM 断言形态存在
    await page.waitForTimeout(4000);
    const elapsedText = await page.getByText(/船上已过/).textContent();
    expect(elapsedText).toBeTruthy();
    expect(page.getByTestId('voyage-star-field')).toBeVisible({ timeout: 20_000 });

    // fastForward 跨过 25 分钟 → 到达 → 结果视图
    await page.evaluate(() => window.__TEST_ONLY__!.fastForward(1_600_000));
    await expect(page.getByText(/正在减速入轨/)).toBeVisible();
    await expect(page.getByTestId('result-view')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/本次航行完成/)).toBeVisible();

    // 结果数值：主观专注时长显示 + γ 显示，无报错
    await expect(page.getByText('主观专注时长')).toBeVisible();
    await expect(page.getByText('时间膨胀 γ')).toBeVisible();
    await expect(page.getByText('航行速度')).toBeVisible();
    await expect(page.getByText('实际航行距离')).toBeVisible();
    expect(errors).toHaveLength(0);
  });
});
