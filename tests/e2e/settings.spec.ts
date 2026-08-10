import { expect, test } from '@playwright/test';

import { dismissOnboarding } from './onboarding';

test.describe('S33 个性化设置', () => {
  test('快捷预设：点击 45 → 当前时长变 45 且刷新后保持默认', async ({ page }) => {
    await page.goto('/');
    await dismissOnboarding(page);
    await expect(page.getByTestId('setup-panel')).toBeVisible();

    await page.getByRole('button', { name: '45', exact: true }).click();
    await expect(page.getByLabel('自定义专注时长（分钟）')).toHaveValue('45');

    await page.waitForTimeout(300);
    await page.reload();
    await expect(page.getByTestId('setup-panel')).toBeVisible();
    await expect(page.getByLabel('自定义专注时长（分钟）')).toHaveValue('45');
  });
});
