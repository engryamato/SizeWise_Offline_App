import { test, expect } from '@playwright/test';

test.describe('Debug Logout Implementation', () => {
  test('debug logout button click', async ({ page }) => {
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
    await page.waitForURL(/\/dashboard\/?$/);
    await page.waitForTimeout(3000);
    
    // Navigate to test-pill page
    await page.goto('http://localhost:58194/test-pill');
    await page.waitForTimeout(1000);
    
    // Expand pill navigation
    const nav = page.getByTestId('pill-navigation');
    await nav.click();
    await page.waitForTimeout(2000); // Wait for animation to complete
    
    // Take a screenshot before clicking logout
    await page.screenshot({ path: 'test-results/debug-before-logout.png', fullPage: true });
    
    // Check if logout button is visible and clickable
    const logoutButton = page.getByRole('button', { name: /sign out/i });
    const isVisible = await logoutButton.isVisible();
    const isEnabled = await logoutButton.isEnabled();
    console.log('Logout button visible:', isVisible);
    console.log('Logout button enabled:', isEnabled);
    
    // Get button text
    const buttonText = await logoutButton.textContent();
    console.log('Button text:', buttonText);
    
    // Check localStorage before logout
    const beforeLogout = await page.evaluate(() => {
      return {
        testAccount: localStorage.getItem('sizewise-test-account'),
        url: window.location.href
      };
    });
    console.log('Before logout - localStorage:', beforeLogout.testAccount);
    console.log('Before logout - URL:', beforeLogout.url);
    
    // Click logout button with force
    await logoutButton.click({ force: true });
    
    // Wait a bit and check what happened
    await page.waitForTimeout(3000);
    
    // Take a screenshot after clicking logout
    await page.screenshot({ path: 'test-results/debug-after-logout.png', fullPage: true });
    
    // Check localStorage after logout
    const afterLogout = await page.evaluate(() => {
      return {
        testAccount: localStorage.getItem('sizewise-test-account'),
        url: window.location.href
      };
    });
    console.log('After logout - localStorage:', afterLogout.testAccount);
    console.log('After logout - URL:', afterLogout.url);
    
    // Check console messages
    const messages = await page.evaluate(() => {
      return window.console;
    });
    console.log('Console messages available:', typeof messages);
    
    expect(page.url()).toContain('localhost:58194');
  });
});
