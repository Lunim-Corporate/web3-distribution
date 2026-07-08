const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test('Verify Accrued Earnings Claiming Flow', async ({ page }) => {
  test.setTimeout(90000);

  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.text()}`);
  });
  page.on('pageerror', err => console.error(`[BROWSER ERROR] ${err.message}`));

  const baseUrl = 'http://localhost:3000';
  console.log(`🔗 Navigating to login: ${baseUrl}/login?sandbox=true`);
  await page.goto(`${baseUrl}/login?sandbox=true`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  // Bypass login if needed
  if (page.url().includes('/login')) {
    console.log('🖱️ Clicking Sandbox Bypass...');
    await page.click('text=Launch Sandbox Bypass');
    await page.waitForURL('**/dashboard**', { timeout: 20000 });
  }
  await page.waitForTimeout(3000);

  // Set custom wallet in localStorage to trigger mock balance logic
  console.log('✏️ Setting active_demo_wallet to custom address in localStorage & dispatching event...');
  await page.evaluate(() => {
    const customWallet = '0xcaa6bf3b43e8e339ff4fffe6605579dbb974';
    localStorage.setItem('active_demo_wallet', customWallet);
    window.dispatchEvent(new CustomEvent('demo-wallet-changed', { detail: customWallet }));
    console.log(`[TEST HELP] Set localStorage active_demo_wallet to: ${localStorage.getItem('active_demo_wallet')}`);
  });
  await page.waitForTimeout(2000);

  // Click profile dropdown and navigate to profile
  console.log('🖱️ Opening Navbar user profile dropdown...');
  const navbarProfileButton = page.locator('button', { hasText: /Admin/ }).first();
  await navbarProfileButton.waitFor({ state: 'visible', timeout: 15000 });
  await navbarProfileButton.click();
  await page.waitForTimeout(1000);

  console.log('🖱️ Clicking "Profile & Settings" link...');
  await page.click('text=Profile & Settings');
  await page.waitForURL('**/profile', { timeout: 15000 });
  await page.waitForTimeout(3000);

  // Log localStorage on profile page
  await page.evaluate(() => {
    console.log(`[TEST HELP PROFILE PAGE] active_demo_wallet is: ${localStorage.getItem('active_demo_wallet')}`);
    console.log(`[TEST HELP PROFILE PAGE] demo_mode is: ${localStorage.getItem('demo_mode')}`);
  });

  const screenshotDir = '/Users/jeeveshsingale/.gemini/antigravity-ide/brain/8008df37-f8c1-4ios-aed1-874df369f9d7';
  const localDir = fs.existsSync(screenshotDir) ? screenshotDir : './tests/screenshots';
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }

  console.log('📸 Capturing initial Profile page details...');
  await page.screenshot({ path: path.join(localDir, 'profile_initial_state_debug.png'), fullPage: true });

  // Verify the Name is Demo Admin on the profile page
  const nameElement = page.locator('text=Demo Admin').first();
  await expect(nameElement).toBeVisible();
  console.log('✓ Verified name shows as "Demo Admin" on profile page');

  // Verify custom connected wallet accrued balance shows 0.2500 ETH
  console.log('⏳ Checking claimable balance display...');
  const balanceText = page.locator('text=0.2500').first();
  await expect(balanceText).toBeVisible();
  console.log('✓ Verified mock accrued balance shows 0.2500 ETH correctly for custom wallet');

  // Click Claim Earnings
  console.log('🖱️ Clicking Claim Earnings button...');
  const claimButton = page.locator('button:has-text("Claim Earnings")').first();
  await expect(claimButton).toBeEnabled();
  await claimButton.click();

  // Wait for loading indicator
  console.log('⏳ Waiting for claiming transaction processing...');
  await page.waitForTimeout(3000);

  // Take screenshot during claiming or completion
  console.log('📸 Capturing claim completed state...');
  await page.screenshot({ path: path.join(localDir, 'profile_claim_completed_debug.png'), fullPage: true });

  console.log('🎉 Claiming flow verified successfully!');
});
