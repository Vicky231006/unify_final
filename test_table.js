const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://orokgwmecfnoaylgjsnm.supabase.co', 'sb_publishable_km8PkfOwxnYSMkoqLFKQqg_LALgU6ES');

async function test() {
  const { data, error } = await supabase.from('tasks').select('*').limit(1);
  console.log('Tasks table:', error ? error.message : 'EXISTS');
}
test();
