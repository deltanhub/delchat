const assert = require('assert');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/EXPO_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/EXPO_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

async function run() {
  console.log('Testing contact search service RPC on live Supabase...');
  const { data, error } = await supabase.rpc('search_public_user_profiles', {
    query_text: 'fred',
    limit_count: 10
  });

  assert(!error, `RPC should not error: ${JSON.stringify(error)}`);
  assert(Array.isArray(data), 'Result must be an array');
  assert(data.length > 0, 'Should find at least 1 user matching fred');

  const first = data[0];
  assert(first.user_id, 'User must have user_id');
  assert(first.display_name, 'User must have display_name');
  assert(first.main_role, 'User must have main_role');

  console.log(`[PASS] Live search RPC successfully returned ${data.length} users:`);
  data.forEach(u => console.log(`   - ${u.display_name} (@${u.username}) <${u.email}> [${u.main_role}]`));
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
