const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE environment variables in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const NAMES = [
  "James Miller", "Sarah Chen", "Marcus Wright", "Elena Rodriguez", "David Kim",
  "Aisha Johnson", "Lukas Weber", "Sophie Laurent", "Kavi Patel", "Emma Thompson",
  "Carlos Ruiz", "Yuki Tanaka", "Oliver Brown", "Zara Khan", "Liam Wilson",
  "Noah Garcia", "Mia Martinez", "Jacob Robinson", "Ava Clark", "William Lewis",
  "Sofia Walker", "Mason Hall", "Isabella Young", "Ethan Allen", "Charlotte King",
  "Alexander Wright", "Amelia Scott", "Daniel Green", "Harper Adams"
];

const ROLES = [
  "Lead Producer", "Vocalist", "Guitarist", "Drummer", "Manager",
  "Sound Engineer", "Songwriter", "Lyricist", "Marketing Lead", "Legal Counsel",
  "Backing Vocals", "Keyboardist", "Bassist", "Tour Manager", "PR Specialist",
  "Distributor", "Graphic Designer", "Video Director", "Choreographer", "Stylist",
  "Booking Agent", "Accountant", "Data Analyst", "Merchandise Manager", "Social Media Manager",
  "App Developer", "Web Designer", "Security Head", "Intern"
];

async function seed() {
  console.log("🌱 Starting Moonstone Dashboard Seed (29 Users)...");

  // 1. Create or get projects
  const { data: projects, error: pErr } = await supabase.from('projects').select('id, name');
  if (pErr) throw pErr;

  let mainProject = projects.find(p => p.name.includes("Alpha"));
  if (!mainProject) {
    const { data: newProj, error: createErr } = await supabase.from('projects').insert({
      name: "Moonstone — Project Alpha (Global)",
      description: "The flagship project for the Moonstone ecosystem.",
      status: "Active",
      total_revenue: 0
    }).select().single();
    if (createErr) throw createErr;
    mainProject = newProj;
  }

  console.log(`✅ Using Project: ${mainProject.name} (${mainProject.id})`);

  // 2. Create 29 Users
  console.log("👤 Creating 29 users...");
  const userRows = NAMES.map((name, i) => ({
    name,
    email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
    wallet_address: `0x${Math.random().toString(16).substring(2, 42).padStart(40, '0')}`,
    role: ROLES[i % ROLES.length],
    created_at: new Date(Date.now() - Math.random() * 1000000000).toISOString()
  }));

  const { data: insertedUsers, error: uErr } = await supabase.from('users').upsert(userRows, { onConflict: 'email' }).select();
  if (uErr) throw uErr;
  console.log(`✅ Created/Updated ${insertedUsers.length} users.`);

  // 3. Create Contributors
  console.log("👥 Adding contributors to project...");
  await supabase.from('project_contributors').delete().eq('project_id', mainProject.id);

  const contributorRows = insertedUsers.map((user, i) => ({
    project_id: mainProject.id,
    user_id: user.id,
    revenue_share: i === 0 ? 10 : (90 / (insertedUsers.length - 1)), // Roughly even split after lead
    role: user.role
  }));

  const { error: cErr } = await supabase.from('project_contributors').insert(contributorRows);
  if (cErr) throw cErr;
  console.log(`✅ Linked 29 contributors to ${mainProject.name}.`);

  // 4. Create dummy payments (History)
  console.log("💰 Generating payment history...");
  const paymentRows = [];
  const txHashes = Array.from({ length: 5 }, () => `0x${Math.random().toString(16).substring(2, 66).padStart(64, '0')}`);

  txHashes.forEach((hash, txIdx) => {
    const totalTxAmountCents = Math.floor(Math.random() * 500000) + 100000; // $1000 - $6000
    insertedUsers.forEach((user, uIdx) => {
      const share = contributorRows[uIdx].revenue_share;
      paymentRows.push({
        project_id: mainProject.id,
        user_id: user.id,
        amount: Math.round((share / 100) * totalTxAmountCents),
        tx_hash: hash,
        status: 'completed',
        source: 'Historical Distribution',
        created_at: new Date(Date.now() - (txIdx + 1) * 86400000 * 7).toISOString() // 1 week apart
      });
    });
  });

  const { error: payErr } = await supabase.from('payments').insert(paymentRows);
  if (payErr) throw payErr;

  // 5. Update Project Total Revenue
  const totalRev = paymentRows.reduce((sum, p) => sum + p.amount, 0);
  await supabase.from('projects').update({ total_revenue: totalRev }).eq('id', mainProject.id);

  console.log("✨ Seed Complete! All 29 users are now active on the dashboard.");
}

seed().catch(err => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
