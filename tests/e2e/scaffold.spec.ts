import { test, expect } from '@playwright/test';

test.describe('Nova Scaffold 验证', () => {
  test('首页可见 NOVA 标题 + 脚手架验证卡片', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('h1')).toContainText('NOVA');
    await expect(page.locator('text=脚手架验证')).toBeVisible();
    await expect(page.locator('text=React 18 + TypeScript ● READY')).toBeVisible();
    await expect(page.locator('text=Vite 5 (原生 ESM) ● READY')).toBeVisible();
  });

  test('主题切换：4 个按钮都存在，点击后 data-theme 变化', async ({ page }) => {
    await page.goto('/');

    const themes = ['深空蓝紫', '赛博朋克', '复古胶片', '极简白昼'];
    for (const label of themes) {
      const btn = page.getByRole('button', { name: new RegExp(label) });
      await expect(btn).toBeVisible();
    }

    await page.getByRole('button', { name: /赛博朋克/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'cyberpunk');

    await page.getByRole('button', { name: /极简白昼/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'minimal-light');

    await page.getByRole('button', { name: /深空蓝紫/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'deep-space');
  });
});
