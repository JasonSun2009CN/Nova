import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, locale: 'zh-CN' });
await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: '星图' }).click();
await page.getByTestId('starmap-view').waitFor({ timeout: 20000 });
await page.waitForTimeout(2000);

const dims = await page.evaluate(() => {
  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return { h: Math.round(r.height), w: Math.round(r.width), top: Math.round(r.top) };
  };
  const sec = document.querySelector('[data-testid="starmap-view"]');
  const wrapper = sec?.firstElementChild;
  const canvas = sec?.querySelector('canvas');
  return {
    section: sec ? rect(sec) : null,
    wrapper: wrapper ? rect(wrapper) : null,
    wrapperStyle: wrapper ? getComputedStyle(wrapper).cssText.slice(0, 400) : null,
    canvas: canvas ? rect(canvas) : null,
    children: sec ? [...sec.children].map((c) => c.tagName + ':' + c.className) : null,
  };
});
console.log(JSON.stringify(dims, null, 2));
await browser.close();
