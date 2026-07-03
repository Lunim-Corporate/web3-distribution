const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials missing.');
    return;
  }
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from('rights_holders')
    .select('*')
    .eq('full_name', 'Aria Voss');
  
  if (error) {
    console.error('Error fetching Aria Voss:', error);
    return;
  }
  console.log('Current Aria Voss record:', data);

  if (data && data.length > 0) {
    const { error: updateError } = await supabase
      .from('rights_holders')
      .update({ role: 'Director' })
      .eq('id', data[0].id);
    if (updateError) {
      console.error('Error updating role:', updateError);
    } else {
      console.log('Successfully restored Aria Voss role to Director');
    }
  }
}

run();
