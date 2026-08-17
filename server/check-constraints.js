import { supabase } from './src/config/supabase.js';

async function check() {
  const { data, error } = await supabase.rpc('get_table_info', { table_name: 'feed_posts' });
  // If rpc fails, we can just try to insert a post with type 'text' to see if it throws check constraint violation
  const { error: insertError } = await supabase.from('feed_posts').insert({
    circle_id: '123e4567-e89b-12d3-a456-426614174000', 
    user_id: '9524ed14-c1a1-457d-b319-5329add92f84', 
    type: 'text' 
  });
  console.log("Insert Error:", insertError);
}
check();
