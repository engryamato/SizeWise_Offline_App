import { test, expect } from '@playwright/test';

test.describe('Logout Functionality @phase0', () => {
  test.beforeEach(async ({ page }) => {
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
  });

  test('should show logout button in pill navigation', async ({ page }) => {
    // Navigate to test-pill page
    await page.goto('http://localhost:58194/test-pill');
    await page.waitForTimeout(1000);
    
    // Expand pill navigation
    const nav = page.getByTestId('pill-navigation');
    await nav.click();
    
    // Should show logout button
    const logoutButton = page.getByRole('button', { name: /sign out/i });
    await expect(logoutButton).toBeVisible();
    await expect(logoutButton).toContainText('Sign Out');
  });

  test('should logout and redirect to auth page', async ({ page }) => {
    // Navigate to test-pill page
    await page.goto('http://localhost:58194/test-pill');
    await page.waitForTimeout(1000);
    
    // Expand pill navigation
    const nav = page.getByTestId('pill-navigation');
    await nav.click();
    await page.waitForTimeout(1000); // Wait for animation to complete

    // Click logout button
    const logoutButton = page.getByRole('button', { name: /sign out/i });
    await logoutButton.click({ force: true });
    
    // In test environment, logout clears localStorage completely, so it redirects to onboarding
    // In production, it would redirect to /auth since account exists in database
    await page.waitForURL(/\/auth\/onboarding/);

    // Should show onboarding page
    await page.waitForTimeout(3000);
    await expect(page.getByText('Welcome to SizeWise')).toBeVisible();
  });

  test('should clear authentication state on logout', async ({ page }) => {
    // Navigate to test-pill page
    await page.goto('http://localhost:58194/test-pill');
    await page.waitForTimeout(1000);
    
    // Expand pill navigation and logout
    const nav = page.getByTestId('pill-navigation');
    await nav.click();
    await page.waitForTimeout(1000);
    const logoutButton = page.getByRole('button', { name: /sign out/i });
    await logoutButton.click({ force: true });
    
    // Wait for redirect to onboarding (test environment behavior)
    await page.waitForURL(/\/auth\/onboarding/);
    await page.waitForTimeout(3000);

    // Try to access dashboard directly (should redirect back to onboarding)
    await page.goto('http://localhost:58194/dashboard');
    await page.waitForTimeout(3000);

    // Should be redirected back to onboarding page
    await expect(page).toHaveURL(/\/auth\/onboarding/);

    // Should show onboarding page
    await expect(page.getByText('Welcome to SizeWise')).toBeVisible();
  });

  test('should be able to login again after logout', async ({ page }) => {
    // Navigate to test-pill page and logout
    await page.goto('http://localhost:58194/test-pill');
    await page.waitForTimeout(1000);
    
    const nav = page.getByTestId('pill-navigation');
    await nav.click();
    await page.waitForTimeout(1000);
    const logoutButton = page.getByRole('button', { name: /sign out/i });
    await logoutButton.click({ force: true });
    
    // Wait for redirect to onboarding (test environment behavior)
    await page.waitForURL(/\/auth\/onboarding/);
    await page.waitForTimeout(3000);

    // Create new account (since logout cleared localStorage in test environment)
    await page.locator('input[data-testid="onboard-pin"]').fill('123456');
    await page.locator('input[data-testid="onboard-pin-confirm"]').fill('123456');
    await page.locator('button[data-testid="onboard-submit"]').click();
    
    // Should redirect to dashboard
    await page.waitForURL(/\/dashboard\/?$/);
    await page.waitForTimeout(3000);
    
    // Should be authenticated again
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  test('should maintain pill navigation functionality after logout/login cycle', async ({ page }) => {
    // Complete logout/login cycle
    await page.goto('http://localhost:58194/test-pill');
    await page.waitForTimeout(1000);
    
    // Logout
    const nav = page.getByTestId('pill-navigation');
    await nav.click();
    await page.waitForTimeout(1000);
    const logoutButton = page.getByRole('button', { name: /sign out/i });
    await logoutButton.click({ force: true });
    await page.waitForURL(/\/auth\/onboarding/);
    await page.waitForTimeout(3000);

    // Create new account again (test environment behavior)
    await page.locator('input[data-testid="onboard-pin"]').fill('123456');
    await page.locator('input[data-testid="onboard-pin-confirm"]').fill('123456');
    await page.locator('button[data-testid="onboard-submit"]').click();
    await page.waitForURL(/\/dashboard\/?$/);
    await page.waitForTimeout(3000);
    
    // Go back to test-pill page
    await page.goto('http://localhost:58194/test-pill');
    await page.waitForTimeout(1000);
    
    // Pill navigation should still work
    const navAfterLogin = page.getByTestId('pill-navigation');
    await navAfterLogin.click();
    
    // Should show all navigation items including logout
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('Duct Sizer')).toBeVisible();
    await expect(page.getByText('Settings')).toBeVisible();
    await expect(page.getByText('License')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
  });
});
