import { User } from '../models/user.entity';
import { BaseRepository } from './base.repository';
import type { UpdateUserDto } from '../routes/users/users.schemas';
import { resolveSort } from '../utils/sort.utils';
import type { ListResult } from '../types/repositories/shared-repository.type';
import {
  ListUsersOptions,
  USER_ALLOWED_UPDATE_FIELDS,
  USER_SORTABLE_COLUMNS,
} from '../types/repositories/user-repository.type';

export class UserRepository extends BaseRepository<User> {
  findById(id: string): Promise<User | null> {
    return this.findOne({ id } as any);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email } as any);
  }

  async list(options: ListUsersOptions): Promise<ListResult<User>> {
    const { page, limit, globalRole, schoolId, search, sortBy, sortOrder } = options;
    const sort = resolveSort(sortBy, sortOrder, USER_SORTABLE_COLUMNS);

    const qb = this.repository
      .createQueryBuilder('u')
      .orderBy(sort.column, sort.direction)
      .skip((page - 1) * limit)
      .take(limit);

    if (globalRole) {
      qb.andWhere('u.globalRole = :globalRole', { globalRole });
    }

    if (search) {
      qb.andWhere('u.email ILIKE :searchTerm', { searchTerm: `%${search}%` });
    }

    if (schoolId) {
      qb.andWhere(
        'EXISTS (SELECT 1 FROM user_school_memberships m WHERE m."userId" = u.id AND m."schoolId" = :schoolId)',
        { schoolId }
      );
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async updateUser(id: string, changes: UpdateUserDto | Partial<User>): Promise<User | null> {
    const safeChanges = this.sanitizePatch(changes, USER_ALLOWED_UPDATE_FIELDS);

    if (!this.hasPatchChanges(safeChanges)) {
      return this.findById(id);
    }

    await this.repository.update({ id }, safeChanges);
    return this.findById(id);
  }
}
