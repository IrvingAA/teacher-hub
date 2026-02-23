import { z } from 'zod';
import { idParamSchema, paginationQuerySchema, sortOrderSchema } from '../_shared/pagination.schemas';

export const globalRoleSchema = z.enum(['owner', 'user']);
export const tenantRoleSchema = z.enum(['admin', 'teacher', 'student']);

export const userMembershipInputSchema = z.object({
  schoolId: z.string().uuid(),
  schoolName: z.string().min(2),
  role: tenantRoleSchema,
  isDefault: z.boolean().optional(),
});

function validateMemberships(memberships: z.infer<typeof userMembershipInputSchema>[], ctx: z.RefinementCtx): void {
  if (memberships.length === 0) {
    return;
  }

  const defaults = memberships.filter((membership) => membership.isDefault);
  if (defaults.length > 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['memberships'],
      message: 'Only one membership can be marked as default',
    });
  }

  const schoolIds = new Set<string>();
  memberships.forEach((membership, index) => {
    if (schoolIds.has(membership.schoolId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['memberships', index, 'schoolId'],
        message: 'Duplicate schoolId in memberships',
      });
      return;
    }

    schoolIds.add(membership.schoolId);
  });
}

export const createUserBodySchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(4),
    globalRole: globalRoleSchema.default('user'),
    memberships: z.array(userMembershipInputSchema).min(1),
  })
  .strict()
  .superRefine((data, ctx) => {
    validateMemberships(data.memberships, ctx);
  });

export const updateUserBodySchema = z
  .object({
    email: z.string().email().optional(),
    password: z.string().min(4).optional(),
    globalRole: globalRoleSchema.optional(),
    memberships: z.array(userMembershipInputSchema).min(1).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.memberships) {
      validateMemberships(data.memberships, ctx);
    }
  });

export const userParamsSchema = idParamSchema;

export const listUsersQuerySchema = paginationQuerySchema.extend({
  globalRole: globalRoleSchema.optional(),
  schoolId: z.string().uuid().optional(),
  search: z.string().trim().min(1).max(120).optional(),
  sortBy: z.enum(['email', 'isActive', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: sortOrderSchema.default('desc'),
});

export type CreateUserDto = z.infer<typeof createUserBodySchema>;
export type UpdateUserDto = z.infer<typeof updateUserBodySchema>;
export type UserIdParamsDto = z.infer<typeof userParamsSchema>;
export type ListUsersQueryDto = z.infer<typeof listUsersQuerySchema>;
export type UserMembershipInputDto = z.infer<typeof userMembershipInputSchema>;
