require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function updateSource() {
  await supabase.from('payments').update({ source: 'Client Payment' }).neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Updated source');
}
updateSource();
