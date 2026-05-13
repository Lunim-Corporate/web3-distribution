require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
  console.log('Seeding data...');
  
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
  
  const projects = [
    { name: 'Dust & Dynasty', status: 'Active', total_revenue: 64000000 }, // in cents
    { name: 'The Salt Coast', status: 'Active', total_revenue: 96000000 },
    { name: 'Glass Republic', status: 'Active', total_revenue: 35200000 },
    { name: 'Binary Fault', status: 'Active', total_revenue: 32000000 },
    { name: 'Neon Requiem', status: 'Active', total_revenue: 35200000 },
  ];
  
  for (const p of projects) {
    let { data: proj } = await supabase.from('projects').select('id').eq('name', p.name).single();
    if (!proj) {
      const { data: newProj, error: err } = await supabase.from('projects').insert({
        name: p.name,
        status: p.status,
        total_revenue: p.total_revenue,
        owner_id: admin?.id
      }).select().single();
      if (err) console.error(err);
      proj = newProj;
    }
    
    const contributors = [
      { name: 'Alice Smith ' + p.name, role: 'Developer', percentage: 20 },
      { name: 'Bob Jones ' + p.name, role: 'Designer', percentage: 20 },
      { name: 'Charlie Day ' + p.name, role: 'Musician', percentage: 20 },
      { name: 'Diana Prince ' + p.name, role: 'Writer', percentage: 20 },
      { name: 'Eve Adams ' + p.name, role: 'QA', percentage: 10 },
      { name: 'Frank Castle ' + p.name, role: 'Producer', percentage: 10 },
    ];
    
    for (const c of contributors) {
      let email = c.name.toLowerCase().replace(/[^a-z]/g, '') + '@example.com';
      let { data: cUser } = await supabase.from('users').select('id, wallet_address').eq('email', email).single();
      if (!cUser) {
        const { data: newCUser, error: err } = await supabase.from('users').insert({
          name: c.name,
          email: email,
          role: 'creator',
          wallet_address: '0x' + Math.random().toString(16).substring(2, 42).padEnd(40, '0')
        }).select().single();
        if (err) console.error(err);
        cUser = newCUser;
      }
      
      const { data: existingContrib } = await supabase.from('project_contributors').select('id').eq('project_id', proj.id).eq('user_id', cUser?.id).single();
      if (!existingContrib) {
        const { error: err } = await supabase.from('project_contributors').insert({
          project_id: proj.id,
          user_id: cUser?.id,
          role: c.role,
          revenue_share: c.percentage,
          total_earned: 0
        });
        if (err) console.error('Contributor insert error:', err);
      }
    }
    
    const { data: existingPayment } = await supabase.from('payments').select('id').eq('project_id', proj.id).limit(1);
    if (!existingPayment || existingPayment.length === 0) {
      const { error: err } = await supabase.from('payments').insert({
        project_id: proj.id,
        amount: p.total_revenue,
        currency: 'USD',
        status: 'completed',
        source: 'Client Payment',
        tx_hash: '0x' + Math.random().toString(16).substring(2, 66).padEnd(64, '0')
      });
      if (err) console.error('Payment insert error:', err);
    }
  }
  
  console.log('Seeding complete!');
}

seed().catch(console.error);
