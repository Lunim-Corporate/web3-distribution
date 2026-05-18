const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { data: projects, count: pCount } = await supabase.from('projects').select('*', { count: 'exact' });
  const { data: contributors, count: cCount } = await supabase.from('project_contributors').select('*', { count: 'exact' });
  const { data: payments, count: payCount } = await supabase.from('payments').select('*', { count: 'exact' });

  console.log('Projects:', pCount);
  console.log('Contributors:', cCount);
  console.log('Payments:', payCount);
  
  if (payments && payments.length > 0) {
    const sources = payments.map(p => p.source);
    console.log('Sources:', Array.from(new Set(sources)));
  }
}

checkData().catch(console.error);
