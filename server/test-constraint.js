import { supabase } from './src/config/supabase.js';

async function check() {
  const { data, error } = await supabase.from('feed_posts').insert({
    circle_id: '2d814d44-fbf3-45e5-bf22-ed0195df798f',
    user_id: '15ec8a50-286d-4954-b9ac-beba3a0086ea',
    type: 'review',
    content: 'test constraint'
  }).select();
  console.log("Error:", error);
  if (data) {
     await supabase.from('feed_posts').delete().eq('id', data[0].id);
     console.log("Cleanup done");
  }
}
check();
