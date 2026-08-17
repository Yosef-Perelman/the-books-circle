import { supabase } from './src/config/supabase.js';

async function checkSchema() {
  const { data, error } = await supabase.from('feed_posts').select('*').limit(1);
  if (data && data.length > 0) {
    console.log("Columns:", Object.keys(data[0]));
  } else if (data && data.length === 0) {
    // try to insert an empty row to see the error for column hint or just query
    console.log("No data, try to query one with limit");
  } else {
    console.error(error);
  }
}
checkSchema();
