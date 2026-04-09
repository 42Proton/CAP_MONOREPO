import { z } from 'zod';

export const createTeamSchema = z.object({
  name: z.string().min(3).max(255),
description: z.string().max(1000).optional().nullable(),
});

export const addMemberSchema = z.object({
  teamId: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['admin', 'developer', 'viewer']),
});

export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;