import type { JwtPayload } from 'jsonwebtoken';
import type { GlobalRole } from '../../models/user.entity';
import type { TenantRole } from '../../models/user-school-membership.entity';

export interface AppJwtClaims {
  sub: string;
  tenantId: string;
  role?: TenantRole;
  globalRole: GlobalRole;
  email?: string;
}

export type AppJwtPayload = JwtPayload & AppJwtClaims;

export interface AuthMembership {
  schoolId: string;
  schoolName: string;
  role: TenantRole;
  isDefault: boolean;
}

export interface AuthUserRecord {
  id: string;
  email: string;
  password: string;
  globalRole: GlobalRole;
  isActive: boolean;
  tenantId: string;
  role: TenantRole;
  memberships: AuthMembership[];
}

export type AuthLoginResult = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: Omit<AuthUserRecord, 'password'>;
};
