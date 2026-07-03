const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  console.log('🚀 Starting Playwright verification script...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1470, height: 800 }
  });
  const page = await context.newPage();

  const url = 'https://web3-distribution-555jvgq3h-jeeveshs-projects-68cc441e.vercel.app/login?sandbox=true';
  console.log(`🔗 Navigating to login page: ${url}`);
  await page.goto(url);

  console.log('⏳ Waiting for Sandbox Bypass button to appear...');
  await page.waitForSelector('text=Launch Sandbox Bypass');

  console.log('🖱️ Clicking Sandbox Bypass button...');
  await page.click('text=Launch Sandbox Bypass');

  console.log('⏳ Waiting for redirect to /dashboard...');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('✅ Successfully redirected to dashboard!');

  // Wait for page load
  await page.waitForTimeout(3000);

  const screenshotDir = '/Users/jeeveshsingale/.gemini/antigravity-ide/brain/a109dc85-e33e-4ce8-b8a0-33f95c93a317';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const overviewPath = path.join(screenshotDir, 'dashboard_overview_live.png');
  console.log(`📸 Taking dashboard overview screenshot: ${overviewPath}`);
  await page.screenshot({ path: overviewPath, fullPage: true });

  console.log('🖱️ Clicking "Rights Holders" tab...');
  // Find Rights Holders tab selector. Let's find button/tab with text "Rights Holders"
  const holdersTab = page.locator('button:has-text("Rights Holders"), div:has-text("Rights Holders")').first();
  await holdersTab.click();
  await page.waitForTimeout(2000);

  const holdersPath = path.join(screenshotDir, 'dashboard_holders_live.png');
  console.log(`📸 Taking dashboard holders tab screenshot: ${holdersPath}`);
  await page.screenshot({ path: holdersPath, fullPage: true });

  await browser.close();
  console.log('🏁 Playwright verification completed successfully!');
}

run().catch(err => {
  console.error('❌ Playwright script failed:', err);
  process.exit(1);
});
