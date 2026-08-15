import { expect, test } from '@playwright/test';

import { dismissOnboarding } from './onboarding';

test.describe('更新提示', () => {
  test('发现新版本时显示横幅，可跳过此版本', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('nova:update-check', '1'));
    await page.route('**/latest.json', (route) =>
      route.fulfill({ json: { version: '9.9.9', siteUrl: 'https://example.com/nova' } }),
    );
    await page.goto('/');
    await dismissOnboarding(page);

    const notice = page.getByTestId('update-notice');
    await expect(notice).toBeVisible({ timeout: 15_000 });
    await expect(notice).toContainText('9.9.9');

    await notice.getByRole('button', { name: '跳过此版本' }).click();
    await expect(notice).toBeHidden();
  });

  test('当前已是最新版时不显示横幅', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('nova:update-check', '1'));
    await page.route('**/latest.json', (route) =>
      route.fulfill({ json: { version: '0.0.0', siteUrl: 'https://example.com/nova' } }),
    );
    await page.goto('/');
    await dismissOnboarding(page);

    await expect(page.getByTestId('update-notice')).toBeHidden();
  });
});
