import { expect, test } from '@playwright/test';

test.describe('星图视图 (S16 R3F)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'WebGL 无头渲染仅 chromium 可用');

  test('进入星图：WebGL canvas 渲染 + 星数显示 + 无报错', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', (error: Error) => errors.push(error.message));

    await page.goto('/');
    await expect(page.getByTestId('setup-panel')).toBeVisible();

    await page.getByRole('button', { name: '星图' }).click();
    await expect(page.getByTestId('starmap-view')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('500 颗恒星')).toBeVisible({ timeout: 20_000 });

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
});
