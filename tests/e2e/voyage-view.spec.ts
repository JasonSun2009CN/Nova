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
});
