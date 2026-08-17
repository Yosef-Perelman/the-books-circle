import { supabase } from './src/config/supabase.js';

async function check() {
  const { data, error } = await supabase.from('feed_posts').insert({
    user_id: '15ec8a50-286d-4954-b9ac-beba3a0086ea',
    type: 'text',
    content: 'Global post test'
  });
  console.log("Error:", error);
}
check();
