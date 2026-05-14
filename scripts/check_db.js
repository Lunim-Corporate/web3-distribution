const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: projects } = await supabase.from('projects').select('id, name, total_revenue');
  console.log('Projects:', projects);
  
  const { data: payments } = await supabase.from('payments').select('id, amount, project_id');
  const total = (payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
  console.log('Total Payments Amount (cents):', total);
  console.log('Total Payments Amount (USD):', total / 100);
}
check();
