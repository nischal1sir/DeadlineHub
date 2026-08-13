import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const accounts = [
  {
    email: 'superadmin@tracker.com',
    password: 'password123',
    full_name: 'Chief Admin (Super Admin)',
    role: 'super_admin'
  },
  {
    email: 'admin@tracker.com',
    password: 'password123',
    full_name: 'Alex Johnson (Admin)',
    role: 'admin'
  },
  {
    email: 'user@tracker.com',
    password: 'password123',
    full_name: 'Sarah Jenkins',
    role: 'user'
  }
];

for (const account of accounts) {
  console.log(`Creating ${account.role}: ${account.email}...`);

  const { data, error } = await supabase.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
    user_metadata: {
      full_name: account.full_name,
      role: account.role
    }
  });

  if (error) {
    if (error.message.includes('already been registered')) {
      console.log(`  ⚠️  Already exists, updating role in profiles...`);
    } else {
      console.error(`  ❌ Failed: ${error.message}`);
      continue;
    }
  } else {
    console.log(`  ✅ Created auth user: ${data.user.id}`);
  }

  // Upsert the profile with correct role
  const userId = data?.user?.id;
  if (userId) {
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: account.email,
        full_name: account.full_name,
        role: account.role,
        status: 'active',
        avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${account.email}`
      }, { onConflict: 'id' });

    if (profileError) {
      console.error(`  ❌ Profile error: ${profileError.message}`);
    } else {
      console.log(`  ✅ Profile set to role: ${account.role}`);
    }
  }
}

console.log('\n✅ Done! You can now log in with:');
console.log('   superadmin@tracker.com / password123');
console.log('   admin@tracker.com / password123');
console.log('   user@tracker.com / password123');
