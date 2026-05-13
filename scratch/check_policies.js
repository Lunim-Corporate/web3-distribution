
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPolicies() {
  console.log('Checking Policies...');
  try {
    const { data, error } = await supabase.rpc('check_policies'); // unlikely to exist
    if (error) {
      // Try raw query if possible, but we don't have a direct SQL runner usually
      console.error('RPC Error:', error.message);
      
      // Let's try to query a known system table if allowed
      const { data: pols, error: pErr } = await supabase.from('pg_policies').select('*'); // also unlikely
      if (pErr) console.error('PG Policies Error:', pErr.message);
      else console.log('Policies:', pols);
    } else {
      console.log('Policies:', data);
    }
  } catch (err) {
    console.error('Catch Error:', err);
  }
}

checkPolicies();
