export const cachePolicies = {
  teachers: {
    list: {
      ttlSeconds: 60 * 60 * 24,
      tags: ['teachers', 'teachers:list'],
    },
    byId: {
      ttlSeconds: 60 * 60,
      tags: ['teachers', 'teachers:by-id'],
    },
  },
  users: {
    list: {
      ttlSeconds: 60 * 60 * 24,
      tags: ['users', 'users:list'],
    },
    byId: {
      ttlSeconds: 60 * 60,
      tags: ['users', 'users:by-id'],
    },
  },
  schools: {
    list: {
      ttlSeconds: 60 * 60 * 24,
      tags: ['schools', 'schools:list'],
    },
    byId: {
      ttlSeconds: 60 * 60,
      tags: ['schools', 'schools:by-id'],
    },
  },
} as const;
