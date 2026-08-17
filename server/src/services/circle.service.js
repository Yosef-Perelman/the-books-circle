import { ApiError } from '../utils/ApiError.js';
import * as CircleModel from '../models/circle.model.js';
import { generateInviteCode, normalizeInviteCode } from '../utils/inviteCode.js';

const MAX_CODE_ATTEMPTS = 5;

export async function createCircle(userId, name) {
  let circle = null;

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
    try {
      circle = await CircleModel.create({
        name,
        inviteCode: generateInviteCode(),
        creatorId: userId
      });
      break;
    } catch (err) {
      const isLastAttempt = attempt === MAX_CODE_ATTEMPTS - 1;
      if (err.code === '23505' && !isLastAttempt) continue;
      throw err;
    }
  }

  try {
    await CircleModel.addMember(circle.id, userId);
  } catch (err) {
    // The two inserts aren't transactional through supabase-js — if the
    // membership fails, don't leave an orphaned circle with no members.
    await CircleModel.deleteById(circle.id);
    throw err;
  }

  return { ...circle, memberCount: 1 };
}

export async function joinCircle(userId, rawCode) {
  const code = normalizeInviteCode(rawCode);
  const circle = code ? await CircleModel.findByInviteCode(code) : null;

  if (!circle) {
    throw new ApiError(404, 'NOT_FOUND', 'No circle found with that code.');
  }

  if (await CircleModel.isMember(circle.id, userId)) {
    throw new ApiError(409, 'CONFLICT', "You're already in this circle.");
  }

  await CircleModel.addMember(circle.id, userId);
  const members = await CircleModel.listMembers(circle.id);

  return { ...circle, memberCount: members.length, members };
}

export async function getCircle(circleId) {
  const circle = await CircleModel.findById(circleId);
  const members = await CircleModel.listMembers(circleId);
  return { ...circle, members };
}
