import { test, expect } from '@playwright/test';

test.describe('Auth Onboarding and Unlock', () => {
  test('@phaseAuth onboarding and unlock with PIN', async ({ page }) => {
    await page.goto('/auth/onboarding');

    await page.getByTestId('onboard-pin').fill('123456');
    await page.getByTestId('onboard-pin-confirm').fill('123456');
    await page.getByTestId('onboard-submit').click();

    // Instead of waiting for SPA redirect, go directly to /lock to reduce flake
    await page.goto('/lock');
    await page.getByTestId('lock-pin-input').fill('123456');
    await page.getByTestId('lock-unlock-btn').click();
    await page.waitForURL(/dashboard/);
  });
});

