import { supabase } from './src/config/supabase.js';

async function run() {
  const { data, error } = await supabase.from('users').select('*');
  console.log("USERS:", data);
}
run();
