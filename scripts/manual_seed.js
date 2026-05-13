const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const contractAddress = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';
  
  // Get an existing user to be the owner
  const { data: users } = await supabase.from('users').select('id').limit(1);
  const ownerId = users[0].id;

  console.log("Seeding with contract:", contractAddress, "Owner:", ownerId);

  // 1. Create Project
  const { data: project, error: pError } = await supabase
    .from('projects')
    .insert([{
      name: "Moonstone — Project Alpha (Live)",
      description: "Primary distribution project for the Moonstone platform.",
      contract_address: contractAddress,
      total_revenue: 0,
      status: 'active',
      owner_id: ownerId
    }])
    .select()
    .single();

  if (pError) {
    console.error("Error creating project:", pError);
    return;
  }

  console.log("Project created:", project.id);

  // 2. Sample holders
  const holders = [
    { name: "Producer Alpha", role: "Production", wallet: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", share: 40 },
    { name: "Lead Vocalist", role: "Performer", wallet: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", share: 20 }
  ];

  for (const h of holders) {
    let { data: user } = await supabase.from('users').select('id').eq('wallet_address', h.wallet).maybeSingle();
    if (!user) {
      const { data: newUser } = await supabase.from('users').insert([{
        name: h.name,
        wallet_address: h.wallet,
        role: 'contributor',
        email: `${h.name.toLowerCase().replace(/\s+/g, '')}@example.com`
      }]).select().single();
      user = newUser;
    }
    
    await supabase.from('project_contributors').insert([{
      project_id: project.id,
      user_id: user.id,
      role: h.role,
      revenue_share: h.share
    }]);
  }
  console.log("Done seeding.");
}
run();
