import { Group } from '../models/group.entity';
import { BaseRepository } from './base.repository';
import { resolveSort } from '../utils/sort.utils';
import type { ListResult } from '../types/repositories/shared-repository.type';
import { z } from 'zod';
import { paginationQuerySchema, sortOrderSchema } from '../routes/_shared/pagination.schemas';

export const listGroupsQuerySchema = paginationQuerySchema.extend({
  schoolId: z.string().uuid().optional(),
  teacherMembershipId: z.string().uuid().optional(),
  search: z.string().trim().min(1).max(120).optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: sortOrderSchema.default('desc'),
});

export type ListGroupsQueryDto = z.infer<typeof listGroupsQuerySchema>;

export const GROUP_SORTABLE_COLUMNS: Record<ListGroupsQueryDto['sortBy'], string> = {
  name: 'g.name',
  createdAt: 'g.createdAt',
  updatedAt: 'g.updatedAt',
};

export class GroupRepository extends BaseRepository<Group> {
  async findById(id: string): Promise<Group | null> {
    return this.findOne({ id } as any);
  }

  async list(options: ListGroupsQueryDto): Promise<ListResult<Group>> {
    const { page, limit, schoolId, teacherMembershipId, search, sortBy, sortOrder } = options;
    const sort = resolveSort(sortBy, sortOrder, GROUP_SORTABLE_COLUMNS);

    const qb = this.repository
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.teacherMembership', 'membership')
      .leftJoinAndSelect('membership.user', 'user')
      .orderBy(sort.column, sort.direction)
      .skip((page - 1) * limit)
      .take(limit);

    if (schoolId) {
      qb.andWhere('g.schoolId = :schoolId', { schoolId });
    }

    if (teacherMembershipId) {
      qb.andWhere('g.teacherMembershipId = :teacherMembershipId', { teacherMembershipId });
    }

    if (search) {
      qb.andWhere('g.name ILIKE :searchTerm', { searchTerm: `%${search}%` });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }
}
