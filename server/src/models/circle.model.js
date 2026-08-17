import { supabase } from '../config/supabase.js';

function mapCircle(row, memberCount) {
  return {
    id: row.id,
    name: row.name,
    inviteCode: row.invite_code,
    memberCount,
    createdAt: row.created_at
  };
}

export async function isMember(circleId, userId) {
  const { data, error } = await supabase
    .from('circle_members')
    .select('circle_id')
    .eq('circle_id', circleId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function findByUser(userId) {
  const { data: memberships, error: membershipsError } = await supabase
    .from('circle_members')
    .select('circle_id')
    .eq('user_id', userId);

  if (membershipsError) throw membershipsError;
  const circleIds = memberships.map((m) => m.circle_id);
  if (circleIds.length === 0) return [];

  const { data: circles, error: circlesError } = await supabase
    .from('circles')
    .select('id, name, invite_code, created_at')
    .in('id', circleIds);

  if (circlesError) throw circlesError;

  const { data: allMembers, error: countError } = await supabase
    .from('circle_members')
    .select('circle_id')
    .in('circle_id', circleIds);

  if (countError) throw countError;

  const counts = {};
  for (const m of allMembers) counts[m.circle_id] = (counts[m.circle_id] ?? 0) + 1;

  return circles.map((c) => mapCircle(c, counts[c.id] ?? 0));
}

async function countMembers(circleId) {
  const { count, error } = await supabase
    .from('circle_members')
    .select('user_id', { count: 'exact', head: true })
    .eq('circle_id', circleId);

  if (error) throw error;
  return count ?? 0;
}

export async function create({ name, inviteCode, creatorId }) {
  const { data, error } = await supabase
    .from('circles')
    .insert({ name, invite_code: inviteCode, creator_id: creatorId })
    .select()
    .single();

  if (error) throw error;
  return mapCircle(data, 0);
}

export async function findById(circleId) {
  const { data, error } = await supabase
    .from('circles')
    .select('id, name, invite_code, created_at')
    .eq('id', circleId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapCircle(data, await countMembers(data.id));
}

export async function findByInviteCode(code) {
  const { data, error } = await supabase
    .from('circles')
    .select('id, name, invite_code, created_at')
    .eq('invite_code', code)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapCircle(data, await countMembers(data.id));
}

export async function listMembers(circleId) {
  const { data, error } = await supabase
    .from('circle_members')
    .select('user:users(id, display_name, avatar_url)')
    .eq('circle_id', circleId);

  if (error) throw error;
  return data.map((row) => ({
    id: row.user.id,
    displayName: row.user.display_name,
    avatarUrl: row.user.avatar_url
  }));
}

export async function addMember(circleId, userId) {
  const { error } = await supabase
    .from('circle_members')
    .insert({ circle_id: circleId, user_id: userId });

  if (error) {
    if (error.code === '23505') {
      const e = new Error('Already a member of this circle');
      e.code = '23505';
      throw e;
    }
    throw error;
  }
}

// Compensation only — used when a create() succeeds but the creator's
// membership insert fails, so no circle is ever left without a member.
export async function deleteById(circleId) {
  const { error } = await supabase.from('circles').delete().eq('id', circleId);
  if (error) throw error;
}
