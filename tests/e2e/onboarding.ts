import type { Page } from '@playwright/test';

/**
 * 关闭首次启动引导弹窗（若出现）。e2e 用全新浏览器上下文（IndexedDB 为空），
 * 首次加载 hasCompletedOnboarding=false 会弹出引导，遮挡主视图交互；
 * 既有测试在导航后调用本 helper 跳过引导。
 *
 * 必须先等引导「出现」再关闭：settings 是异步 hydrate，用 isVisible() 即时
 * 检查会在引导弹出前就返回 false，随后引导遮挡点击目标导致超时。
 */
export async function dismissOnboarding(page: Page): Promise<void> {
  const dialog = page.getByTestId('onboarding-dialog');
  try {
    await dialog.waitFor({ state: 'visible', timeout: 10_000 });
  } catch {
    return; // 引导未弹出（已完成过），直接继续
  }
  await dialog.getByRole('button', { name: '跳过' }).click();
  await dialog.waitFor({ state: 'hidden' });
}
