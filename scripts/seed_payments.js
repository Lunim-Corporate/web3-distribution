require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
  console.log('Seeding data...');
  
  let { data: admin } = await supabase.from('users').select('id').eq('email', 'admin@lunim.com').single();
  
  const projects = [
    { name: 'Dust & Dynasty', status: 'Active', total_revenue: 64000000 }, // in cents
    { name: 'The Salt Coast', status: 'Active', total_revenue: 96000000 },
    { name: 'Glass Republic', status: 'Active', total_revenue: 35200000 },
    { name: 'Binary Fault', status: 'Active', total_revenue: 32000000 },
    { name: 'Neon Requiem', status: 'Active', total_revenue: 35200000 },
  ];
  
  for (const p of projects) {
    let { data: proj } = await supabase.from('projects').select('id').eq('name', p.name).single();
    
    const { data: existingPayment } = await supabase.from('payments').select('id').eq('project_id', proj.id).limit(1);
    if (!existingPayment || existingPayment.length === 0) {
      const { error: err } = await supabase.from('payments').insert({
        project_id: proj.id,
        amount: p.total_revenue,
        status: 'completed',
        tx_hash: '0x' + Math.random().toString(16).substring(2, 66).padEnd(64, '0')
      });
      if (err) console.error('Payment insert error:', err);
    }
  }
  
  console.log('Seeding payments complete!');
}

seed().catch(console.error);
