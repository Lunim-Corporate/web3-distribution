require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
  console.log('Seeding data...');
  
  // 1. Create or get admin user
  let { data: admin } = await supabase.from('users').select('id').eq('email', 'admin@lunim.com').single();
  if (!admin) {
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@lunim.com',
      password: 'password123',
      email_confirm: true
    });
    if (authError) console.error('Error creating admin auth:', authError);
    
    const { data: newUser } = await supabase.from('users').insert({
      id: authUser?.user?.id || 'admin-123',
      name: 'Admin User',
      email: 'admin@lunim.com',
      role: 'admin'
    }).select().single();
    admin = newUser;
  }
  
  // Create 5 standard projects
  const projects = [
    { name: 'Dust & Dynasty', status: 'Active', total_revenue: 640000 },
    { name: 'The Salt Coast', status: 'Active', total_revenue: 960000 },
    { name: 'Glass Republic', status: 'Active', total_revenue: 352000 },
    { name: 'Binary Fault', status: 'Active', total_revenue: 320000 },
    { name: 'Neon Requiem', status: 'Active', total_revenue: 352000 },
  ];
  
  for (const p of projects) {
    let { data: proj } = await supabase.from('projects').select('id').eq('name', p.name).single();
    if (!proj) {
      const { data: newProj } = await supabase.from('projects').insert({
        name: p.name,
        status: p.status,
        total_revenue: p.total_revenue,
        owner_id: admin?.id
      }).select().single();
      proj = newProj;
    }
    
    // Create 6 rights holders (contributors) for each project
    const contributors = [
      { name: 'Alice Smith', role: 'Developer', percentage: 20 },
      { name: 'Bob Jones', role: 'Designer', percentage: 20 },
      { name: 'Charlie Day', role: 'Musician', percentage: 20 },
      { name: 'Diana Prince', role: 'Writer', percentage: 20 },
      { name: 'Eve Adams', role: 'QA', percentage: 10 },
      { name: 'Frank Castle', role: 'Producer', percentage: 10 },
    ];
    
    for (const c of contributors) {
      // Create user if not exists
      let email = c.name.toLowerCase().replace(' ', '') + '@example.com';
      let { data: cUser } = await supabase.from('users').select('id').eq('email', email).single();
      if (!cUser) {
        const { data: newCUser } = await supabase.from('users').insert({
          name: c.name,
          email: email,
          role: 'creator',
          wallet_address: '0x' + Math.random().toString(16).substring(2, 42).padEnd(40, '0')
        }).select().single();
        cUser = newCUser;
      }
      
      // Add contributor
      const { data: existingContrib } = await supabase.from('project_contributors').select('id').eq('project_id', proj.id).eq('user_id', cUser?.id).single();
      if (!existingContrib) {
        await supabase.from('project_contributors').insert({
          project_id: proj.id,
          user_id: cUser?.id,
          name: c.name,
          role: c.role,
          split_percentage: c.percentage,
          total_received: 0,
          wallet_address: cUser?.wallet_address
        });
      }
    }
    
    // Add 1 payment per project to match revenue
    const { data: existingPayment } = await supabase.from('payments').select('id').eq('project_id', proj.id).limit(1);
    if (!existingPayment || existingPayment.length === 0) {
      await supabase.from('payments').insert({
        project_id: proj.id,
        amount: p.total_revenue,
        currency: 'USD',
        status: 'completed',
        source: 'Client Payment',
        tx_hash: '0x' + Math.random().toString(16).substring(2, 66).padEnd(64, '0')
      });
    }
  }
  
  console.log('Seeding complete!');
}

seed().catch(console.error);
