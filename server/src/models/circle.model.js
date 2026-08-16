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
