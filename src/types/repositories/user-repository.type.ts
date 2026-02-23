import type { ListUsersQueryDto } from '../../routes/users/users.schemas';

export interface ListUsersOptions extends ListUsersQueryDto {}

export type UserSortBy = ListUsersQueryDto['sortBy'];

export const USER_ALLOWED_UPDATE_FIELDS = ['email', 'password', 'globalRole', 'tenantId'] as const;

export const USER_SORTABLE_COLUMNS: Record<UserSortBy, string> = {
  email: 'u.email',
  isActive: 'u.isActive',
  createdAt: 'u.createdAt',
  updatedAt: 'u.updatedAt',
};
