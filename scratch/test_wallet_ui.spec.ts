import { test, expect } from '@playwright/test';

test.describe('Wallet Connection Flow', () => {
  test('should open wallet dropdown and show options', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Find the wallet button (it has the wallet icon)
    const walletButton = page.locator('button[title="Wallet"]');
    await expect(walletButton).toBeVisible();

    // Click to open dropdown
    await walletButton.click();

    // Check if "Select Wallet" header is visible
    await expect(page.getByText('Select Wallet')).toBeVisible();

    // Check if MetaMask option is visible
    await expect(page.getByText('MetaMask')).toBeVisible();
    await expect(page.getByText('Coinbase Wallet')).toBeVisible();
  });

  test('should show demo mode accounts when demo mode is active', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    
    // Toggle demo mode if not active (assuming there's a toggle in Navbar)
    const demoToggle = page.locator('button:has-text("DEMO"), button:has-text("LIVE")');
    const toggleText = await demoToggle.innerText();
    
    if (toggleText.includes('LIVE')) {
      await demoToggle.click();
    }

    // Open wallet dropdown
    await page.locator('button[title="Wallet"]').click();

    // Check for Hardhat accounts
    await expect(page.getByText('Hardhat Test Accounts')).toBeVisible();
    await expect(page.getByText('Account 1 (Admin)')).toBeVisible();
  });
});
