const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://orokgwmecfnoaylgjsnm.supabase.co', 'sb_publishable_km8PkfOwxnYSMkoqLFKQqg_LALgU6ES');

async function test() {
  const { data: q1, error: e1 } = await supabase.from('employees').select('*').limit(1);
  console.log('Employees:', q1, e1?.message || 'OK');
  
  const { data: q2, error: e2 } = await supabase.from('tasks').select('*').limit(1);
  console.log('Tasks:', q2, e2?.message || 'OK');
}
test();
