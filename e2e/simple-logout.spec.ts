import { test, expect } from '@playwright/test';

test.describe('Simple Logout Test', () => {
  test('simple logout test', async ({ page }) => {
    // Clear any existing data
    await page.goto('http://localhost:65458');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Complete authentication flow
    await page.goto('http://localhost:65458/auth/onboarding');
    await page.waitForTimeout(2000);
    
    // Fill in onboarding form
    await page.locator('input[data-testid="onboard-pin"]').fill('123456');
    await page.locator('input[data-testid="onboard-pin-confirm"]').fill('123456');
    await page.locator('button[data-testid="onboard-submit"]').click();
    
    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard/);
    await page.waitForTimeout(3000);
    
    // Navigate to test-pill page
    await page.goto('http://localhost:65458/test-pill');
    await page.waitForTimeout(1000);
    
    // Expand pill navigation
    const nav = page.getByTestId('pill-navigation');
    await nav.click();
    await page.waitForTimeout(2000);
    
    // Click logout button
    const logoutButton = page.getByRole('button', { name: /sign out/i });
    await logoutButton.click({ force: true });
    
    // Wait and check URL
    await page.waitForTimeout(5000);
    const currentUrl = page.url();
    console.log('Current URL after logout:', currentUrl);

    // Check if we're on any auth-related page
    const isOnAuthPage = currentUrl.includes('/auth');
    console.log('Is on auth page:', isOnAuthPage);

    // Take a screenshot
    await page.screenshot({ path: 'test-results/simple-logout-result.png', fullPage: true });

    expect(isOnAuthPage).toBe(true);
  });
});
