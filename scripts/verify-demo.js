const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

async function verify() {
  console.log("🔍 Running LUNIM Web3 Production Hardening Verification...\n");
  let passed = true;

  // 1. Check environment variables
  console.log("📡 1. Checking Environment Variables...");
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_PRIVY_APP_ID'
  ];

  requiredEnvVars.forEach(v => {
    if (process.env[v]) {
      console.log(`  ✅ ${v} is configured`);
    } else {
      console.error(`  ❌ ${v} is MISSING`);
      passed = false;
    }
  });

  // 2. Check contract files
  console.log("\n📜 2. Checking Smart Contract Deployment Artifacts...");
  const contractPath = path.join(__dirname, '..', 'src', 'contracts', 'RevenueRights.json');
  if (fs.existsSync(contractPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
      if (data.address && Array.isArray(data.abi)) {
        console.log(`  ✅ RevenueRights.json exists, address: ${data.address}`);
      } else {
        console.error(`  ❌ RevenueRights.json is invalid`);
        passed = false;
      }
    } catch (e) {
      console.error(`  ❌ RevenueRights.json could not be parsed: ${e.message}`);
      passed = false;
    }
  } else {
    console.error(`  ❌ RevenueRights.json does not exist`);
    passed = false;
  }

  // 3. Check database seeding
  console.log("\n🗄️ 3. Checking Database Seed Data...");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const tables = [
        { name: 'projects', desc: 'Projects' },
        { name: 'rights_holders', desc: 'Rights Holders' },
        { name: 'transactions', desc: 'Transactions' },
        { name: 'transaction_splits', desc: 'Transaction Splits' },
        { name: 'activities', desc: 'Dashboard Activities' }
      ];

      for (const t of tables) {
        const { count, error } = await supabase
          .from(t.name)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error(`  ❌ Table '${t.name}' check failed: ${error.message}`);
          passed = false;
        } else {
          console.log(`  ✅ Table '${t.name}' has ${count} records`);
          if (count === 0) {
            console.warn(`    ⚠️ Table '${t.name}' is empty`);
          }
        }
      }
    } catch (e) {
      console.error(`  ❌ Could not connect/query Supabase: ${e.message}`);
      passed = false;
    }
  } else {
    console.error("  ❌ Skipping DB check: Supabase credentials not set");
    passed = false;
  }

  // 4. Output summary
  console.log("\n🏁 Verification Summary:");
  if (passed) {
    console.log("✨ ALL PRODUCTION HARDENING CHECKS PASSED SUCCESSFULLY!");
    process.exit(0);
  } else {
    console.error("❌ SOME PRODUCTION CHECKS FAILED! Review issues above.");
    process.exit(1);
  }
}

verify();
