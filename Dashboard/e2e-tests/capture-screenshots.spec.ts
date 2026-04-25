import { test } from '@playwright/test';
import * as path from 'path';

const OUTPUT_DIR = '/tmp/dashboard-screenshots';

test('capture all dashboard screens', async ({ page }) => {
  // Design reference page
  console.log('Capturing design reference...');
  await page.goto('http://blackbox/design.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '0-design-reference.png'), fullPage: true });

  // Navigate to main dashboard
  await page.goto('http://blackbox/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  // 1. System tab (default)
  console.log('Capturing System tab...');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '1-system.png'), fullPage: true });

  // 2. Smart Home tab - nav buttons use `title` attribute (icon-only sidebar)
  console.log('Capturing Smart Home tab...');
  await page.locator('button[title="Smart Home"]').click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '2-smart-home.png'), fullPage: true });

  // 3. Calendar tab
  console.log('Capturing Calendar tab...');
  await page.locator('button[title="Calendar"]').click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '3-calendar.png'), fullPage: true });

  // 4. Planner tab
  console.log('Capturing Planner tab...');
  await page.locator('button[title="Planner"]').click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '4-planner.png'), fullPage: true });

  // 5. Vault tab (labeled "Vault" in nav, not "Editor")
  console.log('Capturing Vault tab...');
  await page.locator('button[title="Vault"]').click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '5-vault.png'), fullPage: true });

  // 6. AI Chat tab
  console.log('Capturing AI Chat tab...');
  await page.locator('button[title="AI Chat"]').click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '6-ai-chat.png'), fullPage: true });

  console.log('All screenshots saved to', OUTPUT_DIR);
}, { timeout: 60000 });
