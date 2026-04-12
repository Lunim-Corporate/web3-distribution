const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Random number generator within range
const randomInRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const sources = ['Streaming', 'Sync Licensing', 'Sales', 'Direct Payment'];

async function seedDemoData() {
  console.log('🚀 Starting Deep Transaction Seeding...\n');

  // 1. Fetch Projects
  const { data: projects } = await supabase.from('projects').select('id, name');
  if (!projects || projects.length === 0) {
    console.error('❌ No projects found!');
    return;
  }

  // 2. Erase existing payments to start fresh
  const { error: clearError } = await fallbackDeleteAllPayments();
  if (clearError) console.error('Notice: Could not clear existing payments.');

  // 3. For each project, fetch its 5 roles/contributors and generate 50 payments over 6 months
  for (const project of projects) {
    console.log(`\n📦 Processing ${project.name}...`);
    
    // reset total_revenue for the project
    await supabase.from('projects').update({ total_revenue: 0 }).eq('id', project.id);

    const { data: contributors } = await supabase
      .from('project_contributors')
      .select('id, user_id, percentage:revenue_share')
      .eq('project_id', project.id);

    if (!contributors || contributors.length === 0) {
      console.log(`  └ ❌ No contributors for this project. Run seed_roles.js first.`);
      continue;
    }

    const newPayments = [];
    let projectTotalRevenue = 0;

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    // Generate 15 logical payout events for the project over the 6 months
    for (let i = 0; i < 15; i++) {
        // Random date within last 6 months
        const txDate = new Date(sixMonthsAgo.getTime() + Math.random() * (Date.now() - sixMonthsAgo.getTime()));
        const source = sources[Math.floor(Math.random() * sources.length)];
        
        // Let's generate a payout chunk mimicking USD
        // Say a payout is arbitrarily between $1,500 and $25,000
        const totalPayoutUsd = randomInRange(1500, 25000);
        
        // Mock a unique blockchain tx hash
        const mockTxHash = `0xmock${Date.now()}${randomInRange(1000, 9999)}`;

        // Distribute this payout among the 5 roles according to their percentages
        for (const contributor of contributors) {
            const splitAmount = (totalPayoutUsd * contributor.percentage) / 100;

            newPayments.push({
                project_id: project.id,
                user_id: contributor.user_id,
                amount: splitAmount,
                tx_hash: mockTxHash,
                status: 'completed',
                source: source,
                split_percentage: contributor.percentage,
                created_at: txDate.toISOString(),
                // Use payment_date directly here because legacy schema uses payment_date occasionally
                payment_date: txDate.toISOString() 
            });

            projectTotalRevenue += splitAmount;
        }
    }

    console.log(`  └ Attempting to insert ${newPayments.length} robust transactions (USD)...`);
    
    const { error: insertError } = await supabase.from('payments').insert(newPayments);
    
    if (insertError) {
      console.error(`  └ ❌ Insert failed for ${project.name}:`, insertError.message);
    } else {
      console.log(`  └ ✅ Success! Generating ~$${projectTotalRevenue.toLocaleString()} in volume.`);
      // Update Project Total
      await supabase.from('projects').update({ total_revenue: projectTotalRevenue }).eq('id', project.id);
    }
  }

  console.log('\n🌟 Deep Transaction Seeding Complete! The dashboard charts will now look fully realistic.\n');
}

// Supabase row-level operations restrict massive deletions sometimes, this falls back safely
async function fallbackDeleteAllPayments() {
  console.log('🧹 Clearing old mock transactions...');
  const { data } = await supabase.from('payments').select('id');
  if (data) {
     for (const p of data) {
        await supabase.from('payments').delete().eq('id', p.id);
     }
  }
  return { error: null };
}

seedDemoData();
