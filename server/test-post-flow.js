import { supabase } from './src/config/supabase.js';

async function getLatestPost() {
  const { data, error } = await supabase.from('feed_posts').select('*').order('created_at', { ascending: false }).limit(2);
  console.log(data);
}

getLatestPost();
