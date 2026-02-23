import { z } from 'zod';
import type { SeedUser } from '../../types/seed/seed.type';

const membershipSchema = z.object({
  schoolId: z.string().uuid(),
  schoolName: z.string().min(2),
  role: z.enum(['admin', 'teacher', 'student']),
  isDefault: z.boolean().optional(),
  profile: z
    .object({
      firstName: z.string().min(2),
      lastName: z.string().min(2),
      phoneNumber: z
        .string()
        .regex(/^\+?[0-9\s\-()]{7,20}$/)
        .optional()
        .nullable(),
      specialization: z.string().min(2).optional().nullable(),
      hireDate: z.coerce.date().optional().nullable(),
      status: z.enum(['active', 'inactive', 'on_leave']).optional().nullable(),
    })
    .optional(),
});

export const seedUserSchema = z
  .object({
    id: z.string().uuid().optional(),
    email: z.string().email(),
    password: z.string().min(4),
    globalRole: z.enum(['owner', 'user']).optional(),
    memberships: z.array(membershipSchema).min(1),
  })
  .superRefine((user, ctx) => {
    const defaults = user.memberships.filter((membership) => membership.isDefault);
    if (defaults.length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['memberships'],
        message: 'Only one membership can be marked as default',
      });
    }

    const schoolIds = new Set<string>();
    user.memberships.forEach((membership, index) => {
      if (schoolIds.has(membership.schoolId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['memberships', index, 'schoolId'],
          message: 'Duplicate schoolId in memberships',
        });
        return;
      }
      schoolIds.add(membership.schoolId);

      if (membership.role === 'teacher' && !membership.profile) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['memberships', index, 'profile'],
          message: 'Teacher memberships require profile data in seed catalog',
        });
      }
    });
  });

export const seedUsersSchema = z.array(seedUserSchema).superRefine((users, ctx) => {
  const seenEmails = new Set<string>();

  users.forEach((user, index) => {
    const key = user.email.toLowerCase();
    if (seenEmails.has(key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [index, 'email'],
        message: `Duplicate seed email: ${user.email}`,
      });
      return;
    }
    seenEmails.add(key);
  });
});

export const seedUsers: SeedUser[] = [
  {
    id: '33333333-3333-4333-8333-333333333333',
    email: 'owner@teacherhub.mail',
    password: '$2b$10$WjoTuYsc3qFXTl8MgAKHUOFgnd2qjqM555MNfHBe7agJdoZIrmGV2',
    globalRole: 'owner',
    memberships: [
      {
        schoolId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        schoolName: 'TeacherHub Academy',
        role: 'admin',
        isDefault: true,
      },
    ],
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    email: 'admin@teacherhub.local',
    password: '$2b$10$.koeIVuuvScwA9anqcoIK.VxgzfdJjBFwkmSMaA2hVsdkbQXEq5Hm',
    globalRole: 'user',
    memberships: [
      {
        schoolId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        schoolName: 'TeacherHub Academy',
        role: 'admin',
        isDefault: true,
      },
    ],
  },
  {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'teacher@teacherhub.local',
    password: '$2b$10$WjoTuYsc3qFXTl8MgAKHUOFgnd2qjqM555MNfHBe7agJdoZIrmGV2',
    globalRole: 'user',
    memberships: [
      {
        schoolId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        schoolName: 'TeacherHub Academy',
        role: 'teacher',
        isDefault: true,
        profile: {
          firstName: 'Demo',
          lastName: 'Teacher',
          phoneNumber: '+1 555 100 2000',
          specialization: 'Mathematics',
          hireDate: '2023-01-10',
          status: 'active',
        },
      },
      {
        schoolId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        schoolName: 'North District School',
        role: 'student',
      },
    ],
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    email: 'student@teacherhub.local',
    password: '$2b$10$hYhb3dFqXORi3Dp10i7khuM2badF33MJ6up79o75K8PyEv7pMB.8K',
    globalRole: 'user',
    memberships: [
      {
        schoolId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        schoolName: 'TeacherHub Academy',
        role: 'student',
        isDefault: true,
      },
    ],
  },
];
