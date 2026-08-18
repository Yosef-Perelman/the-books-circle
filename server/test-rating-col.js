import { supabase } from './src/config/supabase.js';

async function check() {
  const { data, error } = await supabase.from('user_books').select('rating').limit(1);
  if (error) {
    console.log("Error:", error.message);
  } else {
    console.log("Success! The rating column exists.");
  }
}
check();
