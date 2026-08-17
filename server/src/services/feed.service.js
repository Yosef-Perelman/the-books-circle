import * as PostModel from '../models/post.model.js';

export async function getCircleFeed(circleId, viewerId) {
  return PostModel.findByCircle(circleId, viewerId);
}
