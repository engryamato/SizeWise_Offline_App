import { test, expect } from '@playwright/test';

test.describe('Morphing Glass Button', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to auth page where the morphing button is located
    await page.goto('/auth?test-morph-button=true');
    await page.waitForTimeout(3000); // Wait for page to load and prevent auto-redirect
  });

  test('should auto-expand panel with appropriate content', async ({ page }) => {
    // Wait for auth state to be determined and panel to auto-expand
    await page.waitForTimeout(4000);

    // Should show either onboarding or sign-in form based on account status
    const hasOnboardingForm = await page.getByText('Create a PIN to protect your projects').isVisible();
    const hasSignInForm = await page.getByText('Unlock to access your projects').isVisible();

    // Should have one of the forms visible
    expect(hasOnboardingForm || hasSignInForm).toBe(true);

    // If onboarding form is visible, check its elements
    if (hasOnboardingForm) {
      await expect(page.getByTestId('onboard-pin')).toBeVisible();
      await expect(page.getByTestId('onboard-pin-confirm')).toBeVisible();
      await expect(page.getByTestId('onboard-submit')).toBeVisible();
    }

    // If sign-in form is visible, check its elements
    if (hasSignInForm) {
      await expect(page.getByTestId('signin-pin-input')).toBeVisible();
      await expect(page.getByTestId('signin-unlock-btn')).toBeVisible();
    }
  });

  test('should expand when clicked', async ({ page }) => {
    // Click the Quick Access button
    const button = page.getByText('Quick Access');
    await button.click();
    
    // Wait for animation to complete
    await page.waitForTimeout(500);
    
    // Check that panel has expanded
    const expandedPanel = page.getByText('Create Account');
    await expect(expandedPanel).toBeVisible();
    
    // Check for other action buttons
    await expect(page.getByText('Sign In')).toBeVisible();
    await expect(page.getByText('View Demo')).toBeVisible();
    
    // Check that close button is visible
    const closeButton = page.getByRole('button', { name: 'Close panel' });
    await expect(closeButton).toBeVisible();
  });

  test('should collapse when close button is clicked', async ({ page }) => {
    // First expand the panel
    const button = page.getByText('Quick Access');
    await button.click();
    await page.waitForTimeout(500);
    
    // Verify it's expanded
    await expect(page.getByText('Create Account')).toBeVisible();
    
    // Click close button
    const closeButton = page.getByRole('button', { name: 'Close panel' });
    await closeButton.click();
    await page.waitForTimeout(500);
    
    // Verify it's collapsed back to button
    await expect(page.getByText('Create Account')).not.toBeVisible();
    await expect(page.getByText('Quick Access')).toBeVisible();
  });

  test('should auto-expand and show onboarding form when no account exists', async ({ page }) => {
    // Wait for the panel to auto-expand and show onboarding form
    await page.waitForTimeout(3000);

    // Check that onboarding form is visible
    await expect(page.getByText('Create Account')).toBeVisible();
    await expect(page.getByText('Create a PIN to protect your projects')).toBeVisible();
    await expect(page.getByTestId('onboard-pin')).toBeVisible();
    await expect(page.getByTestId('onboard-pin-confirm')).toBeVisible();
    await expect(page.getByTestId('onboard-submit')).toBeVisible();
  });

  test('should allow navigation between views', async ({ page }) => {
    // Wait for auto-expansion
    await page.waitForTimeout(3000);

    // Should start with onboarding form
    await expect(page.getByText('Create Account')).toBeVisible();

    // Click back to menu
    const backButton = page.getByRole('button', { name: 'Back to menu' });
    await backButton.click();
    await page.waitForTimeout(500);

    // Should show menu options
    await expect(page.getByText('Quick Access')).toBeVisible();
    await expect(page.getByText('Create Account')).toBeVisible();
    await expect(page.getByText('Sign In')).toBeVisible();
    await expect(page.getByText('View Demo')).toBeVisible();

    // Click Sign In
    const signInButton = page.getByText('Sign In');
    await signInButton.click();
    await page.waitForTimeout(500);

    // Check that sign-in form is visible
    await expect(page.getByText('Unlock to access your projects')).toBeVisible();
    await expect(page.getByTestId('signin-pin-input')).toBeVisible();
    await expect(page.getByTestId('signin-unlock-btn')).toBeVisible();
    await expect(page.getByTestId('signin-bio-btn')).toBeVisible();
  });

  test('should have glassmorphism styling', async ({ page }) => {
    const button = page.getByText('Quick Access');
    const buttonContainer = button.locator('..').locator('..');
    
    // Check for backdrop-filter (glassmorphism effect)
    const backdropFilter = await buttonContainer.evaluate((el) => 
      getComputedStyle(el.querySelector('div')!).backdropFilter
    );
    expect(backdropFilter).toContain('blur');
  });

  test('should be positioned at bottom center of screen', async ({ page }) => {
    const button = page.getByText('Quick Access');
    const buttonContainer = button.locator('..').locator('..');
    const box = await buttonContainer.boundingBox();
    
    expect(box).toBeTruthy();
    
    // Should be near the bottom of the screen
    const viewportSize = page.viewportSize();
    expect(box!.y).toBeGreaterThan(viewportSize!.height * 0.7); // In bottom 30% of screen
    
    // Should be horizontally centered (approximately)
    const centerX = viewportSize!.width / 2;
    const buttonCenterX = box!.x + box!.width / 2;
    expect(Math.abs(buttonCenterX - centerX)).toBeLessThan(50); // Within 50px of center
  });
});
