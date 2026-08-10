import { supabase } from '../config/supabase.js';

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at
  };
}

export async function upsertFromGoogle({ id, email, displayName, avatarUrl }) {
  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        id,
        email: email.toLowerCase(),
        display_name: displayName,
        avatar_url: avatarUrl
      },
      { onConflict: 'id' }
    )
    .select()
    .single();

  if (error) throw error;
  return mapUser(data);
}

export async function findById(id) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return mapUser(data);
}
