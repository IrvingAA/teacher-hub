import { z } from 'zod';
import { idParamSchema, paginationQuerySchema, sortOrderSchema } from '../_shared/pagination.schemas';

export const eventCategorySchema = z.enum(['request', 'audit']);

export const eventParamsSchema = idParamSchema;

export const listEventsQuerySchema = paginationQuerySchema.extend({
  category: eventCategorySchema.optional(),
  action: z.string().trim().min(1).max(120).optional(),
  actorUserId: z.string().uuid().optional(),
  resourceType: z.string().trim().min(1).max(80).optional(),
  resourceId: z.string().trim().min(1).max(120).optional(),
  requestId: z.string().trim().min(1).max(64).optional(),
  statusCode: z.coerce.number().int().min(100).max(599).optional(),
  search: z.string().trim().min(1).max(160).optional(),
  sortBy: z.enum(['createdAt', 'action', 'statusCode']).default('createdAt'),
  sortOrder: sortOrderSchema.default('desc'),
});

export type ListEventsQueryDto = z.infer<typeof listEventsQuerySchema>;
export type EventParamsDto = z.infer<typeof eventParamsSchema>;
