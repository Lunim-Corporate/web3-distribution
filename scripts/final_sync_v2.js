const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, serviceKey);

async function syncWithoutActive() {
  const specialists = [
    { name: 'Quentin Director', email: 'director@moonstone.com', role: 'Director', share: 30 },
    { name: 'Steven Producer', email: 'producer@moonstone.com', share: 25 }, // test missing role
    { name: 'Brad Actor', email: 'actor@moonstone.com', share: 20 },
    { name: 'Hans Music Writer', email: 'writer@moonstone.com', share: 15 },
    { name: 'Zimmer Composer', email: 'composer@moonstone.com', share: 10 },
  ];

  // Map roles correctly
  const specRoles = {
    'director@moonstone.com': 'Director',
    'producer@moonstone.com': 'Producer',
    'actor@moonstone.com': 'Actor',
    'writer@moonstone.com': 'Music writer',
    'composer@moonstone.com': 'Composer'
  };

  const userMap = {};
  for (const s of specialists) {
    const { data: user, error } = await supabase
      .from('users')
      .upsert({ email: s.email, name: s.name, role: 'contributor' }, { onConflict: 'email' })
      .select('id')
      .single();
    if (error) { console.error(error.message); continue; }
    userMap[s.email] = user.id;
  }

  const { data: projects } = await supabase.from('projects').select('id, name');
  for (const p of projects) {
    if (p.name.includes('Music Album') || p.name.includes('Moonstone')) {
      await supabase.from('projects').update({ name: 'Moonstone Production (Synced 5/5)' }).eq('id', p.id);
      await sync(p.id, specialists, userMap, specRoles);
    } else if (p.name.includes('Digital Art')) {
      await supabase.from('projects').update({ name: 'Digital Art (Synced 5/5)' }).eq('id', p.id);
      await sync(p.id, specialists, userMap, specRoles);
    }
  }
}

async function sync(id, specs, map, roles) {
  await supabase.from('project_contributors').delete().eq('project_id', id);
  const inserts = specs.map(s => ({
    project_id: id,
    user_id: map[s.email],
    role: roles[s.email],
    revenue_share: s.share
  }));
  await supabase.from('project_contributors').insert(inserts);
}

syncWithoutActive();
