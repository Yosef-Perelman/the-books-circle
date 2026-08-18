import { supabase } from './src/config/supabase.js';

async function check() {
  const { data: users } = await supabase.from('users').select('id, display_name').eq('display_name', 'daniel yanovsky');
  console.log("Users:", users);
  
  if (users.length > 0) {
    const userId = users[0].id;
    const { data: userBooks } = await supabase.from('user_books').select('*').eq('user_id', userId);
    console.log("User Books:", userBooks.length);
  }
}
check();
