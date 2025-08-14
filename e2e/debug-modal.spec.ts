import { test, expect } from '@playwright/test';

test.describe('Debug Modal Implementation', () => {
  test('debug auth page content', async ({ page }) => {
    // Clear any existing data
    await page.goto('http://localhost:58194');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // First create an account through onboarding
    await page.goto('http://localhost:58194/auth/onboarding');
    await page.waitForTimeout(2000);
    
    // Fill in onboarding form
    await page.locator('input[data-testid="onboard-pin"]').fill('123456');
    await page.locator('input[data-testid="onboard-pin-confirm"]').fill('123456');
    await page.locator('button[data-testid="onboard-submit"]').click();
    
    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard\/?$/);
    await page.waitForTimeout(3000);
    
    // Now go to auth page
    await page.goto('http://localhost:58194/auth');
    await page.waitForTimeout(5000);
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/debug-auth-page.png', fullPage: true });
    
    // Check what's actually on the page
    const pageContent = await page.content();
    console.log('Page HTML length:', pageContent.length);
    
    // Check for any buttons
    const buttons = await page.locator('button').all();
    console.log('Number of buttons found:', buttons.length);
    
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      const isVisible = await buttons[i].isVisible();
      console.log(`Button[${i}] text: "${text}", visible: ${isVisible}`);
    }
    
    // Check for specific text
    const enterPinText = await page.getByText('Enter PIN').isVisible().catch(() => false);
    console.log('Enter PIN text visible:', enterPinText);
    
    // Check for h1 elements
    const h1Elements = await page.locator('h1').all();
    console.log('Number of h1 elements found:', h1Elements.length);
    
    for (let i = 0; i < h1Elements.length; i++) {
      const text = await h1Elements[i].textContent();
      console.log(`h1[${i}] text:`, text);
    }
    
    // Check body text
    const bodyText = await page.locator('body').textContent();
    console.log('Body text (first 500 chars):', bodyText?.substring(0, 500));
    
    expect(page.url()).toMatch(/\/auth/);
  });
});
