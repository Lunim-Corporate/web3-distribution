const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { HDNodeWallet, Mnemonic } = require('ethers');

// Initialize Supabase admin client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Generate deterministic wallet addresses from Hardhat mnemonic
const HARDHAT_MNEMONIC = process.env.HARDHAT_MNEMONIC || 'test test test test test test test test test test test junk';
const mnemonic = Mnemonic.fromPhrase(HARDHAT_MNEMONIC);
const getWallet = (index) => HDNodeWallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${index}`).address;

// ETH price constant (matches src/app/lib/constants.ts)
const ETH_PRICE_USD = 2500;

const seedData = async () => {
  console.log("🌱 Starting database seed...\n");

  // ──────────────────────────────────────────────
  // 1. Clean existing data (order matters for FK constraints)
  // ──────────────────────────────────────────────
  for (const table of ['transaction_splits', 'transactions', 'activities', 'rights_holders', 'projects']) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) console.warn(`  ⚠ Failed to clear ${table}:`, error.message);
  }
  console.log("  ✓ Cleaned existing data\n");

  // ──────────────────────────────────────────────
  // 2. Seed Projects & Rights Holders
  // ──────────────────────────────────────────────
  const projects = [
    {
      name: "Neon Requiem",
      genre: "Sci-Fi Thriller",
      description: "A rogue AI infiltrates a megacity's neural grid, forcing a burned intelligence officer to confront her own manufactured memories.",
      status: "active",
      holders: [
        { full_name: "Aria Voss", role: "Director", percentage: 28 },
        { full_name: "Marcus Delgado", role: "Lead Actor", percentage: 22 },
        { full_name: "Priya Nair", role: "Producer", percentage: 18 },
        { full_name: "Theo Harrington", role: "Music Composer", percentage: 17 },
        { full_name: "Simone Okafor", role: "Screenplay Writer", percentage: 15 }
      ]
    },
    {
      name: "Dust & Dynasty",
      genre: "Historical Drama",
      description: "Three generations of a mining family fight to reclaim stolen land in 1920s Appalachia while a powerful railroad baron closes in.",
      status: "active",
      holders: [
        { full_name: "Felix Drummond", role: "Director", percentage: 25 },
        { full_name: "Yuki Tanaka", role: "Lead Actress", percentage: 20 },
        { full_name: "Camille Renard", role: "Producer", percentage: 18 },
        { full_name: "Olu Adeyemi", role: "Supporting Actor", percentage: 14 },
        { full_name: "Dana Whitfield", role: "Music Composer", percentage: 13 },
        { full_name: "Ravi Pillai", role: "Screenplay Writer", percentage: 10 }
      ]
    },
    {
      name: "Glass Republic",
      genre: "Political Thriller",
      description: "A whistleblower leaks classified files that expose a sitting government's surveillance program, triggering a cross-continental manhunt.",
      status: "active",
      holders: [
        { full_name: "Natasha Verne", role: "Director", percentage: 26 },
        { full_name: "Leon Pacheco", role: "Lead Actor", percentage: 21 },
        { full_name: "Ingrid Solberg", role: "Producer", percentage: 17 },
        { full_name: "Amara Diallo", role: "Co-Producer", percentage: 13 },
        { full_name: "Jin-Ho Park", role: "Music Composer", percentage: 12 },
        { full_name: "Selene Marsh", role: "Screenplay Writer", percentage: 11 }
      ]
    },
    {
      name: "The Salt Coast",
      genre: "Crime Drama",
      description: "A retired coast guard officer in a remote fishing village uncovers a smuggling ring that reaches the highest levels of local government.",
      status: "active",
      holders: [
        { full_name: "Declan Fogarty", role: "Director", percentage: 24 },
        { full_name: "Mara Solis", role: "Lead Actress", percentage: 22 },
        { full_name: "Emeka Osei", role: "Producer", percentage: 17 },
        { full_name: "Hana Bergström", role: "Supporting Actress", percentage: 15 },
        { full_name: "Tobias Frei", role: "Music Composer", percentage: 12 },
        { full_name: "Leila Mousavi", role: "Screenplay Writer", percentage: 10 }
      ]
    },
    {
      name: "Binary Fault",
      genre: "Tech Thriller",
      description: "A pair of rival hackers discover their competing zero-days are pieces of the same weapon, and someone very dangerous wants it complete.",
      status: "active",
      holders: [
        { full_name: "Zara Kimani", role: "Director", percentage: 27 },
        { full_name: "Cole Hartfield", role: "Lead Actor", percentage: 21 },
        { full_name: "Nadia Volkov", role: "Producer", percentage: 16 },
        { full_name: "Bayo Akinwande", role: "Supporting Actor", percentage: 14 },
        { full_name: "Mei-Xing Zhao", role: "Music Composer", percentage: 12 },
        { full_name: "Soren Lindqvist", role: "Screenplay Writer", percentage: 10 }
      ]
    },
  ];

  let accountIndex = 1;
  let totalHoldersInserted = 0;
  const projectRecords = [];

  for (const proj of projects) {
    const { data: projectData, error: projErr } = await supabase
      .from('projects')
      .insert({
        name: proj.name,
        genre: proj.genre,
        description: proj.description,
        status: proj.status
      })
      .select()
      .single();

    if (projErr) throw projErr;

    const projectId = projectData.id;
    const holdersToInsert = proj.holders.map(h => {
      const addr = getWallet(accountIndex++);
      return {
        project_id: projectId,
        full_name: h.full_name,
        role: h.role,
        percentage: h.percentage,
        wallet_address: addr,
        total_received: 0,
      };
    });

    const { data: insertedHolders, error: holderErr } = await supabase
      .from('rights_holders')
      .insert(holdersToInsert)
      .select();

    if (holderErr) throw holderErr;
    totalHoldersInserted += holdersToInsert.length;
    projectRecords.push({ ...projectData, holders: insertedHolders });
  }

  console.log(`  ✓ Seeded ${projects.length} projects with ${totalHoldersInserted} rights holders\n`);

  // ──────────────────────────────────────────────
  // 3. Seed Demo Transactions (so dashboard isn't empty)
  // ──────────────────────────────────────────────
  console.log("  Seeding demo transactions...");

  const txAmounts = [0.5, 0.25, 0.75, 0.1, 0.3, 1.0, 0.15, 0.6, 0.2, 0.45, 0.8, 0.35];
  let totalTxInserted = 0;
  let totalSplitsInserted = 0;

  for (let projIdx = 0; projIdx < projectRecords.length; projIdx++) {
    const project = projectRecords[projIdx];
    const holders = project.holders || [];
    // Each project gets 2-3 transactions with realistic dates spread over past 60 days
    const txCount = 2 + (projIdx % 2); // 2 or 3

    for (let t = 0; t < txCount; t++) {
      const amount = txAmounts[(projIdx * 3 + t) % txAmounts.length];
      const daysAgo = Math.floor(Math.random() * 55) + 5; // 5-60 days ago
      const txDate = new Date();
      txDate.setDate(txDate.getDate() - daysAgo);

      // Generate a realistic-looking tx hash
      const txHash = '0x' + Array.from({length: 64}, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');

      const senderWallet = getWallet(0); // Hardhat account #0

      const { data: txRecord, error: txErr } = await supabase
        .from('transactions')
        .insert({
          project_id: project.id,
          tx_hash: txHash,
          sender_address: senderWallet,
          total_amount_eth: amount,
          method: 'demo',
          is_demo: true,
          status: 'confirmed',
          created_at: txDate.toISOString(),
        })
        .select('id')
        .single();

      if (txErr) {
        console.warn(`  ⚠ Transaction insert failed:`, txErr.message);
        continue;
      }

      // Create splits for each holder
      const splits = holders.map(h => ({
        transaction_id: txRecord.id,
        rights_holder_id: h.id,
        wallet_address: h.wallet_address,
        full_name: h.full_name,
        role: h.role,
        amount_eth: (h.percentage / 100) * amount,
        percentage: h.percentage,
      }));

      const { error: splitErr } = await supabase
        .from('transaction_splits')
        .insert(splits);

      if (splitErr) console.warn(`  ⚠ Splits insert failed:`, splitErr.message);

      totalTxInserted++;
      totalSplitsInserted += splits.length;
    }

    // Update project total_distributed
    const projectTotalEth = txAmounts.slice(0, 2 + (projIdx % 2)).reduce((s, a) => s + a, 0);
    await supabase
      .from('projects')
      .update({ total_distributed: projectTotalEth })
      .eq('id', project.id);

    // Update each holder's total_received
    for (const h of holders) {
      const holderTotal = (h.percentage / 100) * projectTotalEth;
      await supabase
        .from('rights_holders')
        .update({ total_received: holderTotal })
        .eq('id', h.id);
    }
  }

  console.log(`  ✓ Seeded ${totalTxInserted} demo transactions with ${totalSplitsInserted} splits\n`);

  // ──────────────────────────────────────────────
  // 4. Seed Activity Feed
  // ──────────────────────────────────────────────
  console.log("  Seeding activity feed...");

  const activityTypes = [
    { action: 'payment_recorded', desc: (name, amt) => `Automated distribution of $${(amt * ETH_PRICE_USD).toLocaleString()} for ${name}` },
    { action: 'holder_added', desc: (name) => `New rights holder added to ${name}` },
    { action: 'project_created', desc: (name) => `Project "${name}" was created and activated` },
    { action: 'report_generated', desc: (name) => `Revenue report generated for ${name}` },
    { action: 'milestone', desc: (name) => `Milestone reached: First distribution completed for ${name}` },
  ];

  const activities = [];
  for (let i = 0; i < projectRecords.length; i++) {
    const proj = projectRecords[i];
    // 3 activities per project
    for (let a = 0; a < 3; a++) {
      const actType = activityTypes[(i + a) % activityTypes.length];
      const daysAgo = Math.floor(Math.random() * 45) + 1;
      const actDate = new Date();
      actDate.setDate(actDate.getDate() - daysAgo);

      activities.push({
        project_id: proj.id,
        action: actType.action,
        description: actType.desc(proj.name, 0.5),
        timestamp: actDate.toISOString(),
      });
    }
  }

  const { error: actErr } = await supabase.from('activities').insert(activities);
  if (actErr) console.warn('  ⚠ Activities insert failed:', actErr.message);
  else console.log(`  ✓ Seeded ${activities.length} activity entries\n`);

  // ──────────────────────────────────────────────
  // Summary
  // ──────────────────────────────────────────────
  console.log('┌──────────────────────────────────────────────────────────┐');
  console.log('│  LUNIM — Seed Complete                                   │');
  console.log('├──────────────────┬───────────────────────────────────────┤');
  console.log(`│  Projects        │  ${String(projects.length).padEnd(36)}│`);
  console.log(`│  Rights Holders  │  ${String(totalHoldersInserted).padEnd(36)}│`);
  console.log(`│  Transactions    │  ${String(totalTxInserted).padEnd(36)}│`);
  console.log(`│  Splits          │  ${String(totalSplitsInserted).padEnd(36)}│`);
  console.log(`│  Activities      │  ${String(activities.length).padEnd(36)}│`);
  console.log('└──────────────────┴───────────────────────────────────────┘\n');
};

seedData().catch(console.error);
