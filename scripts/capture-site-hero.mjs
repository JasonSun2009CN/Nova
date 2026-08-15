import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto('http://127.0.0.1:5173/');

const dialog = page.getByTestId('onboarding-dialog');
try {
  await dialog.waitFor({ state: 'visible', timeout: 10_000 });
  await dialog.getByRole('button', { name: '跳过' }).click();
  await dialog.waitFor({ state: 'hidden' });
} catch {
  // 引导未出现，继续
}

await page.getByTestId('setup-panel').waitFor({ state: 'visible', timeout: 20_000 });
await page.waitForTimeout(9_000);

await page.screenshot({ path: 'website/assets/app-hero.png' });
await browser.close();
console.log('captured website/assets/app-hero.png');
