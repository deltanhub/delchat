const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/EXPO_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/EXPO_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
const url = urlMatch ? urlMatch[1].trim() : '';
const key = keyMatch ? keyMatch[1].trim() : '';
const client = createClient(url, key);

async function testSearch(q) {
  const { data, error } = await client.rpc('search_public_user_profiles', {
    query_text: q,
    limit_count: 5
  });
  console.log(`Query: "${q}" => Found: ${data ? data.length : 0}`, error ? error : '');
  if (data && data.length) {
    data.forEach(d => console.log(`   - ${d.display_name} (@${d.username}) <${d.email}> [${d.main_role}]`));
  }
}

async function run() {
  console.log('Testing search_public_user_profiles via anon key:');
  await testSearch('fred');
  await testSearch('alfred');
  await testSearch('trustgold');
  await testSearch('agent');
  await testSearch('kkmin');
  await testSearch('gmail');
}

run();
