import { test, expect } from '@playwright/test';

test.describe('System Dashboard', () => {
  test('shows System Overview and CPU stats', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=System Overview')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=CPU').first()).toBeVisible({ timeout: 8000 });
  });

  test('Services section is visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Services').first()).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Day Planner Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Day Planner")');
    await page.waitForTimeout(800);
  });

  test('shows live clock', async ({ page }) => {
    const clock = page.locator('.tabular-nums').first();
    await expect(clock).toBeVisible({ timeout: 5000 });
    const text = await clock.textContent();
    expect(text).toMatch(/\d{1,2}:\d{2}/);
  });

  test('shows Daily Routines section', async ({ page }) => {
    await expect(page.locator('text=Daily Routines')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Morning').first()).toBeVisible();
  });

  test("shows Today's Schedule section", async ({ page }) => {
    await expect(page.locator("text=Today's Schedule")).toBeVisible({ timeout: 5000 });
  });

  test('shows Tasks section', async ({ page }) => {
    await expect(page.locator('text=Tasks').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Vault Editor Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Vault")');
    await page.waitForTimeout(800);
  });

  test('shows file browser with bookmarks', async ({ page }) => {
    await expect(page.locator('text=Bookmarks')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Dashboard")')).toBeVisible();
    await expect(page.locator('button:has-text("Shared")')).toBeVisible();
  });

  test('can navigate to blackbox/shared bookmark', async ({ page }) => {
    await page.click('button:has-text("Shared")');
    await page.waitForTimeout(800);
    // Either files appear or "Empty directory" — either way the browse succeeded
    const result = page.locator('text=Empty directory').or(
      page.locator('.text-yellow-400, [class*="text-blue-400"]').first()
    );
    await expect(result).toBeVisible({ timeout: 5000 });
  });

  test('AI Assistant panel is visible by default', async ({ page }) => {
    await expect(page.locator('text=AI Assistant')).toBeVisible({ timeout: 5000 });
  });

  test('AI panel can be toggled off and on', async ({ page }) => {
    // The vault AI toggle button has "AI" text and lives in the editor toolbar (not the tab nav)
    // Use the one with purple bg (active) or slate bg styling inside the editor area
    const aiToggle = page.locator('main button:has-text("AI"), .flex-col button:has-text("AI")').last();
    await aiToggle.click();
    await expect(page.locator('text=AI Assistant')).not.toBeVisible({ timeout: 3000 });
    await aiToggle.click();
    await expect(page.locator('text=AI Assistant')).toBeVisible({ timeout: 3000 });
  });

  test('Home bookmark navigates to /home/jwcollie', async ({ page }) => {
    // Navigate away first
    await page.click('button:has-text("Shared")');
    await page.waitForTimeout(600);
    // Navigate back to Home — /home/jwcollie has a "Dashboard" folder
    await page.click('button:has-text("Home")');
    await page.waitForTimeout(800);
    // The Dashboard directory should appear in the file list
    await expect(page.locator('text=Dashboard').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('ChatBot Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("AI Chat")');
    await page.waitForTimeout(500);
  });

  test('shows message textarea', async ({ page }) => {
    await expect(page.locator('textarea[placeholder="Type a message..."]')).toBeVisible({ timeout: 5000 });
  });

  test('shows provider settings when settings button clicked', async ({ page }) => {
    // Settings button is in the ChatBot header — it has the Settings (gear) icon with hover:bg-white/20
    await page.click('button.hover\\:bg-white\\/20');
    await expect(page.locator('select').first()).toBeVisible({ timeout: 3000 });
    await expect(page.locator('option[value="ollama"]')).toHaveCount(1);
    await expect(page.locator('option[value="claude"]')).toHaveCount(1);
  });

  test('streams Ollama response with visible tokens', async ({ page }) => {
    test.setTimeout(95_000);

    const textarea = page.locator('textarea[placeholder="Type a message..."]');
    await textarea.fill('Say exactly: hello');
    await page.keyboard.press('Enter');

    // Loading spinner should appear quickly (loading state set before fetch)
    await expect(page.locator('.animate-spin').first()).toBeVisible({ timeout: 5000 });

    // Spinner disappears when streaming completes
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 90_000 });

    // Assistant message renders via ReactMarkdown inside div.prose — check it has content
    const assistantContent = page.locator('div.prose').last();
    await expect(assistantContent).toBeVisible({ timeout: 5000 });
    const text = await assistantContent.textContent();
    expect(text!.trim().length).toBeGreaterThan(0);
  });
});

test.describe('Display Page', () => {
  test('renders at /#display without tab navigation', async ({ page }) => {
    await page.goto('/#display');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    // Tab navigation must NOT be present
    await expect(page.locator('text=AI Chat')).not.toBeVisible();
    await expect(page.locator('text=Smart Home')).not.toBeVisible();
    await expect(page.locator('text=System')).not.toBeVisible();
  });

  test('shows large clock with time pattern', async ({ page }) => {
    await page.goto('/#display');
    await page.waitForTimeout(800);

    const clock = page.locator('.tabular-nums').first();
    await expect(clock).toBeVisible({ timeout: 5000 });
    const text = await clock.textContent();
    expect(text).toMatch(/\d{1,2}:\d{2}/);
  });

  test('shows current day of week in date string', async ({ page }) => {
    await page.goto('/#display');
    await page.waitForTimeout(800);

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    await expect(page.locator(`text=${today}`)).toBeVisible({ timeout: 5000 });
  });

  test('shows Schedule and Tasks column headers', async ({ page }) => {
    await page.goto('/#display');
    await page.waitForTimeout(3000); // allow planner data fetch

    await expect(page.locator('text=Schedule').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Tasks').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows blackbox branding', async ({ page }) => {
    await page.goto('/#display');
    await page.waitForTimeout(800);
    await expect(page.locator('text=blackbox')).toBeVisible({ timeout: 5000 });
  });

  test('returns to dashboard when hash is removed', async ({ page }) => {
    await page.goto('/#display');
    await page.waitForTimeout(500);
    // Navigate back to root (no hash)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Tab navigation should be present again
    await expect(page.locator('text=AI Chat')).toBeVisible({ timeout: 5000 });
  });
});
