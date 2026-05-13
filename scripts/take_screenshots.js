const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  console.log('Navigating to login...');
  await page.goto('http://localhost:3000/login');
  await page.waitForTimeout(2000);

  console.log('Logging in...');
  await page.fill('input[type="email"]', 'tester@moonstone.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("Access Dashboard")');

  console.log('Waiting for dashboard redirect...');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForTimeout(5000); // Wait for data to load

  console.log('Taking overview screenshot...');
  await page.screenshot({ path: path.join(__dirname, 'screenshot-overview.png'), fullPage: true });

  // Click on "Rights Holders" tab
  console.log('Clicking Rights Holders tab...');
  const rightsTab = page.locator('button', { hasText: 'Rights Holders' });
  if (await rightsTab.count() > 0) {
    await rightsTab.click();
    await page.waitForTimeout(2000);
    
    const rhPath = path.join(__dirname, 'screenshot-rights-holders.png');
    await page.screenshot({ path: rhPath, fullPage: true });
    console.log('Saved:', rhPath);

    // Expand the first rights holder profile
    console.log('Expanding a rights holder...');
    const clickableRow = page.locator('.cursor-pointer').first();
    if (await clickableRow.count() > 0) {
      await clickableRow.click();
      await page.waitForTimeout(1000);
      const rhExpandedPath = path.join(__dirname, 'screenshot-rights-holders-expanded.png');
      await page.screenshot({ path: rhExpandedPath, fullPage: true });
      console.log('Saved:', rhExpandedPath);
    }
  }

  // Click Revenue Tab
  console.log('Clicking Revenue tab...');
  const revTab = page.locator('button', { hasText: 'Revenue' });
  if (await revTab.count() > 0) {
    await revTab.click();
    await page.waitForTimeout(2000);
    
    const revPath = path.join(__dirname, 'screenshot-revenue.png');
    await page.screenshot({ path: revPath, fullPage: true });
    console.log('Saved:', revPath);

    // Expand the first transaction
    console.log('Expanding a transaction...');
    const txRow = page.locator('tr.cursor-pointer').first();
    if (await txRow.count() > 0) {
      await txRow.click();
      await page.waitForTimeout(1000);
      const revExpandedPath = path.join(__dirname, 'screenshot-revenue-expanded.png');
      await page.screenshot({ path: revExpandedPath, fullPage: true });
      console.log('Saved:', revExpandedPath);
    }
  }

  await browser.close();
  console.log('Done.');
})();
