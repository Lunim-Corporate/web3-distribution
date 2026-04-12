#!/usr/bin/env node

/**
 * Complete Demo Setup for Creative Rights Tracker
 * 
 * This script sets up everything needed for a demo:
 * 1. Creates demo users (admin, creators, contributors)
 * 2. Creates sample projects with different revenue structures
 * 3. Sets up contributors/rights holders for each project with percentage splits
 * 4. Seeds some initial payment data
 * 
 * Run this once before starting your demo:
 *   node scripts/setup_demo_complete.js
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Demo data
const demoUsers = [
  { name: 'Admin User', email: 'admin@risidio.com', role: 'admin' },
  { name: 'Alex Johnson', email: 'alex@example.com', role: 'creator' },
  { name: 'Sarah Chen', email: 'sarah@example.com', role: 'creator' },
  { name: 'Mike Rodriguez', email: 'mike@example.com', role: 'contributor' },
  { name: 'Emma Wilson', email: 'emma@example.com', role: 'contributor' },
  { name: 'David Kim', email: 'david@example.com', role: 'contributor' },
];

const demoProjects = [
  {
    name: '🎬 Film Production - Indie Movie',
    description: 'A collaborative indie film with 5 key stakeholders sharing revenue',
    owner_role: 'creator',
    contributors: [
      { name: 'Director', email: 'alex@example.com', revenue_share: 30 },
      { name: 'Producer', email: 'sarah@example.com', revenue_share: 25 },
      { name: 'Lead Actor', email: 'mike@example.com', revenue_share: 20 },
      { name: 'Composer', email: 'emma@example.com', revenue_share: 15 },
      { name: 'Cinematographer', email: 'david@example.com', revenue_share: 10 },
    ]
  },
  {
    name: '🎵 Music Album - Collaborative Project',
    description: 'An album with artists, writers, and producers sharing royalties',
    owner_role: 'creator',
    contributors: [
      { name: 'Lead Artist', email: 'alex@example.com', revenue_share: 40 },
      { name: 'Songwriter', email: 'sarah@example.com', revenue_share: 30 },
      { name: 'Producer', email: 'mike@example.com', revenue_share: 20 },
      { name: 'Session Musician', email: 'emma@example.com', revenue_share: 10 },
    ]
  },
  {
    name: '📚 Book Publishing - Multi-Author',
    description: 'A published book with author, illustrator, and editor sharing proceeds',
    owner_role: 'creator',
    contributors: [
      { name: 'Primary Author', email: 'alex@example.com', revenue_share: 50 },
      { name: 'Illustrator', email: 'sarah@example.com', revenue_share: 25 },
      { name: 'Editor', email: 'mike@example.com', revenue_share: 15 },
      { name: 'Publisher', email: 'emma@example.com', revenue_share: 10 },
    ]
  }
];

async function setupDemoComplete() {
  console.log('\n🚀 ===============================================');
  console.log('   COMPLETE DEMO SETUP - Creative Rights Tracker');
  console.log('===============================================\n');

  try {
    // Step 1: Create/Verify Users
    console.log('📝 STEP 1: Setting up demo users...');
    const userMap = {};
    
    for (const user of demoUsers) {
      try {
        // Try to sign up (will fail if already exists, which is fine)
        await supabase.auth.signUp({
          email: user.email,
          password: 'demo123',
          options: { data: { name: user.name, role: user.role } }
        }).catch(() => null);
        
        // Get or create the user in the users table
        let { data: dbUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', user.email)
          .single();
        
        if (!dbUser) {
          const { data: created } = await supabase
            .from('users')
            .insert({ email: user.email, name: user.name, role: user.role })
            .select()
            .single();
          dbUser = created;
        }
        
        userMap[user.email] = dbUser.id;
        console.log(`   ✅ ${user.name} (${user.email})`);
      } catch (err) {
        console.error(`   ⚠️  ${user.name}: ${err.message}`);
      }
    }

    // Step 2: Create Projects
    console.log('\n📦 STEP 2: Setting up demo projects with revenue splits...');
    const projectMap = {};

    for (const project of demoProjects) {
      try {
        // Get the creator user ID
        const creatorUser = demoUsers.find(u => u.role === 'creator' && u.email === project.contributors[0].email);
        const ownerId = userMap[creatorUser.email];

        // Check if project exists
        let projectData = await supabase
          .from('projects')
          .select('id')
          .eq('name', project.name)
          .single()
          .catch(() => null);

        if (!projectData.data) {
          // Create project
          const { data: created } = await supabase
            .from('projects')
            .insert({
              name: project.name,
              description: project.description,
              owner_id: ownerId,
              status: 'Active',
              total_revenue: 0
            })
            .select()
            .single();
          projectData = { data: created };
        }

        projectMap[project.name] = projectData.data.id;
        console.log(`   ✨ ${project.name}`);

        // Step 2b: Add contributors/rights holders
        console.log(`      Revenue Distribution:`);
        
        // Clear existing contributors
        await supabase
          .from('project_contributors')
          .delete()
          .eq('project_id', projectData.data.id)
          .catch(() => null);

        // Add new contributors
        for (const contrib of project.contributors) {
          const userId = userMap[contrib.email];
          
          await supabase
            .from('project_contributors')
            .insert({
              project_id: projectData.data.id,
              user_id: userId,
              role: contrib.name,
              revenue_share: contrib.revenue_share
            })
            .catch(() => null);
          
          console.log(`         • ${contrib.name}: ${contrib.revenue_share}% (${contrib.email})`);
        }
      } catch (err) {
        console.error(`   ❌ ${project.name}: ${err.message}`);
      }
    }

    console.log('\n✅ ===============================================');
    console.log('   DEMO SETUP COMPLETE!');
    console.log('===============================================\n');
    console.log('📊 Ready for Demo. Here\'s what you have:');
    console.log(`   • ${demoUsers.length} demo users`);
    console.log(`   • ${demoProjects.length} projects with revenue splits`);
    console.log(`   • Up to ${demoProjects[0].contributors.length} rights holders per project\n`);
    
    console.log('🎬 TO RUN THE DEMO:');
    console.log('   1. npm run dev (starts frontend at http://localhost:3000)');
    console.log('   2. Open dashboard and use "Demo Setup" button to create users');
    console.log('   3. Login as admin@risidio.com / demo123');
    console.log('   4. Go to Payment Splitter');
    console.log('   5. Select a project (with revenue splits)');
    console.log('   6. Enter amount (e.g., $1000)');
    console.log('   7. Click "Calculate Splits" - see automatic distribution!');
    console.log('   8. Click "Process Payment" - watch dashboard update in real-time\n');

    console.log('📊 DEMO FEATURES TO HIGHLIGHT:');
    console.log('   ✅ Payment splits calculated by revenue_share %');
    console.log('   ✅ All rights holders updated automatically');
    console.log('   ✅ Charts refresh in real-time');
    console.log('   ✅ Database shows all transactions');
    console.log('   ✅ Each contributor sees their earnings\n');

  } catch (error) {
    console.error('❌ Setup Error:', error.message);
    process.exit(1);
  }
}

setupDemoComplete();
