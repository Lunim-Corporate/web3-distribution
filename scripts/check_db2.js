require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function check() {
  const { data, error } = await supabase.from('project_contributors').insert({
    project_id: '5b7758e0-625e-4244-963e-6e75d0542c32', // Use an existing id
    user_id: 'a03f0c2e-ee7f-4181-b927-7660ab015cad',
    revenue_share: 10,
    role: 'Dev',
  }).select();
  console.log('Error:', error);
}
check();
