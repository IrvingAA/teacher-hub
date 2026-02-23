import { z } from 'zod';

export const sortOrderSchema = z.enum(['asc', 'desc']);

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export type PaginationQueryDto = z.infer<typeof paginationQuerySchema>;
