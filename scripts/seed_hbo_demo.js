const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PROJECTS = [
  { name: '🎬 Shadow of the Dragon: The Silver Throne (HBO Series)', type: 'Series', description: 'A high-fantasy epic set in the world of Moonstone.' },
  { name: '📽️ Neon Noir: Metropolis Redux', type: 'Film', description: 'A cyberpunk thriller investigating the digital underbelly.' },
  { name: '📺 The Last Outpost: Season 1', type: 'Series', description: 'Post-apocalyptic drama focusing on the resilience of humanity.' },
  { name: '🎞️ Empire of Glass: New Dawn', type: 'Saga', description: 'A sprawling family saga about power, legacy, and shadows.' },
  { name: '🎦 Midnight Protocol: Premiere', type: 'Special', description: 'The grand opening of the most anticipated Web3 series.' },
  { name: '🎬 The White Lotus: Season 3', type: 'Series', description: 'Social satire set at an exclusive resort.' },
  { name: '📽️ Euphoria: Special Event', type: 'Special', description: 'A cinematic exploration of adolescent life.' },
  { name: '📺 Curb Your Enthusiasm: Final Cut', type: 'Series', description: 'The definitive ending to the legendary comedy.' },
  { name: '🎞️ Mare of Easttown: Returns', type: 'Series', description: 'A gripping investigative mystery set in Pennsylvania.' }
];

const PEOPLE = [
  'Pedro Pascal', 'Bella Ramsey', 'Jeremy Strong', 'Sarah Snook', 'Kieran Culkin',
  'Zendaya', 'Sydney Sweeney', 'Jacob Elordi', 'Hunter Schafer', 'Greta Gerwig',
  'Christopher Nolan', 'Denis Villeneuve', 'Hans Zimmer', 'Ludwig Göransson', 'Roger Deakins',
  'Shonda Rhimes', 'Jesse Armstrong', 'Mike White', 'Craig Mazin', 'Neil Druckmann',
  'Brian Cox', 'Matthew Macfadyen', 'Nicholas Braun', 'James Smith', 'Alan Ruck',
  'Alexander Skarsgård', 'Adrien Brody', 'Hope Davis', 'Natalie Gold', 'Dagmara Domińczy',
  'Arian Moayed', 'Peter Friedman', 'David Rasche', 'Fisher Stevens', 'Hiam Abbass'
];

const ROLES = [
  'Lead Actor', 'Director', 'Executive Producer', 'Screenwriter', 'Composer',
  'Cinematographer', 'Lead Editor', 'Production Designer', 'VFX Supervisor', 'Casting Director'
];

async function seedHBOMoonstone() {
  console.log('🚀 Starting Clean HBO Film Industry Seed (4 People Max per Project)...');

  try {
    // 0. Archive ALL projects not in our HBO list to ensure "only 4 people per project" policy is global
    console.log('🧹 Archiving non-HBO projects to ensure global 4-contributor consistency...');
    const hboNames = PROJECTS.map(p => p.name);
    await supabase.from('projects').update({ status: 'Archived' }).not('name', 'in', `(${hboNames.join(',')})`);

    // 1. Create/Verify Users
    console.log('👥 Syncing 35 Film Industry Professionals...');
    const userIds = [];
    for (const name of PEOPLE) {
      const email = `${name.toLowerCase().replace(/ /g, '.')}@moonstone-hbo.com`;
      let { data: user } = await supabase.from('users').select('id').eq('email', email).single();
      
      if (!user) {
        const { data: created, error } = await supabase
          .from('users')
          .insert({ email, name, role: 'contributor', preferred_payment_method: 'crypto' })
          .select().single();
        user = created;
      }
      userIds.push(user.id);
    }

    const { data: admin } = await supabase.from('users').select('id').eq('role', 'admin').limit(1).single();
    const ownerId = admin?.id || userIds[0];

    // 2. Create/Update HBO Projects
    console.log(`🎬 Managing ${PROJECTS.length} HBO Projects...`);
    let userIdx = 0;

    for (const p of PROJECTS) {
      let { data: project } = await supabase.from('projects').select('id').eq('name', p.name).single();

      if (!project) {
        const { data: created } = await supabase
          .from('projects')
          .insert({ name: p.name, description: p.description, type: p.type, status: 'Active', owner_id: ownerId, total_revenue: 0 })
          .select().single();
        project = created;
      } else {
        // Ensure active status
        await supabase.from('projects').update({ status: 'Active' }).eq('id', project.id);
      }

      console.log(`   ✨ Assigning 4 Shareholders to: ${p.name}`);

      // Clear existing contributors
      await supabase.from('project_contributors').delete().eq('project_id', project.id);

      // Take next 4 users from the pool
      const selectedUsers = [];
      for (let i = 0; i < 4; i++) {
        selectedUsers.push(userIds[userIdx % userIds.length]);
        userIdx++;
      }

      // 100% split among 4 people: 40, 30, 20, 10
      const shares = [40, 30, 20, 10];
      const contributorsData = selectedUsers.map((userId, idx) => ({
        project_id: project.id,
        user_id: userId,
        role: ROLES[idx % ROLES.length],
        revenue_share: shares[idx]
      }));

      await supabase.from('project_contributors').insert(contributorsData);
    }

    console.log('\n✅ Lean HBO Seed Complete! Every active project now has exactly 4 contributors.');
  } catch (err) {
    console.error('❌ Critical Seed Failure:', err.message);
  }
}

seedHBOMoonstone();
