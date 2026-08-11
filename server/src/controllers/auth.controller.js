import * as AuthService from '../services/auth.service.js';

export async function getMe(req, res) {
  const result = await AuthService.getMe(req.user);
  res.status(200).json({ data: result });
}
