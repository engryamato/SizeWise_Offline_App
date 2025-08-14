import { test, expect } from '@playwright/test';

test.describe('Auth Debug @phase0', () => {
  test('debug auth page behavior', async ({ page }) => {
    // Capture console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });

    // Go to auth page
    await page.goto('/auth');

    // Wait for page to load and potential redirect
    await page.waitForTimeout(8000);

    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // Check page content
    const title = await page.locator('h1').textContent();
    console.log('Page title:', title);

    const subtitle = await page.locator('p').first().textContent();
    console.log('Page subtitle:', subtitle);

    // Check if PIN form is visible
    const pinForm = page.locator('form');
    const isFormVisible = await pinForm.isVisible().catch(() => false);
    console.log('PIN form visible:', isFormVisible);

    // Check if loading indicator is visible
    const loadingIndicator = page.locator('.animate-pulse');
    const isLoadingVisible = await loadingIndicator.isVisible().catch(() => false);
    console.log('Loading indicator visible:', isLoadingVisible);

    // Print console logs
    console.log('Console logs captured:');
    consoleLogs.forEach(log => console.log('  ', log));

    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/auth-debug.png', fullPage: true });

    // Just assert that we're on some auth-related page
    expect(currentUrl).toMatch(/\/auth/);
  });

  test('debug onboarding page', async ({ page }) => {
    // Capture console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });

    // Go directly to onboarding page
    await page.goto('/auth/onboarding');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Check current URL
    const currentUrl = page.url();
    console.log('Onboarding URL:', currentUrl);

    // Check page content
    const title = await page.locator('h1').textContent();
    console.log('Onboarding title:', title);

    // Check if PIN inputs are visible
    const pinInput = page.locator('input[data-testid="onboard-pin"]');
    const isPinInputVisible = await pinInput.isVisible().catch(() => false);
    console.log('PIN input visible:', isPinInputVisible);

    const confirmPinInput = page.locator('input[data-testid="onboard-pin-confirm"]');
    const isConfirmPinInputVisible = await confirmPinInput.isVisible().catch(() => false);
    console.log('Confirm PIN input visible:', isConfirmPinInputVisible);

    const submitButton = page.locator('button[data-testid="onboard-submit"]');
    const isSubmitButtonVisible = await submitButton.isVisible().catch(() => false);
    console.log('Submit button visible:', isSubmitButtonVisible);

    // Test form submission
    if (isPinInputVisible && isConfirmPinInputVisible && isSubmitButtonVisible) {
      console.log('Testing form submission...');

      // Fill in the form
      await pinInput.fill('123456');
      await confirmPinInput.fill('123456');

      // Click submit
      await submitButton.click();

      // Wait for potential redirect or error
      await page.waitForTimeout(5000);

      // Check final URL
      const finalUrl = page.url();
      console.log('Final URL after submission:', finalUrl);

      // Check for any error messages
      const errorMessage = await page.locator('[role="alert"]').textContent().catch(() => null);
      if (errorMessage) {
        console.log('Error message:', errorMessage);
      }
    }

    // Print console logs
    console.log('Console logs captured:');
    consoleLogs.forEach(log => console.log('  ', log));

    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/onboarding-debug.png', fullPage: true });

    expect(currentUrl).toMatch(/\/auth\/onboarding/);
  });

  test('debug dashboard page after onboarding', async ({ page }) => {
    // Capture console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });

    // Complete onboarding flow
    await page.goto('/auth/onboarding');
    await page.waitForTimeout(2000);

    await page.locator('input[data-testid="onboard-pin"]').fill('123456');
    await page.locator('input[data-testid="onboard-pin-confirm"]').fill('123456');
    await page.locator('button[data-testid="onboard-submit"]').click();

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard\/?$/);
    console.log('Successfully redirected to dashboard');

    // Wait for dashboard to load
    await page.waitForTimeout(5000);

    // Check what's actually on the page
    const pageContent = await page.content();
    console.log('Page HTML length:', pageContent.length);

    // Check for h1 elements
    const h1Elements = await page.locator('h1').all();
    console.log('Number of h1 elements found:', h1Elements.length);

    for (let i = 0; i < h1Elements.length; i++) {
      const text = await h1Elements[i].textContent();
      console.log(`h1[${i}] text:`, text);
    }

    // Check for any text content
    const bodyText = await page.locator('body').textContent();
    console.log('Body text (first 200 chars):', bodyText?.substring(0, 200));

    // Check if loading indicator is still visible
    const loadingIndicator = await page.locator('text=Loading').isVisible().catch(() => false);
    console.log('Loading indicator visible:', loadingIndicator);

    // Print console logs
    console.log('Console logs captured:');
    consoleLogs.forEach(log => console.log('  ', log));

    // Take a screenshot
    await page.screenshot({ path: 'test-results/dashboard-debug.png', fullPage: true });

    expect(page.url()).toMatch(/\/dashboard/);
  });

  test('debug auth state after onboarding', async ({ page }) => {
    // Capture console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });

    // Complete onboarding flow
    await page.goto('/auth/onboarding');
    await page.waitForTimeout(2000);

    await page.locator('input[data-testid="onboard-pin"]').fill('123456');
    await page.locator('input[data-testid="onboard-pin-confirm"]').fill('123456');
    await page.locator('button[data-testid="onboard-submit"]').click();

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard\/?$/);
    await page.waitForTimeout(3000);
    console.log('Onboarding completed, now testing auth state...');

    // Check localStorage
    const testAccount = await page.evaluate(() => {
      return localStorage.getItem('sizewise-test-account');
    });
    console.log('localStorage test account:', testAccount);

    // Now go back to auth page (simulating app restart)
    await page.goto('/auth');

    // Wait for auth state to be determined
    await page.waitForTimeout(5000);

    // Check current URL
    const currentUrl = page.url();
    console.log('Auth page URL after account creation:', currentUrl);

    // Check page content
    const title = await page.locator('h1').textContent();
    console.log('Auth page title:', title);

    const subtitle = await page.locator('p').first().textContent();
    console.log('Auth page subtitle:', subtitle);

    // Check if PIN form is visible
    const pinForm = page.locator('form');
    const isFormVisible = await pinForm.isVisible().catch(() => false);
    console.log('PIN form visible:', isFormVisible);

    // Check for PIN input fields
    const pinInputs = await page.locator('input[type="password"]').count();
    console.log('Number of PIN input fields:', pinInputs);

    // Print console logs
    console.log('Console logs captured:');
    consoleLogs.forEach(log => console.log('  ', log));

    // Take a screenshot
    await page.screenshot({ path: 'test-results/auth-state-debug.png', fullPage: true });

    expect(currentUrl).toMatch(/\/auth/);
  });
});
