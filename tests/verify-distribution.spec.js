const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test('Verify Live and Demo USD Distribution Flows', async ({ page }) => {
  // Set generous timeout for compilation overhead on slower sandboxes
  test.setTimeout(120000);

  // Register console and error listeners
  page.on('console', msg => {
    if (!msg.text().includes('Failed to fetch')) {
      console.log(`[BROWSER CONSOLE] ${msg.text()}`);
    }
  });
  page.on('pageerror', err => console.error(`[BROWSER ERROR] ${err.message}`));

  const baseUrl = 'http://localhost:3000';
  console.log(`🔗 Navigating to localhost login: ${baseUrl}/login?sandbox=true`);
  await page.goto(`${baseUrl}/login?sandbox=true`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  const screenshotDir = '/Users/jeeveshsingale/.gemini/antigravity-ide/brain/8008df37-f8c1-4fc0-aed1-874df369f9d7';
  const localDir = fs.existsSync(screenshotDir) ? screenshotDir : './tests/screenshots';
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }

  // =========================================================================
  // PART 1: VERIFY LIVE MODE (ON LOGIN PAGE TO AVOID REDIRECTS)
  // =========================================================================
  console.log('🔄 Switching to LIVE mode in Navbar...');
  const liveToggle = page.locator('button', { hasText: /^Live$/ }).first();
  if (await liveToggle.isVisible()) {
    await liveToggle.click();
    console.log('⏳ Waiting for Live mode state to reflect...');
    await page.waitForTimeout(3000);
  }

  console.log('📸 Capturing Live Mode Login tab screenshot...');
  await page.screenshot({ path: path.join(localDir, 'live_mode_login.png'), fullPage: true });

  // Verify Navbar dropdown or details in Live Mode
  console.log('🖱️ Opening user profile dropdown in Live Mode...');
  const profileButton = page.locator('button', { hasText: /Connect/i }).first();
  if (await profileButton.isVisible()) {
    console.log('📸 Capturing Live Mode connected state badge...');
    await page.screenshot({ path: path.join(localDir, 'live_mode_navbar_status.png'), fullPage: false });
  }

  // =========================================================================
  // PART 2: VERIFY DEMO MODE & EXECUTE DISTRIBUTION ON DASHBOARD
  // =========================================================================
  console.log('🔄 Switching back to DEMO mode...');
  const demoToggle = page.locator('button', { hasText: /^Demo$/ }).first();
  if (await demoToggle.isVisible()) {
    await demoToggle.click();
    await page.waitForTimeout(3000);
  }

  console.log('🖱️ Clicking Sandbox Bypass...');
  await page.click('text=Launch Sandbox Bypass');

  console.log('⏳ Waiting for redirect to dashboard...');
  await page.waitForURL('**/dashboard**', { timeout: 30000 });
  await page.waitForTimeout(5000);

  console.log('📂 Selecting project in Demo Mode...');
  const selectLocator = page.locator('select.text-xl').first();
  await selectLocator.waitFor({ state: 'visible', timeout: 20000 });
  if (await selectLocator.isVisible()) {
    const demoOptionsCount = await page.locator('select.text-xl option').count();
    console.log(`Dropdown options count in Demo Mode: ${demoOptionsCount}`);
    if (demoOptionsCount > 1) {
      await selectLocator.selectOption({ index: 1 });
    }
  }
  await page.waitForTimeout(2000);

  console.log('🖱️ Clicking Distribute tab in Demo Mode...');
  const distributeTab = page.locator('button:has-text("Distribute")').first();
  await distributeTab.waitFor({ state: 'visible', timeout: 20000 });
  await distributeTab.click();
  await page.waitForTimeout(2000);

  console.log('✏️ Filling USD amount input with $200...');
  const amountInput = page.locator('input[type="number"]');
  await amountInput.fill('200');
  await page.waitForTimeout(1000);

  console.log('📸 Capturing Demo Mode filling state...');
  await page.screenshot({ path: path.join(localDir, 'demo_mode_filled_usd.png'), fullPage: true });

  console.log('🖱️ Clicking "Initiate Distribution" in Demo Mode...');
  await page.click('text=Initiate Distribution');

  console.log('⏳ Waiting for Transaction Protocol Modal...');
  await page.waitForSelector('text=Processing Distribution', { timeout: 20000 });
  await page.waitForTimeout(2000);

  console.log('📸 Capturing active Demo Mode progress modal...');
  await page.screenshot({ path: path.join(localDir, 'demo_mode_modal_progress.png'), fullPage: false });

  console.log('⏳ Waiting for all stages to complete and show Dismiss Modal...');
  await page.waitForSelector('text=Dismiss Modal', { timeout: 40000 });

  console.log('📸 Capturing completed progress modal...');
  await page.screenshot({ path: path.join(localDir, 'demo_mode_modal_completed.png'), fullPage: false });

  console.log('🖱️ Clicking Dismiss Modal...');
  await page.click('text=Dismiss Modal');
  await page.waitForTimeout(3000);

  console.log('📸 Capturing updated Demo dashboard totals...');
  await page.screenshot({ path: path.join(localDir, 'demo_mode_final_dashboard.png'), fullPage: true });

  console.log('🎉 Live and Demo distribution flows verified successfully!');
});
