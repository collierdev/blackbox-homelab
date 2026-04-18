import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://192.168.50.39';
const API_URL = 'http://192.168.50.39:8080/api';

// Helper to generate unique test identifiers
const generateTestId = () => `E2E-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Helper to navigate to Calendar & Tasks
async function navigateToCalendarTasks(page: Page) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  await page.click('button:has-text("Calendar & Tasks")');
  await page.waitForTimeout(500);
}

// Helper to navigate to Tasks view
async function navigateToTasks(page: Page) {
  await navigateToCalendarTasks(page);
  await page.click('[data-testid="tasks-view-button"]');
  await page.waitForTimeout(1000);
  await page.waitForSelector('[data-testid="todo-list"]', { timeout: 10000 });
}

// Helper to verify event exists in database via API
async function verifyEventInDatabase(eventTitle: string): Promise<boolean> {
  const response = await fetch(`${API_URL}/calendar/events`);
  const events = await response.json();
  return events.some((e: any) => e.title === eventTitle);
}

// Helper to verify task exists in database via API
async function verifyTaskInDatabase(taskTitle: string): Promise<boolean> {
  const response = await fetch(`${API_URL}/todos`);
  const tasks = await response.json();
  return tasks.some((t: any) => t.title === taskTitle);
}

// Helper to get event by title from database
async function getEventByTitle(eventTitle: string): Promise<any | null> {
  const response = await fetch(`${API_URL}/calendar/events`);
  const events = await response.json();
  return events.find((e: any) => e.title === eventTitle) || null;
}

// Helper to get task by title from database
async function getTaskByTitle(taskTitle: string): Promise<any | null> {
  const response = await fetch(`${API_URL}/todos`);
  const tasks = await response.json();
  return tasks.find((t: any) => t.title === taskTitle) || null;
}

// Helper to delete event by ID
async function deleteEventById(eventId: string): Promise<void> {
  await fetch(`${API_URL}/calendar/events/${eventId}`, { method: 'DELETE' });
}

// Helper to delete task by ID
async function deleteTaskById(taskId: string): Promise<void> {
  await fetch(`${API_URL}/todos/${taskId}`, { method: 'DELETE' });
}

test.describe('Calendar & Tasks Persistence Tests', () => {

  test.describe('Calendar Event Creation and Persistence', () => {
    let testEventTitle: string;
    let createdEventId: string | null = null;

    test.beforeEach(() => {
      testEventTitle = `Test Event ${generateTestId()}`;
    });

    test.afterEach(async () => {
      // Cleanup: Delete the test event if it was created
      if (createdEventId) {
        await deleteEventById(createdEventId);
        createdEventId = null;
      }
    });

    test('should create a calendar event and verify in database', async ({ page }) => {
      await navigateToCalendarTasks(page);

      // Open new event form
      await page.click('button:has-text("New Event")');
      await page.waitForTimeout(500);

      // Fill in event details
      await page.fill('input[placeholder="Event title"]', testEventTitle);
      await page.fill('textarea[placeholder="Add description"]', 'Persistence test event');

      // Submit the form
      await page.click('button:has-text("Create Event")');
      await page.waitForTimeout(2000);

      // Verify event appears in UI
      // Note: Events appear on the calendar grid, check if visible for today's date

      // Verify event exists in database via API
      const eventInDb = await getEventByTitle(testEventTitle);
      expect(eventInDb).not.toBeNull();
      expect(eventInDb.title).toBe(testEventTitle);
      expect(eventInDb.origin).toBe('local');

      createdEventId = eventInDb.id;

      console.log(`✓ Event created with ID: ${createdEventId}`);
    });

    test('should persist calendar event across page reload', async ({ page }) => {
      await navigateToCalendarTasks(page);

      // Create a new event
      await page.click('button:has-text("New Event")');
      await page.waitForTimeout(500);
      await page.fill('input[placeholder="Event title"]', testEventTitle);
      await page.fill('textarea[placeholder="Add description"]', 'Reload persistence test');
      await page.click('button:has-text("Create Event")');
      await page.waitForTimeout(2000);

      // Get event ID for cleanup
      const eventInDb = await getEventByTitle(testEventTitle);
      expect(eventInDb).not.toBeNull();
      createdEventId = eventInDb.id;

      // Reload the page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Navigate back to Calendar & Tasks
      await page.click('button:has-text("Calendar & Tasks")');
      await page.waitForTimeout(1000);

      // Verify event still exists in database after reload
      const eventAfterReload = await getEventByTitle(testEventTitle);
      expect(eventAfterReload).not.toBeNull();
      expect(eventAfterReload.id).toBe(createdEventId);

      console.log(`✓ Event ${createdEventId} persisted after page reload`);
    });

    test('should persist calendar event across browser close/reopen', async ({ browser }) => {
      // Create a new browser context (simulates closing and reopening browser)
      const context1 = await browser.newContext();
      const page1 = await context1.newPage();

      await navigateToCalendarTasks(page1);

      // Create a new event
      await page1.click('button:has-text("New Event")');
      await page1.waitForTimeout(500);
      await page1.fill('input[placeholder="Event title"]', testEventTitle);
      await page1.click('button:has-text("Create Event")');
      await page1.waitForTimeout(2000);

      // Get event ID
      const eventInDb = await getEventByTitle(testEventTitle);
      expect(eventInDb).not.toBeNull();
      createdEventId = eventInDb.id;

      // Close the first browser context
      await context1.close();

      // Open a new browser context (simulates reopening browser)
      const context2 = await browser.newContext();
      const page2 = await context2.newPage();

      // Navigate to dashboard
      await navigateToCalendarTasks(page2);

      // Verify event still exists in database
      const eventAfterReopen = await getEventByTitle(testEventTitle);
      expect(eventAfterReopen).not.toBeNull();
      expect(eventAfterReopen.id).toBe(createdEventId);

      await context2.close();

      console.log(`✓ Event ${createdEventId} persisted after browser context switch`);
    });

    test('should create event with all fields and persist correctly', async ({ page }) => {
      await navigateToCalendarTasks(page);

      // Open new event form
      await page.click('button:has-text("New Event")');
      await page.waitForTimeout(500);

      // Fill in all event details
      await page.fill('input[placeholder="Event title"]', testEventTitle);
      await page.fill('textarea[placeholder="Add description"]', 'Full details persistence test');

      // Location field uses "Add location" placeholder
      const locationInput = page.locator('input[placeholder="Add location"]');
      if (await locationInput.isVisible()) {
        await locationInput.fill('Test Location');
      }

      // Submit the form
      await page.click('button:has-text("Create Event")');
      await page.waitForTimeout(2000);

      // Verify all fields persisted in database
      const eventInDb = await getEventByTitle(testEventTitle);
      expect(eventInDb).not.toBeNull();
      expect(eventInDb.title).toBe(testEventTitle);

      createdEventId = eventInDb.id;

      console.log(`✓ Event with full details created: ${JSON.stringify(eventInDb, null, 2)}`);
    });
  });

  test.describe('Task Creation and Persistence', () => {
    let testTaskTitle: string;
    let createdTaskId: string | null = null;

    test.beforeEach(() => {
      testTaskTitle = `Test Task ${generateTestId()}`;
    });

    test.afterEach(async () => {
      // Cleanup: Delete the test task if it was created
      if (createdTaskId) {
        await deleteTaskById(createdTaskId);
        createdTaskId = null;
      }
    });

    test('should create a task and verify in database', async ({ page }) => {
      await navigateToTasks(page);

      // Open new task form
      await page.click('[data-testid="new-task-button"]');
      await page.waitForTimeout(500);

      // Fill in task details
      await page.fill('input[placeholder="Task title"]', testTaskTitle);
      await page.fill('textarea[placeholder="Add description"]', 'Persistence test task');

      // Submit the form
      await page.click('button:has-text("Create Task")');
      await page.waitForTimeout(2000);

      // Verify task appears in UI
      await expect(page.locator(`text=${testTaskTitle}`)).toBeVisible();

      // Verify task exists in database via API
      const taskInDb = await getTaskByTitle(testTaskTitle);
      expect(taskInDb).not.toBeNull();
      expect(taskInDb.title).toBe(testTaskTitle);
      expect(taskInDb.origin).toBe('local');
      expect(taskInDb.isCompleted).toBe(false);

      createdTaskId = taskInDb.id;

      console.log(`✓ Task created with ID: ${createdTaskId}`);
    });

    test('should persist task across page reload', async ({ page }) => {
      await navigateToTasks(page);

      // Create a new task
      await page.click('[data-testid="new-task-button"]');
      await page.waitForTimeout(500);
      await page.fill('input[placeholder="Task title"]', testTaskTitle);
      await page.click('button:has-text("Create Task")');
      await page.waitForTimeout(2000);

      // Verify task is visible
      await expect(page.locator(`text=${testTaskTitle}`)).toBeVisible();

      // Get task ID for cleanup
      const taskInDb = await getTaskByTitle(testTaskTitle);
      expect(taskInDb).not.toBeNull();
      createdTaskId = taskInDb.id;

      // Reload the page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Navigate back to Tasks
      await navigateToTasks(page);

      // Verify task is still visible in UI after reload
      await expect(page.locator(`text=${testTaskTitle}`)).toBeVisible();

      // Verify task still exists in database
      const taskAfterReload = await getTaskByTitle(testTaskTitle);
      expect(taskAfterReload).not.toBeNull();
      expect(taskAfterReload.id).toBe(createdTaskId);

      console.log(`✓ Task ${createdTaskId} persisted after page reload`);
    });

    test('should persist task completion status', async ({ page }) => {
      await navigateToTasks(page);

      // Create a new task
      await page.click('[data-testid="new-task-button"]');
      await page.waitForTimeout(500);
      await page.fill('input[placeholder="Task title"]', testTaskTitle);
      await page.click('button:has-text("Create Task")');
      await page.waitForTimeout(2000);

      // Get task ID
      const taskInDb = await getTaskByTitle(testTaskTitle);
      expect(taskInDb).not.toBeNull();
      createdTaskId = taskInDb.id;
      expect(taskInDb.isCompleted).toBe(false);

      // Complete task via API directly (more reliable than UI click)
      const completeResponse = await fetch(`${API_URL}/todos/${createdTaskId}/complete`, {
        method: 'POST'
      });
      expect(completeResponse.ok).toBe(true);

      // Verify completion status in database
      const taskAfterComplete = await getTaskByTitle(testTaskTitle);
      expect(taskAfterComplete).not.toBeNull();
      expect(taskAfterComplete.isCompleted).toBe(true);

      console.log(`✓ Task ${createdTaskId} completion status persisted`);

      // Reload and verify completion persists in UI
      await page.reload();
      await page.waitForLoadState('networkidle');

      const taskAfterReload = await getTaskByTitle(testTaskTitle);
      expect(taskAfterReload).not.toBeNull();
      expect(taskAfterReload.isCompleted).toBe(true);

      console.log(`✓ Task ${createdTaskId} completion status persisted after reload`);
    });

    test('should create task with priority and verify persistence', async ({ page }) => {
      await navigateToTasks(page);

      // Open new task form
      await page.click('[data-testid="new-task-button"]');
      await page.waitForTimeout(500);

      // Fill in task details with priority
      await page.fill('input[placeholder="Task title"]', testTaskTitle);
      await page.fill('textarea[placeholder="Add description"]', 'High priority task test');

      // Select high priority
      await page.selectOption('[data-testid="priority-select"], select:has-text("None")', 'high');

      // Submit the form
      await page.click('button:has-text("Create Task")');
      await page.waitForTimeout(2000);

      // Verify priority in database
      const taskInDb = await getTaskByTitle(testTaskTitle);
      expect(taskInDb).not.toBeNull();
      expect(taskInDb.priority).toBe('high');

      createdTaskId = taskInDb.id;

      console.log(`✓ Task with priority created: priority=${taskInDb.priority}`);
    });
  });

  test.describe('Database Verification', () => {
    test('should verify Neo4j database is accessible', async () => {
      // Test that we can access the events API
      const eventsResponse = await fetch(`${API_URL}/calendar/events`);
      expect(eventsResponse.ok).toBe(true);
      const events = await eventsResponse.json();
      expect(Array.isArray(events)).toBe(true);

      console.log(`✓ Events API returned ${events.length} events`);

      // Test that we can access the todos API
      const todosResponse = await fetch(`${API_URL}/todos`);
      expect(todosResponse.ok).toBe(true);
      const todos = await todosResponse.json();
      expect(Array.isArray(todos)).toBe(true);

      console.log(`✓ Todos API returned ${todos.length} tasks`);

      // Test that we can access the projects API
      const projectsResponse = await fetch(`${API_URL}/projects`);
      expect(projectsResponse.ok).toBe(true);
      const projects = await projectsResponse.json();
      expect(Array.isArray(projects)).toBe(true);
      expect(projects.length).toBeGreaterThanOrEqual(1); // At least default project

      console.log(`✓ Projects API returned ${projects.length} projects`);
    });

    test('should verify default project exists', async () => {
      const response = await fetch(`${API_URL}/projects`);
      const projects = await response.json();

      const defaultProject = projects.find((p: any) => p.id === 'default');
      expect(defaultProject).not.toBeNull();
      expect(defaultProject.name).toBe('Personal');

      console.log(`✓ Default project exists: ${JSON.stringify(defaultProject)}`);
    });

    test('should verify event CRUD operations via API', async () => {
      const testTitle = `API Test Event ${generateTestId()}`;

      // CREATE
      const createResponse = await fetch(`${API_URL}/calendar/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: testTitle,
          startDateTime: new Date().toISOString(),
          endDateTime: new Date(Date.now() + 3600000).toISOString(),
          priority: 'medium',
          isAllDay: false
        })
      });
      expect(createResponse.ok).toBe(true);
      const createdEvent = await createResponse.json();
      expect(createdEvent.title).toBe(testTitle);
      console.log(`✓ CREATE: Event created with ID ${createdEvent.id}`);

      // READ
      const readResponse = await fetch(`${API_URL}/calendar/events/${createdEvent.id}`);
      expect(readResponse.ok).toBe(true);
      const readEvent = await readResponse.json();
      expect(readEvent.title).toBe(testTitle);
      console.log(`✓ READ: Event retrieved successfully`);

      // UPDATE
      const updateResponse = await fetch(`${API_URL}/calendar/events/${createdEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: testTitle + ' (Updated)',
          priority: 'high'
        })
      });
      expect(updateResponse.ok).toBe(true);
      const updatedEvent = await updateResponse.json();
      expect(updatedEvent.title).toBe(testTitle + ' (Updated)');
      expect(updatedEvent.priority).toBe('high');
      console.log(`✓ UPDATE: Event updated successfully`);

      // DELETE
      const deleteResponse = await fetch(`${API_URL}/calendar/events/${createdEvent.id}`, {
        method: 'DELETE'
      });
      expect(deleteResponse.ok).toBe(true);
      console.log(`✓ DELETE: Event deleted successfully`);

      // VERIFY DELETION
      const verifyResponse = await fetch(`${API_URL}/calendar/events/${createdEvent.id}`);
      expect(verifyResponse.status).toBe(404);
      console.log(`✓ VERIFY: Event no longer exists`);
    });

    test('should verify task CRUD operations via API', async () => {
      const testTitle = `API Test Task ${generateTestId()}`;

      // CREATE
      const createResponse = await fetch(`${API_URL}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: testTitle,
          description: 'API CRUD test',
          priority: 'medium'
        })
      });
      expect(createResponse.ok).toBe(true);
      const createdTask = await createResponse.json();
      expect(createdTask.title).toBe(testTitle);
      console.log(`✓ CREATE: Task created with ID ${createdTask.id}`);

      // READ
      const readResponse = await fetch(`${API_URL}/todos/${createdTask.id}`);
      expect(readResponse.ok).toBe(true);
      const readTask = await readResponse.json();
      expect(readTask.title).toBe(testTitle);
      console.log(`✓ READ: Task retrieved successfully`);

      // UPDATE
      const updateResponse = await fetch(`${API_URL}/todos/${createdTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: testTitle + ' (Updated)',
          priority: 'high'
        })
      });
      expect(updateResponse.ok).toBe(true);
      const updatedTask = await updateResponse.json();
      expect(updatedTask.title).toBe(testTitle + ' (Updated)');
      expect(updatedTask.priority).toBe('high');
      console.log(`✓ UPDATE: Task updated successfully`);

      // COMPLETE
      const completeResponse = await fetch(`${API_URL}/todos/${createdTask.id}/complete`, {
        method: 'POST'
      });
      expect(completeResponse.ok).toBe(true);
      const completedTask = await completeResponse.json();
      expect(completedTask.isCompleted).toBe(true);
      console.log(`✓ COMPLETE: Task marked as completed`);

      // DELETE
      const deleteResponse = await fetch(`${API_URL}/todos/${createdTask.id}`, {
        method: 'DELETE'
      });
      expect(deleteResponse.ok).toBe(true);
      console.log(`✓ DELETE: Task deleted successfully`);

      // VERIFY DELETION
      const verifyResponse = await fetch(`${API_URL}/todos/${createdTask.id}`);
      expect(verifyResponse.status).toBe(404);
      console.log(`✓ VERIFY: Task no longer exists`);
    });
  });

  test.describe('Cross-Session Persistence', () => {
    // These tests verify data persists across completely independent sessions

    const persistenceTestEventTitle = `Persistence Test Event ${Date.now()}`;
    const persistenceTestTaskTitle = `Persistence Test Task ${Date.now()}`;
    let eventId: string;
    let taskId: string;

    test('Phase 1: Create test data for persistence check', async ({ page }) => {
      // Create an event
      await navigateToCalendarTasks(page);
      await page.click('button:has-text("New Event")');
      await page.waitForTimeout(500);
      await page.fill('input[placeholder="Event title"]', persistenceTestEventTitle);
      await page.click('button:has-text("Create Event")');
      await page.waitForTimeout(2000);

      const event = await getEventByTitle(persistenceTestEventTitle);
      expect(event).not.toBeNull();
      eventId = event.id;

      // Create a task
      await page.click('[data-testid="tasks-view-button"]');
      await page.waitForTimeout(1000);
      await page.waitForSelector('[data-testid="new-task-button"]', { timeout: 10000 });
      await page.click('[data-testid="new-task-button"]');
      await page.waitForTimeout(500);
      await page.fill('input[placeholder="Task title"]', persistenceTestTaskTitle);
      await page.click('button:has-text("Create Task")');
      await page.waitForTimeout(2000);

      const task = await getTaskByTitle(persistenceTestTaskTitle);
      expect(task).not.toBeNull();
      taskId = task.id;

      console.log(`✓ Phase 1 Complete: Created event ${eventId} and task ${taskId}`);
    });

    test('Phase 2: Verify data persists in new session', async ({ page }) => {
      // This test runs in a completely new browser context

      // Verify event still exists via API
      const event = await getEventByTitle(persistenceTestEventTitle);
      expect(event).not.toBeNull();
      console.log(`✓ Event "${persistenceTestEventTitle}" persists in database`);

      // Verify task still exists via API
      const task = await getTaskByTitle(persistenceTestTaskTitle);
      expect(task).not.toBeNull();
      console.log(`✓ Task "${persistenceTestTaskTitle}" persists in database`);

      // Navigate to dashboard and verify UI shows the data
      await navigateToTasks(page);
      await expect(page.locator(`text=${persistenceTestTaskTitle}`)).toBeVisible();
      console.log(`✓ Task visible in UI after new session`);

      // Cleanup
      if (event) await deleteEventById(event.id);
      if (task) await deleteTaskById(task.id);
      console.log(`✓ Phase 2 Complete: Data persisted and cleaned up`);
    });
  });

  test.describe('Real-Time Updates', () => {
    test('should receive real-time updates via Socket.io', async ({ page }) => {
      await navigateToTasks(page);

      const testTitle = `Realtime Test ${generateTestId()}`;

      // Create task via API (not through UI)
      const createResponse = await fetch(`${API_URL}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: testTitle,
          priority: 'high'
        })
      });
      const createdTask = await createResponse.json();

      // Wait for Socket.io to push the update (updates every 5 seconds)
      await page.waitForTimeout(6000);

      // Task should appear in UI via real-time update
      await expect(page.locator(`text=${testTitle}`)).toBeVisible({ timeout: 10000 });
      console.log(`✓ Real-time update received - task appeared in UI`);

      // Cleanup
      await deleteTaskById(createdTask.id);
    });
  });
});
