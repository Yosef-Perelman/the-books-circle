import * as UserModel from '../models/user.model.js';

export async function getMe(user) {
  const provisionedUser = await UserModel.upsertFromGoogle(user);
  return { user: provisionedUser, circles: [] };
}
