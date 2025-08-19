import { test, expect } from '@playwright/test';

test.describe('PWA Offline Functionality', () => {
  test('@phase0 app loads and works offline after service worker registration', async ({ page, context }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Wait for the page to load completely
    await expect(page.getByText('Dashboard')).toBeVisible();
    
    // Wait for service worker to register
    await page.waitForFunction(() => {
      return navigator.serviceWorker.ready;
    });
    
    // Wait a bit more for SW to cache resources
    await page.waitForTimeout(2000);
    
    // Go offline
    await context.setOffline(true);
    
    // Reload the page
    await page.reload();
    
    // Should still work offline
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('SizeWise')).toBeVisible();
    
    // License badge should be visible
    await expect(page.locator('.badge')).toBeVisible();
  });

  test('@phase0 navigation works offline', async ({ page, context }) => {
    // Load the app online first
    await page.goto('/dashboard');
    await expect(page.getByText('Dashboard')).toBeVisible();
    
    // Wait for service worker
    await page.waitForFunction(() => navigator.serviceWorker.ready);
    await page.waitForTimeout(1000);
    
    // Go offline
    await context.setOffline(true);
    
    // Test navigation to different pages
    await page.click('a[href="/tools/duct-sizer"]');
    await expect(page).toHaveURL('/tools/duct-sizer');
    await expect(page.getByText('Duct Sizer')).toBeVisible();
    
    // Navigate to settings
    await page.click('a[href="/settings"]');
    await expect(page).toHaveURL('/settings');
    await expect(page.getByText('Settings')).toBeVisible();
    
    // Navigate to license
    await page.click('a[href="/license"]');
    await expect(page).toHaveURL('/license');
    await expect(page.getByText('License')).toBeVisible();
    
    // Navigate back to dashboard
    await page.click('a[href="/dashboard"]');
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  test('@phase0 PWA manifest is accessible', async ({ page }) => {
    // Check that manifest is accessible
    const response = await page.request.get('/manifest.webmanifest');
    expect(response.status()).toBe(200);
    
    const manifest = await response.json();
    expect(manifest.name).toBe('SizeWise');
    expect(manifest.short_name).toBe('SizeWise');
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
  });

  test('@phase0 service worker is registered', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check that service worker is registered
    const swRegistered = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    expect(swRegistered).toBe(true);
    
    // Wait for service worker to be ready
    await page.waitForFunction(() => navigator.serviceWorker.ready);
    
    const swReady = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      return registration !== null;
    });
    expect(swReady).toBe(true);
  });

  test('@phase0 app shows install prompt behavior', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check that the app is installable (PWA criteria met)
    // Note: Actual install prompt testing requires special browser flags
    // This test just verifies the basic PWA setup
    
    const hasManifest = await page.evaluate(() => {
      const manifestLink = document.querySelector('link[rel="manifest"]');
      return manifestLink !== null;
    });
    expect(hasManifest).toBe(true);
    
    const hasServiceWorker = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    expect(hasServiceWorker).toBe(true);
  });
});
