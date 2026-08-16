import { ApiError } from '../utils/ApiError.js';
import * as CircleModel from '../models/circle.model.js';

// Resolves the circle id from :circleId, :id, or body.circleId so it covers
// GET /circles/:id/*, PATCH/POST routes with :circleId, and bodies that carry
// circleId directly (e.g. POST /user-books). Must run after requireAuth.
export const requireCircleMember = async (req, res, next) => {
  try {
    const circleId = req.params.circleId ?? req.params.id ?? req.body?.circleId;
    if (!circleId) {
      throw new ApiError(400, 'BAD_REQUEST', 'A circle is required.');
    }

    const member = await CircleModel.isMember(circleId, req.user.id);
    if (!member) {
      // 404, not 403 — don't reveal that a circle you're not in exists.
      throw new ApiError(404, 'NOT_FOUND', 'Circle not found.');
    }

    req.circleId = circleId;
    next();
  } catch (err) {
    next(err);
  }
};
