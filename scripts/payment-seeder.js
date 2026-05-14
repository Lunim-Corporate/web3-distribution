/**
 * payment-seeder.js
 * Seeds realistic payment history for the 5 active projects.
 * Run with: node scripts/payment-seeder.js
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SOURCES = ['Streaming Royalties', 'Licensing Deal', 'Sales Revenue', 'Performance Rights', 'Sync Licensing'];

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function fakeTxHash() {
  return '0x' + Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
}

async function seed() {
  console.log('\n💳 Starting Payment Seeder...\n');

  // Fetch all 5 projects with their contributors
  const { data: projects, error: pErr } = await supabase.from('projects').select('id, name');
  if (pErr) { console.error('Failed to fetch projects:', pErr.message); process.exit(1); }

  for (const project of projects) {
    console.log(`\n📦 Seeding payments for: ${project.name}`);

    // Get contributors for this project
    const { data: contributors, error: cErr } = await supabase
      .from('project_contributors')
      .select('id, user_id, revenue_share')
      .eq('project_id', project.id);

    if (cErr || !contributors?.length) {
      console.log(`  ⚠️  No contributors found, skipping.`);
      continue;
    }

    // Create 8–12 payment events over the past 90 days
    const paymentCount = randomBetween(8, 12);
    let totalInserted = 0;
    let projectTotal = 0;

    for (let i = 0; i < paymentCount; i++) {
      const totalUSD = randomBetween(800, 12000);
      const txHash = fakeTxHash();
      const source = SOURCES[Math.floor(Math.random() * SOURCES.length)];
      const paymentDate = daysAgo(randomBetween(1, 90));

      // One payment row per contributor per event
      const rows = contributors.map(c => {
        const shareUSD = (Number(c.revenue_share) / 100) * totalUSD;
        const shareInCents = Math.round(shareUSD * 100);
        return {
          project_id: project.id,
          user_id: c.user_id,
          amount: shareInCents,
          tx_hash: txHash,
          status: 'completed',
          source,
          split_percentage: c.revenue_share,
          payment_date: paymentDate,
          created_at: paymentDate,
        };
      });

      const { error: insErr } = await supabase.from('payments').insert(rows);
      if (insErr) {
        console.log(`  ❌ Insert failed for event ${i + 1}:`, insErr.message);
      } else {
        totalInserted += rows.length;
        projectTotal += totalUSD;
      }
    }

    // Update project total_revenue
    const totalCents = Math.round(projectTotal * 100);
    await supabase.from('projects').update({ total_revenue: totalCents }).eq('id', project.id);

    // Update total_earned per contributor
    for (const c of contributors) {
      const earned = Math.round((Number(c.revenue_share) / 100) * projectTotal * 100);
      await supabase.from('project_contributors')
        .update({ total_earned: earned })
        .eq('id', c.id);
    }

    console.log(`  ✅ ${paymentCount} events | ${totalInserted} rows | $${projectTotal.toLocaleString()} total`);
  }

  console.log('\n✨ Payment seeding complete.\n');
}

seed().catch(e => { console.error(e); process.exit(1); });
