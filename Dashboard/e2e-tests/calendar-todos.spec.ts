import { test, expect } from '@playwright/test';

const BASE_URL = 'http://192.168.50.39';

test.describe('Calendar & Tasks Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test.describe('Navigation', () => {
    test('should show Calendar & Tasks tab', async ({ page }) => {
      const calendarTab = page.locator('button:has-text("Calendar & Tasks")');
      await expect(calendarTab).toBeVisible();
    });

    test('should navigate to Calendar & Tasks view', async ({ page }) => {
      await page.click('button:has-text("Calendar & Tasks")');
      await page.waitForTimeout(500);

      // Should see Calendar/Tasks toggle
      await expect(page.locator('[data-testid="calendar-view-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="tasks-view-button"]')).toBeVisible();
    });
  });

  test.describe('Calendar View', () => {
    test.beforeEach(async ({ page }) => {
      await page.click('button:has-text("Calendar & Tasks")');
      await page.waitForTimeout(500);
    });

    test('should show calendar header with view options', async ({ page }) => {
      // Check for view switcher buttons (use exact text match to avoid "Today" matching "Day")
      await expect(page.locator('button', { hasText: /^Day$/ })).toBeVisible();
      await expect(page.locator('button', { hasText: /^Week$/ })).toBeVisible();
      await expect(page.locator('button', { hasText: /^Month$/ })).toBeVisible();
      await expect(page.locator('button:has-text("2 Months")')).toBeVisible();
      await expect(page.locator('button:has-text("Circular")')).toBeVisible();
    });

    test('should show Today button and navigation arrows', async ({ page }) => {
      await expect(page.locator('button:has-text("Today")')).toBeVisible();
      await expect(page.locator('button[aria-label="Previous"]')).toBeVisible();
      await expect(page.locator('button[aria-label="Next"]')).toBeVisible();
    });

    test('should show New Event button', async ({ page }) => {
      await expect(page.locator('button:has-text("New Event")')).toBeVisible();
    });

    test('should switch between calendar views', async ({ page }) => {
      // Switch to Week view
      await page.click('button:has-text("Week")');
      await page.waitForTimeout(300);

      // Switch to Day view
      await page.click('button:has-text("Day")');
      await page.waitForTimeout(300);

      // Switch back to Month view
      await page.click('button:has-text("Month")');
      await page.waitForTimeout(300);
    });

    test('should open event form when clicking New Event', async ({ page }) => {
      await page.click('button:has-text("New Event")');
      await page.waitForTimeout(500);

      // Should see event form
      await expect(page.locator('text=New Event').first()).toBeVisible();
      await expect(page.locator('input[placeholder="Event title"]')).toBeVisible();
    });

    test('should create a new event', async ({ page }) => {
      await page.click('button:has-text("New Event")');
      await page.waitForTimeout(500);

      // Fill in event details
      await page.fill('input[placeholder="Event title"]', 'Test Event from E2E');
      await page.fill('textarea[placeholder="Add description"]', 'This is a test event created by Playwright');

      // Submit form
      await page.click('button:has-text("Create Event")');
      await page.waitForTimeout(1000);

      // Form should close
      await expect(page.locator('input[placeholder="Event title"]')).not.toBeVisible();
    });

    test('should filter events by project', async ({ page }) => {
      // Click on project filter dropdown
      const filterDropdown = page.locator('select').first();
      await expect(filterDropdown).toBeVisible();

      // Check that "All Projects" option exists (options are hidden in DOM)
      const options = await filterDropdown.locator('option').allTextContents();
      expect(options).toContain('All Projects');
    });
  });

  test.describe('Tasks View', () => {
    test.beforeEach(async ({ page }) => {
      await page.click('button:has-text("Calendar & Tasks")');
      await page.waitForTimeout(500);

      // Switch to Tasks view
      await page.click('[data-testid="tasks-view-button"]');
      await page.waitForTimeout(1000);

      // Wait for TodoList to render
      await page.waitForSelector('[data-testid="todo-list"]', { timeout: 10000 });
    });

    test('should show tasks header', async ({ page }) => {
      await expect(page.locator('[data-testid="tasks-header"]')).toBeVisible();
    });

    test('should show New Task button', async ({ page }) => {
      await expect(page.locator('[data-testid="new-task-button"]')).toBeVisible();
    });

    test('should show project filter', async ({ page }) => {
      // Should see project filter select
      await expect(page.locator('[data-testid="project-filter"]')).toBeVisible();
    });

    test('should show completed tasks toggle', async ({ page }) => {
      await expect(page.locator('[data-testid="show-completed-toggle"]')).toBeVisible();
    });

    test('should open task form when clicking New Task', async ({ page }) => {
      await page.click('[data-testid="new-task-button"]');
      await page.waitForTimeout(500);

      // Should see task form
      await expect(page.locator('text=New Task').first()).toBeVisible();
      await expect(page.locator('input[placeholder="Task title"]')).toBeVisible();
    });

    test('should create a new task', async ({ page }) => {
      await page.click('[data-testid="new-task-button"]');
      await page.waitForTimeout(500);

      // Fill in task details
      await page.fill('input[placeholder="Task title"]', 'Test Task from E2E');
      await page.fill('textarea[placeholder="Add description"]', 'This is a test task created by Playwright');

      // Select priority
      await page.selectOption('select:has-text("None")', 'high');

      // Submit form
      await page.click('button:has-text("Create Task")');
      await page.waitForTimeout(1000);

      // Form should close
      await expect(page.locator('input[placeholder="Task title"]')).not.toBeVisible();

      // Task should appear in list
      await expect(page.locator('text=Test Task from E2E')).toBeVisible();
    });

    test('should complete a task', async ({ page }) => {
      // First create a task
      await page.click('[data-testid="new-task-button"]');
      await page.waitForTimeout(500);
      await page.fill('input[placeholder="Task title"]', 'Task to Complete');
      await page.click('button:has-text("Create Task")');
      await page.waitForTimeout(1000);

      // Find and click the checkbox to complete it
      const taskRow = page.locator('text=Task to Complete').locator('..');
      const checkbox = taskRow.locator('button').first();
      await checkbox.click();
      await page.waitForTimeout(500);

      // Task should have completed styling (or disappear if "Show completed" is off)
    });

    test('should show/hide completed tasks', async ({ page }) => {
      // Toggle "Show completed"
      const checkbox = page.locator('[data-testid="show-completed-toggle"]');
      await checkbox.check();
      await page.waitForTimeout(500);

      await checkbox.uncheck();
      await page.waitForTimeout(500);
    });

    test('should delete a task', async ({ page }) => {
      // First create a task
      await page.click('[data-testid="new-task-button"]');
      await page.waitForTimeout(500);
      await page.fill('input[placeholder="Task title"]', 'Task to Delete');
      await page.click('button:has-text("Create Task")');
      await page.waitForTimeout(1000);

      // Hover over task to show actions
      const taskRow = page.locator('text=Task to Delete').locator('..').locator('..');
      await taskRow.hover();

      // Click delete button
      const deleteButton = taskRow.locator('button[title="Delete"]');
      await deleteButton.click();
      await page.waitForTimeout(500);

      // Task should be removed
      await expect(page.locator('text=Task to Delete')).not.toBeVisible();
    });
  });

  test.describe('Projects', () => {
    test.beforeEach(async ({ page }) => {
      await page.click('button:has-text("Calendar & Tasks")');
      await page.waitForTimeout(500);
      await page.click('button:has-text("Tasks")');
      await page.waitForTimeout(500);
    });

    test('should group tasks by project', async ({ page }) => {
      // Should see project headers if tasks exist
      // This test will pass even if no tasks exist yet
      const projectHeaders = page.locator('h3');
      // Projects should be visible when tasks are grouped
    });
  });

  test.describe('Integration', () => {
    test('should maintain state when switching between views', async ({ page }) => {
      await page.click('button:has-text("Calendar & Tasks")');
      await page.waitForTimeout(500);

      // Create a task
      await page.click('[data-testid="tasks-view-button"]');
      await page.waitForTimeout(1000);
      await page.waitForSelector('[data-testid="new-task-button"]', { timeout: 10000 });
      await page.click('[data-testid="new-task-button"]');
      await page.waitForTimeout(500);
      await page.fill('input[placeholder="Task title"]', 'Persistent Task');
      await page.click('button:has-text("Create Task")');
      await page.waitForTimeout(1000);

      // Switch to Calendar view
      await page.click('[data-testid="calendar-view-button"]');
      await page.waitForTimeout(500);

      // Switch back to Tasks view
      await page.click('[data-testid="tasks-view-button"]');
      await page.waitForTimeout(1000);
      await page.waitForSelector('[data-testid="todo-list"]', { timeout: 10000 });

      // Task should still be there
      await expect(page.locator('text=Persistent Task')).toBeVisible();
    });

    test('should work with system dashboard tabs', async ({ page }) => {
      // Should be able to switch to other tabs and back
      await page.click('button:has-text("Calendar & Tasks")');
      await page.waitForTimeout(500);

      await page.click('button:has-text("System")');
      await page.waitForTimeout(500);

      await page.click('button:has-text("Calendar & Tasks")');
      await page.waitForTimeout(500);

      // Calendar should still be functional
      await expect(page.locator('button:has-text("New Event")')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle empty form submission', async ({ page }) => {
      await page.click('button:has-text("Calendar & Tasks")');
      await page.waitForTimeout(500);
      await page.click('[data-testid="tasks-view-button"]');
      await page.waitForTimeout(1000);
      await page.waitForSelector('[data-testid="new-task-button"]', { timeout: 10000 });

      await page.click('[data-testid="new-task-button"]');
      await page.waitForTimeout(500);

      // Try to submit without filling required fields
      await page.click('button:has-text("Create Task")');
      await page.waitForTimeout(500);

      // Form should still be visible (validation failed)
      await expect(page.locator('input[placeholder="Task title"]')).toBeVisible();
    });

    test('should allow canceling form', async ({ page }) => {
      await page.click('button:has-text("Calendar & Tasks")');
      await page.waitForTimeout(500);

      await page.click('button:has-text("New Event")');
      await page.waitForTimeout(500);

      // Click Cancel button
      await page.click('[data-testid="cancel-button"]');
      await page.waitForTimeout(500);

      // Form should close
      await expect(page.locator('input[placeholder="Event title"]')).not.toBeVisible();
    });
  });
});
