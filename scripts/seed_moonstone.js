require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const projectData = {
  "Binary Fault": [
    { name: "Zara Kimani", role: "Director", share: 27 },
    { name: "Cole Hartfield", role: "Lead Actor", share: 21 },
    { name: "Nadia Volkov", role: "Producer", share: 16 },
    { name: "Bayo Akinwande", role: "Supporting Actor", share: 14 },
    { name: "Mei-Xing Zhao", role: "Music Composer", share: 12 },
    { name: "Soren Lindqvist", role: "Writer", share: 10 }
  ],
  "Dust & Dynasty": [
    { name: "Elijah Vance", role: "Director", share: 25 },
    { name: "Maya Patel", role: "Lead Actress", share: 22 },
    { name: "Jackson Thorne", role: "Producer", share: 18 },
    { name: "Sofia Rossi", role: "Writer", share: 15 },
    { name: "Omar Al-Fayed", role: "Cinematographer", share: 12 },
    { name: "Chloe Chen", role: "Editor", share: 8 }
  ],
  "The Salt Coast": [
    { name: "Liam O'Connor", role: "Showrunner", share: 30 },
    { name: "Aisha Diallo", role: "Lead Actress", share: 20 },
    { name: "Noah Brooks", role: "Lead Actor", share: 18 },
    { name: "Elena Silva", role: "Producer", share: 15 },
    { name: "Wei Ling", role: "Art Director", share: 10 },
    { name: "Tariq Hasan", role: "Composer", share: 7 }
  ],
  "Glass Republic": [
    { name: "Harper Reed", role: "Director", share: 28 },
    { name: "Mateo Garcia", role: "Producer", share: 20 },
    { name: "Zoe Kravitz", role: "Lead Actress", share: 18 },
    { name: "Devon Miles", role: "Writer", share: 14 },
    { name: "Priya Sharma", role: "VFX Supervisor", share: 12 },
    { name: "Lucas Vance", role: "Sound Designer", share: 8 }
  ],
  "Neon Requiem": [
    { name: "Kaito Nakamura", role: "Director", share: 30 },
    { name: "Amara Jones", role: "Lead Actress", share: 25 },
    { name: "Javier Costa", role: "Producer", share: 20 },
    { name: "Samira Ahmed", role: "Writer", share: 15 },
    { name: "Leo Rossi", role: "Cinematographer", share: 10 }
  ]
};

async function seed() {
  console.log('Seeding Moonstone Rights Holders...');
  
  // Clear old
  await supabase.from('project_contributors').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  const { data: projects } = await supabase.from('projects').select('*');
  
  for (const proj of projects) {
    const members = projectData[proj.name];
    if (!members) continue;
    
    for (const member of members) {
      // check if user exists
      let { data: user } = await supabase.from('users').select('id').eq('name', member.name).single();
      if (!user) {
        const { data: newUser, error: insertErr } = await supabase.from('users').insert({
          name: member.name,
          email: member.name.toLowerCase().replace(' ', '.') + '@moonstone.com',
          wallet_address: '0x' + Math.random().toString(16).substring(2, 42).padEnd(40, '0'),
          role: 'Creator'
        }).select('id').single();
        
        if (insertErr) {
          console.error(`Failed to insert user ${member.name}:`, insertErr.message);
          continue;
        }
        user = newUser;
      }
      
      const { error: contribErr } = await supabase.from('project_contributors').insert({
        project_id: proj.id,
        user_id: user.id,
        role: member.role,
        revenue_share: member.share
      });
      if (contribErr) console.error(`Failed to add contributor ${member.name}:`, contribErr.message);
    }
  }
  
  console.log('Done seeding rights holders. Total users should be 29 (6*4 + 5 = 29).');
}
seed().catch(console.error);
