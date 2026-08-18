import { supabase } from './src/config/supabase.js';

async function check() {
  const { data, error } = await supabase.from('circle_members').select('*').eq('user_id', 'undefined');
  console.log("Error:", error);
}
check();
