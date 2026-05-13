const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Use service role key to manage users
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const email = 'jeevesh039@gmail.com';
  const password = 'Jeevesh01@';

  console.log(`Setting up admin user: ${email}`);

  // 1. Create or update auth user
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("List users error:", listError);
    return;
  }

  let user = users.find(u => u.email === email);
  let userId;

  if (user) {
    console.log("User already exists in Auth. Updating password...");
    const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: password,
      user_metadata: { role: 'admin', name: 'Jeevesh' }
    });
    if (updateError) {
      console.error("Update password error:", updateError);
    } else {
      console.log("Password updated successfully.");
    }
    userId = user.id;
  } else {
    console.log("Creating new Auth user...");
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { role: 'admin', name: 'Jeevesh' }
    });
    if (createError) {
      console.error("Create user error:", createError);
      return;
    }
    console.log("User created in Auth successfully.");
    userId = created.user.id;
  }

  // 2. Ensure record in public.users table
  const { data: dbUser } = await supabase.from('users').select('id').eq('id', userId).maybeSingle();
  if (dbUser) {
    console.log("Record exists in public.users. Updating role to admin...");
    await supabase.from('users').update({ role: 'admin', name: 'Jeevesh' }).eq('id', userId);
  } else {
    console.log("Creating record in public.users...");
    await supabase.from('users').insert([{
      id: userId,
      email: email,
      name: 'Jeevesh',
      role: 'admin'
    }]);
  }

  console.log(`Admin setup complete for ${email}`);
}
run();
