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

export async function getMembers(circleId) {
  const { data, error } = await supabase
    .from('circle_members')
    .select('users (id, display_name, avatar_url)')
    .eq('circle_id', circleId);

  if (error) throw error;
  return data.map(m => ({
    id: m.users.id,
    name: m.users.display_name,
    avatarUrl: m.users.avatar_url
  }));
}

export async function createCircle(name, creatorUserId) {
  // Generate random 6 character alphanumeric invite code
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const { data: circle, error: circleError } = await supabase
    .from('circles')
    .insert({ name, invite_code: inviteCode })
    .select()
    .single();

  if (circleError) throw circleError;

  const { error: memberError } = await supabase
    .from('circle_members')
    .insert({ circle_id: circle.id, user_id: creatorUserId });

  if (memberError) throw memberError;

  return mapCircle(circle, 1);
}

export async function joinCircle(inviteCode, userId) {
  const { data: circle, error: circleError } = await supabase
    .from('circles')
    .select('id, name, invite_code, created_at')
    .eq('invite_code', inviteCode)
    .single();

  if (circleError || !circle) throw new Error('Invalid invite code');

  // Check if already a member
  const isMem = await isMember(circle.id, userId);
  if (isMem) throw new Error('Already a member of this circle');

  const { error: memberError } = await supabase
    .from('circle_members')
    .insert({ circle_id: circle.id, user_id: userId });

  if (memberError) throw memberError;

  // Get new member count
  const { count, error: countError } = await supabase
    .from('circle_members')
    .select('circle_id', { count: 'exact', head: true })
    .eq('circle_id', circle.id);

  if (countError) throw countError;

  return mapCircle(circle, count || 1);
}

export async function joinCircleById(circleId, userId) {
  const { data: circle, error: circleError } = await supabase
    .from('circles')
    .select('id, name, invite_code, created_at')
    .eq('id', circleId)
    .single();

  if (circleError || !circle) throw new Error('Circle not found');

  // Check if already a member
  const isMem = await isMember(circle.id, userId);
  if (isMem) throw new Error('Already a member of this circle');

  const { error: memberError } = await supabase
    .from('circle_members')
    .insert({ circle_id: circle.id, user_id: userId });

  if (memberError) throw memberError;

  // Get new member count
  const { count, error: countError } = await supabase
    .from('circle_members')
    .select('circle_id', { count: 'exact', head: true })
    .eq('circle_id', circle.id);

  if (countError) throw countError;

  return mapCircle(circle, count || 1);
}

export async function getCircleById(circleId) {
  const { data: circle, error } = await supabase
    .from('circles')
    .select('id, name, invite_code, created_at')
    .eq('id', circleId)
    .single();

  if (error || !circle) throw new Error('Circle not found');

  const { count } = await supabase
    .from('circle_members')
    .select('circle_id', { count: 'exact', head: true })
    .eq('circle_id', circleId);

  return mapCircle(circle, count || 0);
}

export async function leaveCircle(circleId, userId) {
  const { error } = await supabase
    .from('circle_members')
    .delete()
    .eq('circle_id', circleId)
    .eq('user_id', userId);

  if (error) throw error;
  return true;
}

export async function getRecommendedCircles(userId) {
  // Get circles the user is in
  const { data: memberships } = await supabase
    .from('circle_members')
    .select('circle_id')
    .eq('user_id', userId);
    
  const myCircleIds = memberships ? memberships.map(m => m.circle_id) : [];

  let query = supabase
    .from('circles')
    .select('id, name, invite_code, created_at')
    .limit(5);

  if (myCircleIds.length > 0) {
    query = query.not('id', 'in', `(${myCircleIds.join(',')})`);
  }
  
  const { data: circles, error } = await query;
  if (error) throw error;

  // Recommended to non-members by design (AI discovery) — never include the
  // invite code here, or a chat reply could hand a stranger a private circle's key.
  return circles.map(c => ({ id: c.id, name: c.name, createdAt: c.created_at }));
}
