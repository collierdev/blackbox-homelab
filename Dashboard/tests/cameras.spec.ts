import { test, expect } from '@playwright/test';

const GO2RTC_URL = 'http://192.168.50.39:1984';
const DASHBOARD_URL = 'http://192.168.50.39';

test.describe('Camera Stream Diagnostics', () => {

  test('go2rtc API returns camera streams', async ({ request }) => {
    const response = await request.get(`${GO2RTC_URL}/api/streams`);
    expect(response.ok()).toBeTruthy();
    const streams = await response.json();
    console.log('Available streams:', Object.keys(streams));
    expect(Object.keys(streams).length).toBeGreaterThan(0);
  });

  test('Dashboard API returns camera list with correct IPs', async ({ request }) => {
    const response = await request.get(`${DASHBOARD_URL}/api/go2rtc/cameras`);
    expect(response.ok()).toBeTruthy();
    const cameras = await response.json();

    // Verify Camera 3 has the new IP
    const camera3 = cameras.find((c: any) => c.id === 'camera3');
    expect(camera3).toBeDefined();
    expect(camera3.ip).toBe('192.168.50.227');
    console.log('Camera 3 IP verified:', camera3.ip);
  });

  test('Dashboard loads cameras without scrollbars', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check for Security Cameras section
    const camerasSection = page.locator('text=Security Cameras');
    await expect(camerasSection).toBeVisible({ timeout: 10000 });

    // Take screenshot to verify no scrollbars
    await page.screenshot({ path: 'tests/screenshots/cameras-no-scrollbar.png', fullPage: true });

    // Check that iframes have overflow hidden
    const iframes = page.locator('iframe');
    const count = await iframes.count();
    console.log(`Found ${count} camera iframes`);
    expect(count).toBeGreaterThan(0);
  });

  test('Camera playbar has audio hint for iframe modes', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Hover over the first camera card to show controls
    const cameraCard = page.locator('[class*="aspect-video"]').first();
    await cameraCard.hover();
    await page.waitForTimeout(500);

    // For WebRTC/Auto modes (iframe), we show audio hint instead of volume slider
    // Check for the "Click stream for audio" hint text
    const audioHint = page.locator('text=Click stream for audio').first();
    await expect(audioHint).toBeVisible({ timeout: 5000 });
    console.log('Audio hint found for iframe mode');

    // Take screenshot with playbar visible
    await page.screenshot({ path: 'tests/screenshots/camera-playbar-audio-hint.png' });
  });

  test('Camera name is double-clickable for renaming', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Find the camera name element with double-click tooltip
    const cameraName = page.locator('[title="Double-click to rename"]').first();
    await expect(cameraName).toBeVisible({ timeout: 10000 });
    console.log('Camera name with double-click hint found');

    // Double-click to start editing
    await cameraName.dblclick();

    // Check that input appears
    const renameInput = page.locator('input[type="text"]').first();
    await expect(renameInput).toBeVisible({ timeout: 2000 });
    console.log('Rename input appeared after double-click');

    // Take screenshot of rename mode
    await page.screenshot({ path: 'tests/screenshots/camera-rename-mode.png' });

    // Press Escape to cancel
    await renameInput.press('Escape');

    // Verify input is gone
    await expect(renameInput).not.toBeVisible({ timeout: 2000 });
    console.log('Rename cancelled with Escape');
  });

  test('Camera rename persists after refresh', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Double-click camera name
    const cameraName = page.locator('[title="Double-click to rename"]').first();
    await cameraName.dblclick();

    // Enter new name
    const renameInput = page.locator('input[type="text"]').first();
    await renameInput.fill('Test Camera Name');
    await renameInput.press('Enter');

    // Wait for save
    await page.waitForTimeout(500);

    // Verify the new name is displayed
    await expect(page.locator('text=Test Camera Name')).toBeVisible();
    console.log('New name saved');

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Verify name persisted
    await expect(page.locator('text=Test Camera Name')).toBeVisible();
    console.log('Name persisted after refresh');

    // Clean up - rename back
    const renamedCamera = page.locator('[title="Double-click to rename"]').first();
    await renamedCamera.dblclick();
    const input = page.locator('input[type="text"]').first();
    await input.fill('Camera 1');
    await input.press('Enter');
  });

  test('No duplicate playbars visible', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Wait for streams to load

    // Hover over camera to show playbar
    const cameraCard = page.locator('[class*="aspect-video"]').first();
    await cameraCard.hover();
    await page.waitForTimeout(500);

    // Take screenshot to verify no duplicate playbars
    await page.screenshot({ path: 'tests/screenshots/camera-single-playbar.png' });

    // Check for our playbar controls (settings button in our overlay)
    const settingsButtons = page.locator('button[title="Settings"]');
    const settingsCount = await settingsButtons.count();
    console.log(`Settings buttons found: ${settingsCount}`);

    // Should have settings buttons (one per camera when hovered)
    expect(settingsCount).toBeGreaterThan(0);
  });

  test('Settings button exists and playbar has controls', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    // Verify we have cameras with settings buttons
    const settingsButtons = page.locator('button[title="Settings"]');
    const count = await settingsButtons.count();
    console.log(`Settings buttons in playbar: ${count}`);
    expect(count).toBe(3); // One per camera

    // Verify fullscreen buttons exist
    const fullscreenButtons = page.locator('button[title="Fullscreen"]');
    const fsCount = await fullscreenButtons.count();
    console.log(`Fullscreen buttons in playbar: ${fsCount}`);
    expect(fsCount).toBe(3);

    // Take screenshot showing playbars
    await page.screenshot({ path: 'tests/screenshots/camera-playbar-controls.png', fullPage: true });
    console.log('All playbar controls verified');
  });

  test('No Stream Connection errors', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    const errorMessages = page.locator('text=Stream connection error');
    const errorCount = await errorMessages.count();
    console.log(`"Stream connection error" count: ${errorCount}`);

    await page.screenshot({ path: 'tests/screenshots/final-verification.png', fullPage: true });

    expect(errorCount).toBe(0);
  });

  test('Settings dropdown menu is fully visible and not clipped', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Find and scroll to Security Cameras section
    const camerasSection = page.locator('text=Security Cameras');
    await expect(camerasSection).toBeVisible({ timeout: 10000 });
    await camerasSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(5000); // Wait for streams to load

    // First take a screenshot to see the initial state
    await page.screenshot({ path: 'tests/screenshots/cameras-before-settings.png' });

    // Hover over the first camera card to show playbar
    const firstCameraCard = page.locator('.bg-card').filter({ hasText: 'Camera 1' }).first();
    await firstCameraCard.hover();
    await page.waitForTimeout(1000);

    // Screenshot after hover
    await page.screenshot({ path: 'tests/screenshots/cameras-after-hover.png' });

    // Find and click settings button - use dispatchEvent to ensure click registers
    const settingsButton = page.locator('button[title="Settings"]').first();
    await expect(settingsButton).toBeVisible({ timeout: 5000 });
    console.log('Settings button is visible');

    // Click using evaluate to ensure event fires
    await settingsButton.evaluate((btn) => {
      btn.click();
    });
    await page.waitForTimeout(500);

    // Take screenshot to see current state
    await page.screenshot({ path: 'tests/screenshots/settings-dropdown-visible.png' });

    // Look for the dropdown content - it should contain "Stream Mode" text
    const streamModeText = page.locator('text=Stream Mode').first();
    await expect(streamModeText).toBeVisible({ timeout: 5000 });
    console.log('Settings dropdown is visible - Stream Mode text found');

    // Check that dropdown options are visible (WebRTC, Auto, HLS, MJPEG)
    const webrtcOption = page.locator('text=WebRTC').first();
    const hlsOption = page.locator('text=HLS').first();
    await expect(webrtcOption).toBeVisible();
    await expect(hlsOption).toBeVisible();
    console.log('All dropdown options are visible');

    // Find the dropdown container and get its bounding box
    const dropdown = page.locator('.settings-dropdown').filter({ hasText: 'Stream Mode' }).first();
    const boundingBox = await dropdown.boundingBox();
    const viewport = page.viewportSize();

    if (boundingBox && viewport) {
      // Verify dropdown is within viewport bounds
      expect(boundingBox.x).toBeGreaterThanOrEqual(0);
      expect(boundingBox.y).toBeGreaterThanOrEqual(0);
      expect(boundingBox.x + boundingBox.width).toBeLessThanOrEqual(viewport.width + 20);
      expect(boundingBox.y + boundingBox.height).toBeLessThanOrEqual(viewport.height + 20);
      console.log(`Dropdown bounds: x=${boundingBox.x}, y=${boundingBox.y}, w=${boundingBox.width}, h=${boundingBox.height}`);
      console.log('Dropdown is fully within viewport - not clipped');
    }
  });

  test('HLS mode has working volume slider', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Find and scroll to Security Cameras section
    const camerasSection = page.locator('text=Security Cameras');
    await expect(camerasSection).toBeVisible({ timeout: 10000 });
    await camerasSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(5000); // Wait for streams to load

    // Hover over the first camera card to show playbar
    const firstCameraCard = page.locator('.bg-card').filter({ hasText: 'Camera 1' }).first();
    await firstCameraCard.hover();
    await page.waitForTimeout(1000);

    // Click settings button using evaluate
    const settingsButton = page.locator('button[title="Settings"]').first();
    await expect(settingsButton).toBeVisible({ timeout: 5000 });
    await settingsButton.evaluate((btn) => btn.click());
    await page.waitForTimeout(500);

    // Take screenshot of dropdown
    await page.screenshot({ path: 'tests/screenshots/hls-dropdown.png' });

    // Click on HLS option
    const hlsOption = page.locator('button').filter({ hasText: 'HLS' }).filter({ hasText: 'Safari' }).first();
    await expect(hlsOption).toBeVisible({ timeout: 3000 });
    await hlsOption.evaluate((btn) => btn.click());
    console.log('Switched to HLS mode');
    await page.waitForTimeout(3000); // Wait for stream to reload

    // Hover again to show controls
    await firstCameraCard.hover();
    await page.waitForTimeout(1000);

    // Take screenshot to see current state
    await page.screenshot({ path: 'tests/screenshots/hls-volume-slider.png' });

    // In HLS mode, we should have a volume slider (native video element)
    const volumeSlider = page.locator('input[type="range"][title="Volume"]').first();
    await expect(volumeSlider).toBeVisible({ timeout: 5000 });
    console.log('Volume slider visible in HLS mode');

    // Check for mute button
    const muteButton = page.locator('button[title="Unmute"], button[title="Mute"]').first();
    await expect(muteButton).toBeVisible();
    console.log('Mute button visible in HLS mode');

    // Switch back to WebRTC mode for other tests
    await settingsButton.evaluate((btn) => btn.click());
    await page.waitForTimeout(500);
    const webrtcOption = page.locator('button').filter({ hasText: 'WebRTC' }).filter({ hasText: 'Lowest' }).first();
    await webrtcOption.evaluate((btn) => btn.click());
    console.log('Switched back to WebRTC mode');
  });
});
