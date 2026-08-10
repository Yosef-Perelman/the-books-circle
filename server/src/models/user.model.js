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

export async function findByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    ...mapUser(data),
    passwordHash: data.password_hash
  };
}

export async function create({ email, passwordHash, displayName }) {
  const { data, error } = await supabase
    .from('users')
    .insert({
      email: email.toLowerCase(),
      password_hash: passwordHash,
      display_name: displayName
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // unique violation
      const e = new Error('Email already taken');
      e.code = '23505';
      throw e;
    }
    throw error;
  }
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
