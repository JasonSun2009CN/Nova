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

  test('弹窗点星 → 确认 → 设为目的地 → 完成关闭 → 设置页预选', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '星图' }).click();
    await expect(page.getByTestId('starmap-dialog')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('starmap-view')).toBeVisible();

    await page.waitForFunction(
      () => window.__TEST_ONLY__?.getStarScreenPosition('hip-102098') != null,
      undefined,
      { timeout: 20_000 },
    );

    await page.evaluate(() => window.__TEST_ONLY__!.setAutoRotate(false));
    await page.waitForTimeout(100);

    const pos = await page.evaluate(() =>
      window.__TEST_ONLY__!.getStarScreenPosition('hip-102098'),
    );
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
    await expect(page.getByLabel('目的地')).toHaveValue('hip-102098');
  });
});
