require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkProjects() {
  const { data, error } = await supabase.from('projects').select('id, name, status');
  if (error) {
    console.error(error);
    return;
  }
  console.log(JSON.stringify(data, null, 2));
}

checkProjects();
