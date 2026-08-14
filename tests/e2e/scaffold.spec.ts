import { expect, test } from '@playwright/test';

import { dismissOnboarding } from './onboarding';

test.describe('Nova S12 UI 验证', () => {
  test('首页可见 NOVA 标题 + 设置面板', async ({ page }) => {
    await page.goto('/');
    await dismissOnboarding(page);

    await expect(page.locator('h1')).toContainText('NOVA');
    await expect(page.getByTestId('setup-panel')).toBeVisible();
    await expect(page.getByRole('button', { name: '启动航行' })).toBeVisible();
  });

  test('单一 neutral 主题：data-theme=neutral，无主题切换按钮', async ({ page }) => {
    await page.goto('/');
    await dismissOnboarding(page);

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'neutral');
    await expect(page.getByRole('button', { name: '深空' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: '星图' })).toBeVisible();
  });

  test('点击启动航行 → 进入航行视图', async ({ page }) => {
    await page.goto('/');
    await dismissOnboarding(page);

    await page.getByLabel('目的地').selectOption('hip-70890');
    await page.getByRole('button', { name: '启动航行' }).click();
    await expect(page.getByTestId('voyage-view')).toBeVisible();
    await expect(page.getByText('剩余专注时间')).toBeVisible();
  });
});
