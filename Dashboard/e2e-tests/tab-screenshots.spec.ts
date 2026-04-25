import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const OUTPUT_DIR = '/tmp/dashboard-screenshots';

test('capture Smart Home and Calendar tabs', async ({ page }) => {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Set viewport to 1280x720
  await page.setViewportSize({ width: 1280, height: 720 });

  // Navigate to the dashboard
  await page.goto('http://blackbox/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // --- Smart Home tab ---
  console.log('Clicking Smart Home tab...');
  await page.locator('button[title="Smart Home"]').click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '2b-smart-home.png'), fullPage: false });
  console.log('Smart Home screenshot saved to', path.join(OUTPUT_DIR, '2b-smart-home.png'));

  // --- Calendar tab ---
  console.log('Clicking Calendar tab...');
  await page.locator('button[title="Calendar"]').click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '3b-calendar.png'), fullPage: false });
  console.log('Calendar screenshot saved to', path.join(OUTPUT_DIR, '3b-calendar.png'));

  // Count "+ New Event" buttons visible on the page
  const newEventButtons = page.locator('button:has-text("New Event")');
  const newEventCount = await newEventButtons.count();
  console.log(`\n=== "+ New Event" button count: ${newEventCount} ===`);
  for (let i = 0; i < newEventCount; i++) {
    const txt = await newEventButtons.nth(i).textContent();
    const isVisible = await newEventButtons.nth(i).isVisible();
    console.log(`  Button[${i}]: text="${txt?.trim()}" visible=${isVisible}`);
  }

  // Also check for any variant spellings
  const plusNewEvent = page.locator('button:has-text("+ New Event")');
  const plusCount = await plusNewEvent.count();
  console.log(`"+ New Event" exact match count: ${plusCount}`);

  console.log('\nAll done.');
});
