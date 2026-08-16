import * as UserModel from '../models/user.model.js';
import * as CircleModel from '../models/circle.model.js';

export async function getMe(user) {
  const provisionedUser = await UserModel.upsertFromGoogle(user);
  const circles = await CircleModel.findByUser(provisionedUser.id);
  return { user: provisionedUser, circles };
}
