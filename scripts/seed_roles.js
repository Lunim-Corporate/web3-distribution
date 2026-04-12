const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log('🚀 Starting 5-Role Revenue Breakdown Seeding...\n');

  const specialists = [
    { name: 'Quentin Director', email: 'director@moonstone.com', role: 'director', share: 30 },
    { name: 'Steven Producer', email: 'producer@moonstone.com', role: 'producer', share: 25 },
    { name: 'Brad Actor', email: 'actor@moonstone.com', role: 'actor', share: 20 },
    { name: 'Hans Music Writer', email: 'writer@moonstone.com', role: 'music writer', share: 15 },
    { name: 'Zimmer Composer', email: 'composer@moonstone.com', role: 'composer', share: 10 }
  ];

  // 1. Ensure Users Exist
  const userMap = {};
  for (const s of specialists) {
    const { data: existing } = await supabase.from('users').select('id').eq('email', s.email).single();
    if (existing) {
      userMap[s.role] = existing.id;
      console.log(`✅ User ${s.name} (${s.role}) already exists.`);
    } else {
      const { data: newUser, error } = await supabase.from('users').insert({
        email: s.email,
        name: s.name,
        role: 'contributor' // system internal role
      }).select().single();
      
      if (error) {
        console.error(`❌ Error creating ${s.name}:`, error.message);
        continue;
      }
      userMap[s.role] = newUser.id;
      console.log(`✨ Created User: ${s.name} as ${s.role}`);
    }
  }

  // 2. Target Projects
  const { data: projects } = await supabase.from('projects').select('id, name');
  if (!projects || projects.length === 0) {
    console.error('❌ No projects found to seed contributors.');
    return;
  }

  for (const project of projects) {
    console.log(`\n📦 Updating ${project.name}...`);
    
    // Clean existing contributors
    const { error: deleteError } = await supabase
      .from('project_contributors')
      .delete()
      .eq('project_id', project.id);
    
    if (deleteError) {
      console.error(`❌ Failed to clean contributors for ${project.name}:`, deleteError.message);
      continue;
    }

    // Insert new 5-role split
    const newContributors = specialists.map(s => ({
      project_id: project.id,
      user_id: userMap[s.role],
      role: s.role.charAt(0).toUpperCase() + s.role.slice(1), // Capitalize for UI
      revenue_share: s.share
    }));

    const { error: insertError } = await supabase
      .from('project_contributors')
      .insert(newContributors);

    if (insertError) {
      console.error(`❌ Failed to add 5-role split to ${project.name}:`, insertError.message);
    } else {
      console.log(`✅ Project ${project.name} now has 5 distinct revenue roles totaling 100%.`);
    }
  }

  console.log('\n🌟 Seeding Complete! Refresh your dashboard now.');
}

seed();
