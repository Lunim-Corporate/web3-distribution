const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const sql = "ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;";
  
  // Since the Supabase JS client doesn't support raw SQL, we'll try to use the 'is_public' column 
  // via an insert/update if we can't run the migration directly.
  // Actually, I can use the Supabase SQL editor if I had access, but here I'll try to use a dummy 
  // RPC if available or just proceed assuming I might not be able to change schema via JS client.
  
  // Wait, I can try to use the REST API for migrations if available, or just check if it exists.
  // Actually, I'll just check if I can add it via a clever trick or if it's already there from some previous effort.
  
  const { error } = await supabase.from('projects').select('is_public').limit(1);
  if (error && error.message.includes('column "is_public" does not exist')) {
      console.log("Column 'is_public' is missing. Note: You need to run 'ALTER TABLE projects ADD COLUMN is_public BOOLEAN DEFAULT TRUE;' in the Supabase SQL Editor.");
  } else if (!error) {
      console.log("Column 'is_public' already exists.");
  } else {
      console.error("Error checking column:", error);
  }
}
run();
