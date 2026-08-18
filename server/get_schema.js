import { supabase } from './src/config/supabase.js';

async function check() {
  const { data, error } = await supabase.rpc('get_schema_info_missing');
  // fallback to just querying a row
  const { data: row, error: err2 } = await supabase.from('user_books').select('*').limit(1);
  console.log(row ? Object.keys(row[0]) : err2);
  
  const { data: row2, error: err3 } = await supabase.from('feed_posts').select('*').limit(1);
  console.log(row2 ? Object.keys(row2[0]) : err3);
}
check();
