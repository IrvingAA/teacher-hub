export const TEST_AUTH_CREDENTIALS = {
  admin: {
    email: 'admin@teacherhub.local',
    password: 'admin123',
  },
  invalid: {
    email: 'admin@teacherhub.local',
    password: 'wrong-pass',
  },
} as const;
