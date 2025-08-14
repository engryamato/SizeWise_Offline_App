import { test, expect } from '@playwright/test';

test.describe('Pill Navigation @phase0', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a page first, then clear data
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Complete authentication flow first
    await page.goto('/auth/onboarding');
    await page.waitForTimeout(2000);

    // Fill in onboarding form
    await page.locator('input[data-testid="onboard-pin"]').fill('123456');
    await page.locator('input[data-testid="onboard-pin-confirm"]').fill('123456');
    await page.locator('button[data-testid="onboard-submit"]').click();

    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard\/?$/);
    await page.waitForTimeout(3000); // Wait for dashboard to load

    // Now navigate to test page
    await page.goto('/test-pill');
    await page.waitForTimeout(1000);
  });

  test('should render pill navigation in collapsed state by default', async ({ page }) => {
    const nav = page.getByTestId('pill-navigation');
    
    await expect(nav).toBeVisible();
    await expect(nav).toHaveAttribute('aria-expanded', 'false');
    await expect(nav).toHaveClass(/collapsed/);
  });

  test('should expand when clicked', async ({ page }) => {
    const nav = page.getByTestId('pill-navigation');
    
    // Initial state should be collapsed
    await expect(nav).toHaveAttribute('aria-expanded', 'false');
    
    // Click to expand
    await nav.click();
    
    // Should be expanded
    await expect(nav).toHaveAttribute('aria-expanded', 'true');
    await expect(nav).not.toHaveClass(/collapsed/);
    
    // Navigation links should be visible
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('Tools')).toBeVisible();
    await expect(page.getByText('Settings')).toBeVisible();
    await expect(page.getByText('License')).toBeVisible();
  });

  test('should collapse when clicked again', async ({ page }) => {
    const nav = page.getByTestId('pill-navigation');
    
    // Expand first
    await nav.click();
    await expect(nav).toHaveAttribute('aria-expanded', 'true');
    
    // Click again to collapse
    await nav.click();
    await expect(nav).toHaveAttribute('aria-expanded', 'false');
    await expect(nav).toHaveClass(/collapsed/);
  });

  test('should show smooth expand/collapse animation', async ({ page }) => {
    const nav = page.getByTestId('pill-navigation');
    
    // Get initial width (collapsed)
    const collapsedBox = await nav.boundingBox();
    expect(collapsedBox).toBeTruthy();
    const collapsedWidth = collapsedBox!.width;
    
    // Expand
    await nav.click();
    await page.waitForTimeout(100); // Wait for animation to start
    
    // Get expanded width
    await expect(nav).toHaveAttribute('aria-expanded', 'true');
    const expandedBox = await nav.boundingBox();
    expect(expandedBox).toBeTruthy();
    const expandedWidth = expandedBox!.width;
    
    // Expanded should be wider than collapsed
    expect(expandedWidth).toBeGreaterThan(collapsedWidth);
    
    // Collapse
    await nav.click();
    await page.waitForTimeout(100); // Wait for animation to start
    
    // Should return to collapsed width
    await expect(nav).toHaveAttribute('aria-expanded', 'false');
    const finalBox = await nav.boundingBox();
    expect(finalBox).toBeTruthy();
    expect(finalBox!.width).toBeCloseTo(collapsedWidth, 5);
  });

  test('should highlight active navigation item', async ({ page }) => {
    const nav = page.getByTestId('pill-navigation');
    
    // Expand navigation
    await nav.click();
    
    // Dashboard should be active (current page)
    const dashboardLink = page.getByText('Dashboard');
    await expect(dashboardLink).toHaveClass(/active/);
    await expect(dashboardLink).toHaveAttribute('aria-current', 'page');
    
    // Other links should not be active
    const settingsLink = page.getByText('Settings');
    await expect(settingsLink).not.toHaveClass(/active/);
    await expect(settingsLink).not.toHaveAttribute('aria-current');
  });

  test('should navigate to different pages when links are clicked', async ({ page }) => {
    const nav = page.getByTestId('pill-navigation');
    
    // Expand navigation
    await nav.click();
    
    // Click on Settings link
    await page.getByText('Settings').click();
    
    // Should navigate to settings page
    await expect(page).toHaveURL(/\/settings\/?$/);

    // Go back to test page
    await page.goto('/test-pill');
    
    // Expand navigation again
    await nav.click();
    
    // Click on License link
    await page.getByText('License').click();
    
    // Should navigate to license page
    await expect(page).toHaveURL(/\/license\/?$/);
  });

  test('should be positioned at top-left of viewport', async ({ page }) => {
    const nav = page.getByTestId('pill-navigation');
    const box = await nav.boundingBox();
    
    expect(box).toBeTruthy();
    expect(box!.x).toBeCloseTo(16, 5); // left: 16px
    expect(box!.y).toBeCloseTo(12, 5); // top: 12px
  });

  test('should have glassmorphism styling', async ({ page }) => {
    const nav = page.getByTestId('pill-navigation');
    
    // Check for backdrop-filter (glassmorphism effect)
    const backdropFilter = await nav.evaluate((el) => 
      getComputedStyle(el).backdropFilter
    );
    expect(backdropFilter).toContain('blur');
    
    // Check for rounded corners
    const borderRadius = await nav.evaluate((el) => 
      getComputedStyle(el).borderRadius
    );
    expect(borderRadius).toContain('9999px');
  });

  test('should be responsive on smaller screens', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 400, height: 800 });
    
    const nav = page.getByTestId('pill-navigation');
    await expect(nav).toBeVisible();
    
    // Should still be functional
    await nav.click();
    await expect(nav).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  test('should maintain accessibility attributes', async ({ page }) => {
    const nav = page.getByTestId('pill-navigation');
    
    // Check initial accessibility attributes
    await expect(nav).toHaveAttribute('role', 'banner');
    await expect(nav).toHaveAttribute('aria-label', 'Top navigation');
    await expect(nav).toHaveAttribute('aria-expanded', 'false');
    
    // Expand and check updated attributes
    await nav.click();
    await expect(nav).toHaveAttribute('aria-expanded', 'true');
    
    // Check link accessibility
    const dashboardLink = page.getByText('Dashboard');
    await expect(dashboardLink).toHaveAttribute('aria-current', 'page');
  });

  test('should not interfere with page content', async ({ page }) => {
    // Check that page content is visible and not overlapped
    const heroSection = page.locator('.hero');
    await expect(heroSection).toBeVisible();
    
    const heroBox = await heroSection.boundingBox();
    const navBox = await page.getByTestId('pill-navigation').boundingBox();
    
    expect(heroBox).toBeTruthy();
    expect(navBox).toBeTruthy();
    
    // Hero section should be below the navigation
    expect(heroBox!.y).toBeGreaterThan(navBox!.y + navBox!.height);
  });
});
