const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test('Verify Vercel Production Deployment', async ({ page }) => {
  // Set long timeout for E2E flow
  test.setTimeout(60000);

  const url = 'https://web3-freedom-upgrade.vercel.app/login?sandbox=true';
  console.log(`🔗 Navigating to login page: ${url}`);
  await page.goto(url);

  console.log('⏳ Waiting for Sandbox Bypass button...');
  await page.waitForSelector('text=Launch Sandbox Bypass');

  console.log('🖱️ Clicking Sandbox Bypass...');
  await page.click('text=Launch Sandbox Bypass');

  console.log('⏳ Waiting for redirect to dashboard...');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  
  console.log('⏳ Waiting 10 seconds for Privy hydration and database loading...');
  await page.waitForTimeout(10000);

  const screenshotDir = '/Users/jeeveshsingale/.gemini/antigravity-ide/brain/a109dc85-e33e-4ce8-b8a0-33f95c93a317';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('📸 Saving overview screenshot...');
  await page.screenshot({ path: path.join(screenshotDir, 'dashboard_overview_live.png'), fullPage: true });

  console.log('🖱️ Clicking "Rights Holders" tab...');
  // Let's use a robust locator for the Rights Holders button/tab
  const holdersTab = page.locator('button', { hasText: 'Rights Holders' }).first();
  await holdersTab.click();
  
  console.log('⏳ Waiting 3 seconds for tab content to render...');
  await page.waitForTimeout(3000);

  console.log('📸 Saving holders screenshot...');
  await page.screenshot({ path: path.join(screenshotDir, 'dashboard_holders_live.png'), fullPage: true });

  console.log('🎉 Verification completed successfully!');
});
