import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import * as UserModel from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';

export async function register({ displayName, email, password }) {
  const existingUser = await UserModel.findByEmail(email);
  if (existingUser) {
    throw new ApiError(409, 'CONFLICT', 'That email is already registered.');
  }

  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
  const user = await UserModel.create({ email, passwordHash, displayName });

  const token = jwt.sign({ sub: user.id, email: user.email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  return { token, user };
}

export async function login({ email, password }) {
  const userRecord = await UserModel.findByEmail(email);

  // Always run bcrypt to prevent timing attacks leaking account existence
  const isMatch = await bcrypt.compare(
    password,
    userRecord ? userRecord.passwordHash : await bcrypt.hash('dummy', env.BCRYPT_ROUNDS)
  );

  if (!userRecord || !isMatch) {
    throw new ApiError(401, 'UNAUTHENTICATED', 'Email or password is incorrect.');
  }

  // Strip passwordHash from the returned user
  const { passwordHash, ...user } = userRecord;

  const token = jwt.sign({ sub: user.id, email: user.email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  return { token, user };
}

export async function getMe(userId) {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new ApiError(404, 'NOT_FOUND', 'User not found.');
  }
  // Mock circles returning empty array for MVP / Hardcoded UI phase
  return { user, circles: [] };
}
