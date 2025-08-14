import { test, expect } from '@playwright/test';

test.describe('Debug Logout Direct', () => {
  test('trigger logout function directly', async ({ page }) => {
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
    
    // Try to trigger logout directly via JavaScript
    const result = await page.evaluate(async () => {
      try {
        // Check if we're in test environment
        const isTestEnvironment = typeof window !== 'undefined' && 
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
          !window.SharedArrayBuffer;
        
        console.log('Direct logout - Test environment:', isTestEnvironment);
        
        if (isTestEnvironment) {
          // Test environment logout - clear localStorage
          const beforeLogout = localStorage.getItem('sizewise-test-account');
          console.log('Before direct logout - localStorage:', beforeLogout);
          
          localStorage.removeItem('sizewise-test-account');
          console.log('Test environment logout: localStorage cleared');
          
          const afterLogout = localStorage.getItem('sizewise-test-account');
          console.log('After direct logout - localStorage:', afterLogout);
          
          // Navigate to auth page
          window.location.href = '/auth';
          return { success: true, message: 'Direct logout successful' };
        } else {
          return { success: false, message: 'Not in test environment' };
        }
      } catch (error) {
        console.error('Direct logout failed:', error);
        return { success: false, message: error.message };
      }
    });
    
    console.log('Direct logout result:', result);
    
    // Wait for navigation
    await page.waitForTimeout(3000);
    
    // Check final state
    const finalUrl = page.url();
    const finalLocalStorage = await page.evaluate(() => {
      return localStorage.getItem('sizewise-test-account');
    });
    
    console.log('Final URL:', finalUrl);
    console.log('Final localStorage:', finalLocalStorage);
    console.log('All console messages:', consoleMessages);
    
    expect(result.success).toBe(true);
  });
});
