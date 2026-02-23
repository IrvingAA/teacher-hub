import { z } from 'zod';
import { idParamSchema, paginationQuerySchema, sortOrderSchema } from '../_shared/pagination.schemas';

export const teacherStatusSchema = z.enum(['active', 'inactive', 'on_leave']);

const teacherFieldsSchema = z.object({
  userId: z.string().uuid(),
  schoolId: z.string().uuid(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  specialization: z.string().min(2),
  phoneNumber: z
    .string()
    .regex(/^\+?[0-9\s\-()]{7,20}$/)
    .optional(),
  hireDate: z.coerce.date(),
}).strict();

function validateHireDateNotFuture(hireDate: Date, ctx: z.RefinementCtx): void {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (hireDate > today) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['hireDate'],
      message: 'hireDate cannot be in the future',
    });
  }
}

export const createTeacherBodySchema = teacherFieldsSchema.superRefine((data, ctx) => {
  validateHireDateNotFuture(data.hireDate, ctx);
});

export const updateTeacherBodySchema = teacherFieldsSchema.partial().superRefine((data, ctx) => {
  if (data.userId !== undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['userId'],
      message: 'userId cannot be updated',
    });
  }

  if (data.schoolId !== undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['schoolId'],
      message: 'schoolId cannot be updated',
    });
  }

  if (data.hireDate) {
    validateHireDateNotFuture(data.hireDate, ctx);
  }
});

export const teacherParamsSchema = idParamSchema;

export const listTeachersQuerySchema = paginationQuerySchema.extend({
  schoolId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  status: teacherStatusSchema.optional(),
  specialization: z.string().min(2).optional(),
  search: z.string().trim().min(1).max(120).optional(),
  sortBy: z.enum(['firstName', 'lastName', 'hireDate', 'createdAt']).default('createdAt'),
  sortOrder: sortOrderSchema.default('desc'),
});

export type CreateTeacherDto = z.infer<typeof createTeacherBodySchema>;
export type UpdateTeacherDto = z.infer<typeof updateTeacherBodySchema>;
export type TeacherIdParamsDto = z.infer<typeof teacherParamsSchema>;
export type ListTeachersQueryDto = z.infer<typeof listTeachersQuerySchema>;
