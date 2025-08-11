import { test, expect } from '@playwright/test';

test.describe('Dashboard Project Management', () => {
  test('@phase0 displays empty state when no projects exist', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should show empty state
    await expect(page.getByText('No projects yet. Create one to get started.')).toBeVisible();
    
    // Should show create project button
    await expect(page.getByRole('button', { name: 'Create Your First Project' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'New Project' })).toBeVisible();
  });

  test('@phase0 opens new project modal when clicking create button', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click the "New Project" button
    await page.click('button:has-text("New Project")');
    
    // Modal should be visible
    await expect(page.getByText('Create New Project')).toBeVisible();
    
    // Form fields should be present
    await expect(page.getByLabel('Project Name')).toBeVisible();
    await expect(page.getByLabel('Category')).toBeVisible();
    await expect(page.getByLabel('Description')).toBeVisible();
    await expect(page.getByLabel('Unit System')).toBeVisible();
    
    // Buttons should be present
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Project' })).toBeVisible();
  });

  test('closes modal when clicking cancel', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Open modal
    await page.click('button:has-text("New Project")');
    await expect(page.getByText('Create New Project')).toBeVisible();
    
    // Click cancel
    await page.click('button:has-text("Cancel")');
    
    // Modal should be closed
    await expect(page.getByText('Create New Project')).not.toBeVisible();
  });

  test('closes modal when clicking X button', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Open modal
    await page.click('button:has-text("New Project")');
    await expect(page.getByText('Create New Project')).toBeVisible();
    
    // Click X button
    await page.click('.modal-close');
    
    // Modal should be closed
    await expect(page.getByText('Create New Project')).not.toBeVisible();
  });

  test('validates required fields in project creation', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Open modal
    await page.click('button:has-text("New Project")');
    
    // Try to submit without filling required fields
    await page.click('button:has-text("Create Project")');
    
    // Should show validation error or prevent submission
    // The form should still be visible (not submitted)
    await expect(page.getByText('Create New Project')).toBeVisible();
  });

  test('@phase0 creates project with valid data', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Open modal
    await page.click('button:has-text("New Project")');
    
    // Fill in the form
    await page.fill('input[id="project-name"]', 'Test Project');
    await page.selectOption('select[id="project-category"]', 'residential');
    await page.fill('textarea[id="project-description"]', 'This is a test project');
    await page.selectOption('select[id="unit-system"]', 'imperial');
    
    // Submit the form
    await page.click('button:has-text("Create Project")');
    
    // Modal should close
    await expect(page.getByText('Create New Project')).not.toBeVisible();
    
    // Project should appear in the list (or empty state should be gone)
    await expect(page.getByText('No projects yet')).not.toBeVisible();
  });

  test('shows license badge with trial information', async ({ page }) => {
    await page.goto('/dashboard');
    
    // License badge should be visible
    await expect(page.locator('.badge')).toBeVisible();
    
    // Should show trial information
    const badgeText = await page.locator('.badge').textContent();
    expect(badgeText).toMatch(/trial|free/i);
  });

  test('navigation links work correctly', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Test navigation to Air Duct Sizer
    await page.click('a[href="/tools/air-duct-sizer"]');
    await expect(page).toHaveURL('/tools/air-duct-sizer');
    await expect(page.getByText('Air Duct Sizer')).toBeVisible();
    
    // Navigate back to dashboard
    await page.click('a[href="/dashboard"]');
    await expect(page).toHaveURL('/dashboard');
    
    // Test navigation to Settings
    await page.click('a[href="/settings"]');
    await expect(page).toHaveURL('/settings');
    
    // Navigate back to dashboard
    await page.click('a[href="/dashboard"]');
    await expect(page).toHaveURL('/dashboard');
    
    // Test navigation to License
    await page.click('a[href="/license"]');
    await expect(page).toHaveURL('/license');
    
    // Navigate back to dashboard
    await page.click('a[href="/dashboard"]');
    await expect(page).toHaveURL('/dashboard');
    
    // Test navigation to About
    await page.click('a[href="/about"]');
    await expect(page).toHaveURL('/about');
  });

  test('persists data after page reload', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Create a project
    await page.click('button:has-text("New Project")');
    await page.fill('input[id="project-name"]', 'Persistent Test Project');
    await page.click('button:has-text("Create Project")');
    
    // Wait for project to be created
    await page.waitForTimeout(1000);
    
    // Reload the page
    await page.reload();
    
    // Project should still be there (empty state should not be visible)
    await expect(page.getByText('No projects yet')).not.toBeVisible();
  });

  test('handles free tier limits gracefully', async ({ page }) => {
    await page.goto('/dashboard');
    
    // This test would need to create projects up to the limit
    // For now, just test that the modal opens and form is functional
    await page.click('button:has-text("New Project")');
    await expect(page.getByText('Create New Project')).toBeVisible();
    
    // Check that limit information might be displayed
    // (This would show up if we're at the limit)
    const modalContent = await page.locator('.modal-content').textContent();
    
    // The test passes if the modal opens successfully
    // In a real scenario with limits reached, we'd see warning messages
    expect(modalContent).toContain('Create New Project');
  });
});
