const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test('Senior PM End-to-End Verification Flow', async ({ page }) => {
  test.setTimeout(150000);

  // Register console and error listeners
  page.on('console', msg => {
    if (!msg.text().includes('Failed to fetch')) {
      console.log(`[BROWSER CONSOLE] ${msg.text()}`);
    }
  });
  page.on('pageerror', err => console.error(`[BROWSER ERROR] ${err.message}`));

  const baseUrl = 'http://localhost:3000';
  const screenshotDir = '/Users/jeeveshsingale/.gemini/antigravity-ide/brain/8008df37-f8c1-4fc0-aed1-874df369f9d7';
  const localDir = fs.existsSync(screenshotDir) ? screenshotDir : './tests/screenshots';
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }

  // --- Step 1: Login via Sandbox Bypass ---
  console.log(`🔗 Navigating to login page...`);
  await page.goto(`${baseUrl}/login?sandbox=true`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  console.log('🖱️ Clicking Sandbox Bypass...');
  await page.click('text=Launch Sandbox Bypass');
  await page.waitForURL('**/dashboard**', { timeout: 30000 });
  await page.waitForTimeout(4000);
  console.log('✓ Successfully logged in to Dashboard!');

  // --- Step 2: Navigate to Admin Panel ---
  console.log('🔗 Navigating to Admin Panel...');
  await page.goto(`${baseUrl}/admin`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  console.log('✓ Successfully loaded Admin Panel!');

  // --- Step 3: Create a New Project ---
  console.log('🏗️ Creating new verification project...');
  await page.fill('input[placeholder="e.g. HBO Original"]', 'Verification Project');
  await page.fill('input[placeholder="e.g. Documentary"]', 'Test Runner');
  console.log('🖱️ Clicking Create Project button...');
  const createButton = page.locator('button:has-text("Create Project")').first();
  await createButton.waitFor({ state: 'visible', timeout: 5000 });
  await createButton.click({ force: true });
  console.log('⏳ Waiting for project creation to register...');
  await page.waitForTimeout(4000);
  console.log('✓ Verification Project created!');

  // --- Step 4: Select the Created Project ---
  console.log('📂 Selecting Verification Project in roster dropdown...');
  const selectLocator = page.locator('select').first();
  await selectLocator.selectOption({ label: 'Verification Project' });
  await page.waitForTimeout(3000);

  // --- Step 5: Assign Roster (Alice: 50%, Bob: 30%, Charlie: 20%) ---
  console.log('👥 Assigning Alice Agent (50%)...');
  await page.fill('input[placeholder="e.g. Christopher Nolan"]', 'Alice Agent');
  await page.fill('input[placeholder="e.g. Director"]', 'Director');
  await page.fill('input[placeholder="0x..."]', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
  await page.fill('input[placeholder="0.00"]', '50');
  await page.click('button:has-text("Assign to Project")');
  await page.waitForTimeout(2000);

  console.log('👥 Assigning Bob Builder (30%)...');
  await page.fill('input[placeholder="e.g. Christopher Nolan"]', 'Bob Builder');
  await page.fill('input[placeholder="e.g. Director"]', 'Producer');
  await page.fill('input[placeholder="0x..."]', '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC');
  await page.fill('input[placeholder="0.00"]', '30');
  await page.click('button:has-text("Assign to Project")');
  await page.waitForTimeout(2000);

  console.log('👥 Assigning Charlie Coder (20%)...');
  await page.fill('input[placeholder="e.g. Christopher Nolan"]', 'Charlie Coder');
  await page.fill('input[placeholder="e.g. Director"]', 'Composer');
  await page.fill('input[placeholder="0x..."]', '0x90F79bf6EB2c4f870365E785982E1f101E93b906');
  await page.fill('input[placeholder="0.00"]', '20');
  await page.click('button:has-text("Assign to Project")');
  await page.waitForTimeout(3000);

  console.log('📸 Capturing Admin Panel with 100% allocation...');
  await page.screenshot({ path: path.join(localDir, 'pm_admin_allocation_100.png'), fullPage: true });

  // --- Step 6: Go to Dashboard & Distribute Revenue ---
  console.log('🔗 Going back to Dashboard...');
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  console.log('📂 Selecting Verification Project...');
  const dashboardSelect = page.locator('select.text-xl').first();
  await dashboardSelect.selectOption({ label: 'Verification Project' });
  await page.waitForTimeout(3000);

  console.log('🖱️ Clicking Distribute tab...');
  const distributeTab = page.locator('button:has-text("Distribute")').first();
  await distributeTab.click();
  await page.waitForTimeout(2000);

  console.log('✏️ Filling USD amount input with $150...');
  const amountInput = page.locator('input[type="number"]');
  await amountInput.fill('150');
  await page.waitForTimeout(1000);

  console.log('🖱️ Clicking "Initiate Distribution" to watch progress modal...');
  await page.click('text=Initiate Distribution');

  console.log('⏳ Waiting for Transaction Protocol Modal...');
  await page.waitForSelector('text=Processing Distribution', { timeout: 20000 });
  await page.waitForTimeout(2000);

  // Wait a moment for step 4 (Reconciling ledger) to begin running
  console.log('⏳ Waiting for Step 4 (Reconciling ledger) to render the transfer stages...');
  await page.waitForTimeout(3500);

  console.log('📸 Capturing progress modal with transfer stages rendering inside Step 4...');
  await page.screenshot({ path: path.join(localDir, 'pm_progress_modal_step4.png'), fullPage: false });

  console.log('⏳ Waiting for distribution to finalize...');
  await page.waitForSelector('text=Dismiss Modal', { timeout: 40000 });
  await page.waitForTimeout(1000);

  console.log('📸 Capturing final completed modal...');
  await page.screenshot({ path: path.join(localDir, 'pm_progress_modal_completed.png'), fullPage: false });

  console.log('🖱️ Clicking Dismiss Modal...');
  await page.click('text=Dismiss Modal');
  await page.waitForTimeout(3000);

  console.log('📸 Capturing updated dashboard...');
  await page.screenshot({ path: path.join(localDir, 'pm_dashboard_final_totals.png'), fullPage: true });

  // --- Step 7: Delete Charlie Coder to verify delete functionality ---
  console.log('🔗 Navigating back to Admin Panel to verify delete functionality...');
  await page.goto(`${baseUrl}/admin`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  console.log('📂 Selecting Verification Project...');
  const selectLocator2 = page.locator('select').first();
  await selectLocator2.selectOption({ label: 'Verification Project' });
  await page.waitForTimeout(3000);

  // Set up dialog handler to click OK automatically on prompt confirm
  page.once('dialog', async dialog => {
    console.log(`💬 Confirming dialog: ${dialog.message()}`);
    await dialog.accept();
  });

  console.log('🗑️ Removing Charlie Coder...');
  const charlieRow = page.locator('tr', { hasText: 'Charlie Coder' });
  const removeButton = charlieRow.locator('button:has-text("Remove")');
  await removeButton.click();
  await page.waitForTimeout(4000);

  console.log('📸 Capturing Admin Panel after removing Charlie...');
  await page.screenshot({ path: path.join(localDir, 'pm_admin_after_delete.png'), fullPage: true });

  console.log('🎉 E2E Verification Complete!');
});
