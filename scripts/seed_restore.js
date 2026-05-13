/**
 * LUNIM Dashboard — Full Restore Seed
 * 5 Projects · 29 Rights Holders · 9 Transactions
 * Matches the original stable screenshots exactly.
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE env vars in .env.local');
  process.exit(1);
}
const sb = createClient(supabaseUrl, supabaseKey);

// ── 29 Rights Holders ──────────────────────────────────────────
const USERS = [
  // Dust & Dynasty (6)
  { name: 'Zara Kimani',      role: 'Director',           email: 'zara.kimani@moonstone.io' },
  { name: 'Cole Hartfield',   role: 'Lead Actor',         email: 'cole.hartfield@moonstone.io' },
  { name: 'Nadia Volkov',     role: 'Producer',           email: 'nadia.volkov@moonstone.io' },
  { name: 'Bayo Akinwande',   role: 'Supporting Actor',   email: 'bayo.akinwande@moonstone.io' },
  { name: 'Mei-Xing Zhao',    role: 'Music Composer',     email: 'mei-xing.zhao@moonstone.io' },
  { name: 'Soren Lindqvist',  role: 'Cinematographer',    email: 'soren.lindqvist@moonstone.io' },
  // The Salt Coast (6)
  { name: 'Priya Sharma',     role: 'Editor',             email: 'priya.sharma@moonstone.io' },
  { name: 'Luca Moretti',     role: 'Sound Designer',     email: 'luca.moretti@moonstone.io' },
  { name: 'Amara Osei',       role: 'Costume Designer',   email: 'amara.osei@moonstone.io' },
  { name: 'Kai Nakamura',     role: 'VFX Supervisor',     email: 'kai.nakamura@moonstone.io' },
  { name: 'Elena Vasquez',    role: 'Production Manager', email: 'elena.vasquez@moonstone.io' },
  { name: 'Tobias Richter',   role: 'Gaffer',             email: 'tobias.richter@moonstone.io' },
  // Glass Republic (6)
  { name: 'Fatima Al-Hassan', role: 'Script Supervisor',  email: 'fatima.alhassan@moonstone.io' },
  { name: 'Dmitri Petrov',    role: 'Stunt Coordinator',  email: 'dmitri.petrov@moonstone.io' },
  { name: 'Yuna Park',        role: 'Art Director',       email: 'yuna.park@moonstone.io' },
  { name: 'Rafael Santos',    role: 'Location Manager',   email: 'rafael.santos@moonstone.io' },
  { name: 'Ingrid Larsen',    role: 'Colorist',           email: 'ingrid.larsen@moonstone.io' },
  { name: 'Marcus Chen',      role: 'Foley Artist',       email: 'marcus.chen@moonstone.io' },
  // Binary Fault (6)
  { name: 'Aaliya Patel',     role: 'Casting Director',   email: 'aaliya.patel@moonstone.io' },
  { name: 'Felix Braun',      role: 'Key Grip',           email: 'felix.braun@moonstone.io' },
  { name: 'Chioma Eze',       role: 'Makeup Artist',      email: 'chioma.eze@moonstone.io' },
  { name: 'Anders Svensson',  role: 'Props Master',       email: 'anders.svensson@moonstone.io' },
  { name: 'Rosa Delgado',     role: 'Dialect Coach',      email: 'rosa.delgado@moonstone.io' },
  { name: 'Kenji Tanaka',     role: 'Steadicam Operator', email: 'kenji.tanaka@moonstone.io' },
  // Neon Requiem (5)
  { name: 'Anais Dupont',     role: 'Set Designer',       email: 'anais.dupont@moonstone.io' },
  { name: 'Emeka Okonkwo',    role: 'Unit Manager',       email: 'emeka.okonkwo@moonstone.io' },
  { name: 'Hana Yoshida',     role: 'Score Arranger',     email: 'hana.yoshida@moonstone.io' },
  { name: 'Viktor Novak',     role: 'DIT Supervisor',     email: 'viktor.novak@moonstone.io' },
  { name: 'Leila Khoury',     role: 'Line Producer',      email: 'leila.khoury@moonstone.io' },
];

// ── 5 Projects ─────────────────────────────────────────────────
const PROJECTS = [
  { name: 'Dust & Dynasty',  desc: 'Epic period drama spanning three generations.',       type: 'Film' },
  { name: 'The Salt Coast',  desc: 'Coastal thriller set in a remote fishing village.',    type: 'Series' },
  { name: 'Glass Republic',  desc: 'Futuristic dystopian narrative.',                      type: 'Film' },
  { name: 'Binary Fault',    desc: 'Cyberpunk tech thriller.',                             type: 'Tech Thriller' },
  { name: 'Neon Requiem',    desc: 'Neon-lit noir mystery in a rain-soaked megacity.',     type: 'Film Noir' },
];

// ── Splits per project (index into USERS, share%) ──────────────
const SPLITS = [
  // Dust & Dynasty
  [[0, 27], [1, 21], [2, 16], [3, 14], [4, 12], [5, 10]],
  // The Salt Coast
  [[6, 25], [7, 20], [8, 18], [9, 15], [10, 12], [11, 10]],
  // Glass Republic
  [[12, 24], [13, 20], [14, 18], [15, 15], [16, 13], [17, 10]],
  // Binary Fault
  [[18, 26], [19, 20], [20, 17], [21, 15], [22, 12], [23, 10]],
  // Neon Requiem
  [[24, 28], [25, 24], [26, 20], [27, 16], [28, 12]],
];

// ── Transaction definitions (projectIdx, totalUSD_cents, date) ─
const TXS = [
  { proj: 1, cents: 32000,  date: '2026-04-30T14:00:00Z' }, // Salt Coast $320
  { proj: 2, cents: 320000, date: '2026-04-30T15:00:00Z' }, // Glass Republic $3200
  { proj: 0, cents: 32000,  date: '2026-04-30T16:00:00Z' }, // Dust & Dynasty $320
  { proj: 1, cents: 320000, date: '2026-05-01T10:00:00Z' }, // Salt Coast $3200
  { proj: 4, cents: 320000, date: '2026-05-01T11:00:00Z' }, // Neon Requiem $3200
  { proj: 3, cents: 32000,  date: '2026-05-01T12:00:00Z' }, // Binary Fault $320
  { proj: 0, cents: 320000, date: '2026-05-05T09:00:00Z' }, // Dust & Dynasty $3200
  { proj: 2, cents: 32000,  date: '2026-05-08T14:30:00Z' }, // Glass Republic $320
  { proj: 4, cents: 32000,  date: '2026-05-08T15:00:00Z' }, // Neon Requiem $320
];

function makeWallet(i) {
  const hex = 'abcdef0123456789';
  let addr = '0x';
  for (let j = 0; j < 40; j++) addr += hex[(i * 7 + j * 3) % 16];
  return addr;
}

function makeTxHash(i) {
  const hex = '0123456789abcdef';
  let h = '0x';
  for (let j = 0; j < 64; j++) h += hex[(i * 13 + j * 7) % 16];
  return h;
}

async function seed() {
  console.log('\n🌱 LUNIM Full Restore — 5 Projects · 29 Rights Holders · 9 Transactions\n');

  // ── Step 1: Clean ────────────────────────────────────────────
  console.log('🗑️  Cleaning existing data...');
  await sb.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await sb.from('project_contributors').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  // Don't delete the admin user
  await sb.from('users').delete().like('email', '%@moonstone.io');

  // ── Step 2: Users ────────────────────────────────────────────
  console.log('👤 Creating 29 users...');
  const userRows = USERS.map((u, i) => ({
    name: u.name,
    email: u.email,
    wallet_address: makeWallet(i),
    role: u.role,
  }));
  const { data: createdUsers, error: uErr } = await sb.from('users').upsert(userRows, { onConflict: 'email' }).select();
  if (uErr) { console.error('User insert error:', uErr); process.exit(1); }
  console.log(`   ✅ ${createdUsers.length} users ready`);

  // Build email→id map
  const emailToId = {};
  createdUsers.forEach(u => { emailToId[u.email] = u.id; });

  // ── Step 3: Projects ─────────────────────────────────────────
  console.log('📁 Creating 5 projects...');
  // Delete old projects by name to avoid duplicates
  for (const p of PROJECTS) {
    await sb.from('projects').delete().eq('name', p.name);
  }
  const projRows = PROJECTS.map(p => ({
    name: p.name,
    description: p.desc,
    status: 'active',
    type: p.type,
    total_revenue: 0,
  }));
  const { data: createdProjects, error: pErr } = await sb.from('projects').insert(projRows).select();
  if (pErr) { console.error('Project insert error:', pErr); process.exit(1); }
  console.log(`   ✅ ${createdProjects.length} projects created`);

  // ── Step 4: Contributors ─────────────────────────────────────
  console.log('🔗 Linking 29 contributors to projects...');
  const contribRows = [];
  SPLITS.forEach((projectSplits, projIdx) => {
    const projId = createdProjects[projIdx].id;
    projectSplits.forEach(([userIdx, share]) => {
      const userId = emailToId[USERS[userIdx].email];
      if (!userId) { console.warn(`⚠ No user found for ${USERS[userIdx].email}`); return; }
      contribRows.push({
        project_id: projId,
        user_id: userId,
        revenue_share: share,
        role: USERS[userIdx].role,
      });
    });
  });
  const { error: cErr } = await sb.from('project_contributors').insert(contribRows);
  if (cErr) { console.error('Contributor insert error:', cErr); process.exit(1); }
  console.log(`   ✅ ${contribRows.length} contributor links created`);

  // ── Step 5: Payments ─────────────────────────────────────────
  console.log('💰 Creating 9 transactions with per-holder splits...');
  const paymentRows = [];
  TXS.forEach((tx, txIdx) => {
    const projId = createdProjects[tx.proj].id;
    const splits = SPLITS[tx.proj];
    const txHash = makeTxHash(txIdx);
    splits.forEach(([userIdx, share]) => {
      const userId = emailToId[USERS[userIdx].email];
      if (!userId) return;
      paymentRows.push({
        project_id: projId,
        user_id: userId,
        amount: Math.round((share / 100) * tx.cents),
        tx_hash: txHash,
        status: 'completed',
        source: 'Client Payment',
        created_at: tx.date,
      });
    });
  });
  const { error: payErr } = await sb.from('payments').insert(paymentRows);
  if (payErr) { console.error('Payment insert error:', payErr); process.exit(1); }
  console.log(`   ✅ ${paymentRows.length} payment rows inserted`);

  // ── Step 6: Update project totals ────────────────────────────
  console.log('📊 Updating project revenue totals...');
  for (const proj of createdProjects) {
    const { data: payments } = await sb.from('payments').select('amount').eq('project_id', proj.id);
    const total = (payments || []).reduce((s, p) => s + Number(p.amount), 0);
    await sb.from('projects').update({ total_revenue: total }).eq('id', proj.id);
  }

  // ── Summary ──────────────────────────────────────────────────
  const { data: finalProjects } = await sb.from('projects').select('name, total_revenue').in('id', createdProjects.map(p => p.id)).order('name');
  const { count: holderCount } = await sb.from('project_contributors').select('id', { count: 'exact', head: true });
  const { count: txCount } = await sb.from('payments').select('id', { count: 'exact', head: true });
  const grandTotal = (finalProjects || []).reduce((s, p) => s + Number(p.total_revenue), 0);

  console.log('\n════════════════════════════════════════════════════');
  console.log('              LUNIM RESTORE COMPLETE');
  console.log('════════════════════════════════════════════════════');
  console.log(`  Total Distributed: $${(grandTotal / 100).toLocaleString()}`);
  console.log(`  Rights Holders:    ${holderCount}`);
  console.log(`  Transactions:      ${txCount}`);
  console.log('────────────────────────────────────────────────────');
  (finalProjects || []).forEach(p => {
    console.log(`  ${p.name.padEnd(20)} $${(Number(p.total_revenue) / 100).toLocaleString()}`);
  });
  console.log('════════════════════════════════════════════════════\n');
}

seed().catch(err => { console.error('❌ Seed failed:', err); process.exit(1); });
