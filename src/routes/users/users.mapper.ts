import type { GlobalRole, User } from '../../models/user.entity';
import type { TenantRole } from '../../models/user-school-membership.entity';

export interface UserMembershipResponseDto {
  schoolId: string;
  schoolName: string;
  role: TenantRole;
  isDefault: boolean;
}

export interface UserResponseDto {
  id: string;
  email: string;
  globalRole: GlobalRole;
  isActive: boolean;
  tenantId: string;
  role: TenantRole;
  memberships: UserMembershipResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAggregate {
  user: User;
  memberships: UserMembershipResponseDto[];
}

export function toUserResponseDto(payload: UserAggregate): UserResponseDto {
  const defaultMembership =
    payload.memberships.find((membership) => membership.isDefault) ?? payload.memberships[0] ?? null;

  return {
    id: payload.user.id,
    email: payload.user.email,
    globalRole: payload.user.globalRole,
    isActive: payload.user.isActive,
    tenantId: defaultMembership?.schoolId ?? payload.user.tenantId,
    role: defaultMembership?.role ?? 'admin',
    memberships: payload.memberships,
    createdAt: payload.user.createdAt,
    updatedAt: payload.user.updatedAt,
  };
}
