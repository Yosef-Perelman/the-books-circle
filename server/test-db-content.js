import { supabase } from './src/config/supabase.js';

async function check() {
  const { data, error } = await supabase.from('feed_posts').select('content').limit(1);
  console.log("Error:", error);
}
check();
