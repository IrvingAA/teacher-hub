import { z } from 'zod';
import { idParamSchema, paginationQuerySchema, sortOrderSchema } from '../_shared/pagination.schemas';

export const createSchoolBodySchema = z.object({
  name: z.string().min(2).max(160),
  isActive: z.boolean().optional(),
  adminUserId: z.string().uuid().optional(),
  setAdminAsDefaultMembership: z.boolean().optional(),
});

export const updateSchoolBodySchema = z.object({
  name: z.string().min(2).max(160).optional(),
  isActive: z.boolean().optional(),
});

export const schoolParamsSchema = idParamSchema;

export const listSchoolsQuerySchema = paginationQuerySchema.extend({
  isActive: z.coerce.boolean().optional(),
  search: z.string().trim().min(1).max(160).optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: sortOrderSchema.default('desc'),
});

export type CreateSchoolDto = z.infer<typeof createSchoolBodySchema>;
export type UpdateSchoolDto = z.infer<typeof updateSchoolBodySchema>;
export type SchoolIdParamsDto = z.infer<typeof schoolParamsSchema>;
export type ListSchoolsQueryDto = z.infer<typeof listSchoolsQuerySchema>;
