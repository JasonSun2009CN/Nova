import { expect, test, type Page } from '@playwright/test';

async function completeVoyageToProxima(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByTestId('setup-panel')).toBeVisible();

  await page.getByLabel('自定义专注时长（分钟）').fill('25');
  await page.getByLabel('目的地').selectOption('hip-70890');
  await page.getByRole('button', { name: '启动航行' }).click();
  await expect(page.getByTestId('voyage-view')).toBeVisible();

  await page.evaluate(() => {
    const hooks = window.__TEST_ONLY__;
    if (hooks == null) throw new Error('__TEST_ONLY__ hooks 未安装');
    hooks.fastForward(25 * 60_000 + 5_000);
  });
  await expect(page.getByTestId('result-view')).toBeVisible();
}

test.describe('成就系统 (S32)', () => {
  test('首次航行到比邻星 → 结果页新成就揭示 + 成就墙解锁', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', (error: Error) => errors.push(error.message));

    await completeVoyageToProxima(page);

    const reveal = page.getByTestId('new-achievements');
    await expect(reveal).toBeVisible();
    await expect(reveal.getByText('初次启航')).toBeVisible();
    await expect(reveal.getByText('红矮星访客')).toBeVisible();
    await expect(reveal.getByText('半人马座征服者')).toBeVisible();

    await page.getByRole('button', { name: '回到首页' }).click();
    await expect(page.getByTestId('history-panel')).toBeVisible();

    await page.getByRole('button', { name: '成就', exact: true }).click();
    const dialog = page.getByTestId('achievement-dialog');
    await expect(dialog).toBeVisible();

    await expect(dialog.getByTestId('achievement-points')).toContainText(/100/);
    await expect(dialog.getByTestId('achievement-unlocked-count')).toContainText(/6/);
    await expect(
      dialog.getByTestId('achievement-first-voyage').getAttribute('data-unlocked'),
    ).resolves.toBe('true');
    await expect(
      dialog.getByTestId('achievement-visit-m-star').getAttribute('data-unlocked'),
    ).resolves.toBe('true');
    await expect(
      dialog.getByTestId('achievement-sirius').getAttribute('data-unlocked'),
    ).resolves.toBe('false');

    expect(errors).toHaveLength(0);
  });

  test('顶栏空闲态可直接打开成就墙，锁定项齐全', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('setup-panel')).toBeVisible();

    await page.getByRole('button', { name: '成就', exact: true }).click();
    const dialog = page.getByTestId('achievement-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByTestId('achievement-unlocked-count')).toContainText(/0/);
    await expect(
      dialog.getByTestId('achievement-sirius').getAttribute('data-unlocked'),
    ).resolves.toBe('false');
    await expect(
      dialog.getByTestId('achievement-distance-1000').getAttribute('data-unlocked'),
    ).resolves.toBe('false');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});
