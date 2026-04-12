const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, serviceKey);

async function finalSync() {
  console.log('--- RE-IDENTITY & 5-ROLE SYNC ---');

  // 1. Specialists
  const specialists = [
    { name: 'Quentin Director', email: 'director@moonstone.com', role: 'Director', share: 30 },
    { name: 'Steven Producer', email: 'producer@moonstone.com', role: 'Producer', share: 25 },
    { name: 'Brad Actor', email: 'actor@moonstone.com', role: 'Actor', share: 20 },
    { name: 'Hans Music Writer', email: 'writer@moonstone.com', role: 'Music writer', share: 15 },
    { name: 'Zimmer Composer', email: 'composer@moonstone.com', role: 'Composer', share: 10 },
  ];

  // 2. Ensure Users Exist (Idempotent)
  const userMap = {};
  for (const s of specialists) {
    const { data: user, error } = await supabase
      .from('users')
      .upsert({ 
        email: s.email, 
        name: s.name, 
        role: 'contributor',
        is_active: true
      }, { onConflict: 'email' })
      .select('id')
      .single();
    
    if (error) {
      console.error(`Error upserting user ${s.name}:`, error.message);
      continue;
    }
    userMap[s.email] = user.id;
  }

  // 3. Find and Rename Projects
  const projectMappings = {
    'Music Album Project': 'Moonstone Production (Synced 5/5)',
    'Digital Art Collection': 'Digital Art (Synced 5/5)'
  };

  for (const [oldName, newName] of Object.entries(projectMappings)) {
    const { data: project, error: findError } = await supabase
      .from('projects')
      .select('id, name')
      .ilike('name', oldName)
      .limit(1)
      .single();

    if (findError || !project) {
        console.log(`Could not find project matching "${oldName}". Searching for existing "${newName}" instead.`);
        const { data: existing } = await supabase.from('projects').select('id').ilike('name', newName).limit(1).single();
        if (existing) {
            await syncContributors(existing.id, specialists, userMap);
        }
        continue;
    }

    console.log(`Renaming project ${project.id} from "${project.name}" to "${newName}"`);
    await supabase.from('projects').update({ name: newName }).eq('id', project.id);
    await syncContributors(project.id, specialists, userMap);
  }

  console.log('\n--- SYNC COMPLETE ---');
}

async function syncContributors(projectId, specialists, userMap) {
  // Clear old
  await supabase.from('project_contributors').delete().eq('project_id', projectId);
  
  // Insert new 5 roles
  const inserts = specialists.map(s => ({
    project_id: projectId,
    user_id: userMap[s.email],
    role: s.role,
    revenue_share: s.share,
    total_earned: 0
  }));

  const { error: insertError } = await supabase.from('project_contributors').insert(inserts);
  if (insertError) {
    console.error(`Error inserting roles for ${projectId}:`, insertError.message);
  } else {
    console.log(`Successfully added 5 specialist roles to project ${projectId}`);
  }
}

finalSync();
