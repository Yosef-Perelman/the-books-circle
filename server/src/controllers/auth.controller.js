import * as AuthService from '../services/auth.service.js';

export async function register(req, res) {
  const result = await AuthService.register(req.body);
  res.status(201).json({ data: result });
}

export async function login(req, res) {
  const result = await AuthService.login(req.body);
  res.status(200).json({ data: result });
}

export async function getMe(req, res) {
  const result = await AuthService.getMe(req.user.id);
  res.status(200).json({ data: result });
}
