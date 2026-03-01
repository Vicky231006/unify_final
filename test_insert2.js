const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient('https://orokgwmecfnoaylgjsnm.supabase.co', 'sb_publishable_km8PkfOwxnYSMkoqLFKQqg_LALgU6ES');

async function test() {
  const taskId = uuidv4();
  const dummyAssigneeId = uuidv4(); // A non-existent user
  const projId = uuidv4();

  const { data, error } = await supabase.from('tasks').insert({
    id: taskId,
    workspace_id: 'ws-123',
    project_id: projId,
    title: 'Test FK Constraint',
    type: 'Task',
    assignee_id: dummyAssigneeId,
  });

  if (error) {
    console.error("EXPECTED ERROR (FK Violation):", error.message);
  } else {
    console.log("INSERT WORKED (No FK Violation or RLS blocked insert without error)");
  }
}
test();
