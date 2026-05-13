require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('projects').select('*, project_contributors(id, user_id, role, revenue_share, users(name, wallet_address))');
  console.log('Projects error:', error);
  if (data) {
    console.log('Projects count:', data.length);
  }
}
check().catch(console.error);
