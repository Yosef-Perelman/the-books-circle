import * as CircleService from '../services/circle.service.js';

export async function create(req, res) {
  const circle = await CircleService.createCircle(req.user.id, req.body.name);
  res.status(201).json({ data: { circle } });
}

export async function join(req, res) {
  const circle = await CircleService.joinCircle(req.user.id, req.body.inviteCode);
  res.status(200).json({ data: { circle } });
}

export async function getOne(req, res) {
  const circle = await CircleService.getCircle(req.circleId);
  res.status(200).json({ data: { circle } });
}
