import type { GlobalRole, User } from '../../models/user.entity';
import type { TenantRole } from '../../models/user-school-membership.entity';
import type { RequestClientContext } from '../events/events.type';

export interface RequestContext {
  requestId: string;
  userId?: string;
  tenantId?: string;
  startedAt?: string;
  client?: RequestClientContext;
}

declare global {
  namespace Express {
    interface Request {
      context: RequestContext;
      user?: User;
    }

    interface User {
      id: string;
      email: string;
      globalRole: GlobalRole;
      tenantId: string;
      role: TenantRole;
    }
  }
}
