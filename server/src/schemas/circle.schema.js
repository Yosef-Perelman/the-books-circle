import { z } from 'zod';

export const createCircleSchema = z.object({
  name: z.string().trim().min(1, 'Please enter a circle name.').max(50)
});

export const joinCircleSchema = z.object({
  inviteCode: z.string().trim().min(1, 'Please enter an invite code.')
});

export const leaderboardQuerySchema = z.object({
  period: z.enum(['month', 'all']).default('month')
});
