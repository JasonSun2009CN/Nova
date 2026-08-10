import { expect, test } from '@playwright/test';

test.describe('首次启动引导教程', () => {
  test('首次加载自动弹出引导，逐页滑到「开始航行」，刷新后不再弹出', async ({ page }) => {
    await page.goto('/');
    const dialog = page.getByTestId('onboarding-dialog');
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    await expect(dialog.getByTestId('onboarding-dots').getByRole('button')).toHaveCount(4);

    await expect(dialog.getByRole('heading', { name: '专注，就是星际旅行' })).toBeVisible();
    await dialog.getByTestId('onboarding-next').click();
    await expect(dialog.getByRole('heading', { name: '选目的地，或设时间' })).toBeVisible();
    await dialog.getByTestId('onboarding-next').click();
    await expect(dialog.getByRole('heading', { name: '时间膨胀效应' })).toBeVisible();
    await dialog.getByTestId('onboarding-next').click();
    await expect(dialog.getByRole('heading', { name: '启程' })).toBeVisible();

    await dialog.getByTestId('onboarding-start').click();
    await expect(dialog).not.toBeVisible();

    await page.reload();
    await expect(page.getByTestId('setup-panel')).toBeVisible();
    await expect(page.getByTestId('onboarding-dialog')).not.toBeVisible();
  });

  test('跳过按钮立即关闭，且完成状态持久化不重复弹出', async ({ page }) => {
    await page.goto('/');
    const dialog = page.getByTestId('onboarding-dialog');
    await expect(dialog).toBeVisible({ timeout: 15_000 });

    await dialog.getByRole('button', { name: '跳过' }).click();
    await expect(dialog).not.toBeVisible();

    await page.reload();
    await expect(page.getByTestId('setup-panel')).toBeVisible();
    await expect(page.getByTestId('onboarding-dialog')).not.toBeVisible();
  });
});
