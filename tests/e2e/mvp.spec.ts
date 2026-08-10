import { expect, test } from '@playwright/test';

import { dismissOnboarding } from './onboarding';

test.describe('MVP 关键旅程', () => {
  test('pomodoro 1min 跑通：启动 → 完成 → 结果页', async ({ page }) => {
    await page.goto('/');
    await dismissOnboarding(page);
    await expect(page.getByTestId('setup-panel')).toBeVisible();

    await page.getByLabel('自定义专注时长（分钟）').fill('1');
    await page.getByRole('button', { name: '启动航行' }).click();
    await expect(page.getByTestId('voyage-view')).toBeVisible();
    await expect(page.getByText('剩余专注时间')).toBeVisible();

    await page.evaluate(() => {
      const hooks = window.__TEST_ONLY__;
      if (hooks == null) {
        throw new Error('__TEST_ONLY__ hooks 未安装');
      }
      hooks.fastForward(60_000 + 5_000);
    });

    await expect(page.getByTestId('result-view')).toBeVisible();
    await expect(page.getByText('本次航行完成')).toBeVisible();
  });

  test('刷新后 history 仍在', async ({ page }) => {
    await page.goto('/');
    await dismissOnboarding(page);
    await expect(page.getByTestId('setup-panel')).toBeVisible();

    await page.getByLabel('自定义专注时长（分钟）').fill('1');
    await page.getByRole('button', { name: '启动航行' }).click();
    await expect(page.getByTestId('voyage-view')).toBeVisible();

    await page.evaluate(() => {
      const hooks = window.__TEST_ONLY__;
      if (hooks == null) {
        throw new Error('__TEST_ONLY__ hooks 未安装');
      }
      hooks.fastForward(60_000 + 5_000);
    });
    await expect(page.getByText('本次航行完成')).toBeVisible();

    await page.getByRole('button', { name: '回到首页' }).click();
    await expect(page.getByTestId('history-panel')).toBeVisible();
    await expect(
      page.getByTestId('history-panel').getByText('完成', { exact: true }),
    ).toBeVisible();

    await page.reload();
    await expect(page.getByTestId('setup-panel')).toBeVisible();
    await expect(page.getByTestId('history-panel')).toBeVisible();
    await expect(
      page.getByTestId('history-panel').getByText('完成', { exact: true }),
    ).toBeVisible();
  });
});
