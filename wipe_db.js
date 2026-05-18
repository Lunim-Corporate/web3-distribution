const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function wipe() {
  console.log("Wiping database...");
  await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('project_contributors').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  // Optional: delete users, but maybe we leave users alone
  console.log("Wipe complete!");
}
wipe();
