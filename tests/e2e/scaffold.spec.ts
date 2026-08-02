import { expect, test } from '@playwright/test';

test.describe('Nova S12 UI 验证', () => {
  test('首页可见 NOVA 标题 + 设置面板', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('h1')).toContainText('NOVA');
    await expect(page.getByTestId('setup-panel')).toBeVisible();
    await expect(page.getByRole('button', { name: '启动航行' })).toBeVisible();
  });

  test('主题切换：4 个按钮可点，data-theme 正确变化', async ({ page }) => {
    await page.goto('/');

    const themes = ['深空', '赛博朋克', '复古', '极简白'];
    for (const label of themes) {
      await expect(page.getByRole('button', { name: label })).toBeVisible();
    }

    await page.getByRole('button', { name: '赛博朋克' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'cyberpunk');

    await page.getByRole('button', { name: '极简白' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'minimal-light');

    await page.getByRole('button', { name: '深空' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'deep-space');
  });

  test('点击启动航行 → 进入航行视图', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: '启动航行' }).click();
    await expect(page.getByTestId('voyage-view')).toBeVisible();
    await expect(page.getByText('剩余专注时间')).toBeVisible();
  });
});
