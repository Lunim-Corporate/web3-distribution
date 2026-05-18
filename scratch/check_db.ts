import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role to bypass RLS

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { data: projects, count: pCount } = await supabase.from('projects').select('*', { count: 'exact' });
  const { data: contributors, count: cCount } = await supabase.from('project_contributors').select('*', { count: 'exact' });
  const { data: payments, count: payCount } = await supabase.from('payments').select('*', { count: 'exact' });

  console.log('Projects:', pCount);
  console.log('Contributors:', cCount);
  console.log('Payments:', payCount);
  
  if (payments && payments.length > 0) {
    console.log('Sources:', [...new Set(payments.map(p => p.source))]);
  }
}

checkData();
