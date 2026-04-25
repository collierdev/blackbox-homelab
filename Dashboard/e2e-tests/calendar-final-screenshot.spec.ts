import { test } from '@playwright/test';

test('calendar final screenshot', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('http://blackbox/', { waitUntil: 'networkidle', timeout: 30000 });

  // Click the Calendar nav icon (third icon in left sidebar)
  await page.locator('button[title="Calendar"]').click();

  // Wait 2 seconds for content to load
  await page.waitForTimeout(2000);

  await page.screenshot({ path: '/tmp/calendar-final.png', fullPage: false });
  console.log('Screenshot saved to /tmp/calendar-final.png');
});
