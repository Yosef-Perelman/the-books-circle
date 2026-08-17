import { supabase } from '../config/supabase.js';

export async function findFinishedByMembers(memberIds, periodStart) {
  let query = supabase
    .from('user_books')
    .select('user_id, finished_at, book:books(genre, page_count)')
    .in('user_id', memberIds)
    .eq('status', 'finished');

  if (periodStart) {
    query = query.gte('finished_at', periodStart);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data.map((row) => ({
    userId: row.user_id,
    finishedAt: row.finished_at,
    genre: row.book?.genre ?? null,
    pageCount: row.book?.page_count ?? null
  }));
}
