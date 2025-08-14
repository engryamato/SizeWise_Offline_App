import { test, expect } from '@playwright/test';

test.describe('Debug Logout Click', () => {
  test('debug logout button click with console monitoring', async ({ page }) => {
    // Monitor console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    // Clear any existing data
    await page.goto('http://localhost:58194');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Complete authentication flow
    await page.goto('http://localhost:58194/auth/onboarding');
    await page.waitForTimeout(2000);
    
    // Fill in onboarding form
    await page.locator('input[data-testid="onboard-pin"]').fill('123456');
    await page.locator('input[data-testid="onboard-pin-confirm"]').fill('123456');
    await page.locator('button[data-testid="onboard-submit"]').click();
    
    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard/);
    await page.waitForTimeout(3000);
    
    // Navigate to test-pill page
    await page.goto('http://localhost:58194/test-pill');
    await page.waitForTimeout(1000);
    
    // Expand pill navigation
    const nav = page.getByTestId('pill-navigation');
    await nav.click();
    await page.waitForTimeout(2000);
    
    console.log('Console messages before logout click:', consoleMessages);
    
    // Try to click logout button and monitor what happens
    const logoutButton = page.getByRole('button', { name: /sign out/i });
    
    // Check if button is actually clickable
    const boundingBox = await logoutButton.boundingBox();
    console.log('Logout button bounding box:', boundingBox);
    
    const isVisible = await logoutButton.isVisible();
    const isEnabled = await logoutButton.isEnabled();
    console.log('Logout button visible:', isVisible, 'enabled:', isEnabled);
    
    // Try clicking with different methods
    console.log('Attempting click...');
    await logoutButton.click({ force: true });
    
    // Wait and check console messages
    await page.waitForTimeout(3000);
    console.log('Console messages after logout click:', consoleMessages);
    
    // Check localStorage
    const localStorage = await page.evaluate(() => {
      return {
        testAccount: window.localStorage.getItem('sizewise-test-account'),
        allKeys: Object.keys(window.localStorage)
      };
    });
    console.log('LocalStorage after click:', localStorage);
    
    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL after logout:', currentUrl);
    
    expect(page.url()).toContain('localhost:58194');
  });
});
