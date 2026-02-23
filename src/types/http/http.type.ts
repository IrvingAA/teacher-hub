import type { Request } from 'express';

export type AuthenticatedRequest = Request & {
  user: Express.User;
  context: {
    tenantId: string;
    userId: string;
    requestId: string;
  };
};