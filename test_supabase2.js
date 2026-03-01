const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://orokgwmecfnoaylgjsnm.supabase.co', 'sb_publishable_km8PkfOwxnYSMkoqLFKQqg_LALgU6ES');

async function test() {
  const { data: q2, error: e2 } = await supabase.from('tasks').select('*').limit(1);
  console.log('Tasks cols:', q2 ? Object.keys(q2[0] || {}) : [], e2?.message || 'OK');
}
test();
