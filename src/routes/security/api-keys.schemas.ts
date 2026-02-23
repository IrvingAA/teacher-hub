import { z } from 'zod';
import { idParamSchema } from '../_shared/pagination.schemas';

export const createApiKeyBodySchema = z.object({
  name: z.string().trim().min(2).max(120),
  scopes: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  expiresAt: z.coerce.date().optional(),
});

export const apiKeyParamsSchema = idParamSchema;

export type CreateApiKeyDto = z.infer<typeof createApiKeyBodySchema>;
