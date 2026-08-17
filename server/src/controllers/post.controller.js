import * as PostService from '../services/post.service.js';

export async function like(req, res) {
  const result = await PostService.likePost(req.params.id, req.user.id);
  res.status(200).json({ data: result });
}

export async function unlike(req, res) {
  const result = await PostService.unlikePost(req.params.id, req.user.id);
  res.status(200).json({ data: result });
}
