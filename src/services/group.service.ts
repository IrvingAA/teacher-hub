import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.pg';
import { Group } from '../models/group.entity';
import { UserSchoolMembership } from '../models/user-school-membership.entity';
import { createAppError } from '../middlewares/errorHandler';
import { GroupRepository, ListGroupsQueryDto } from '../repositories/group.repository';
import { cacheManager } from '../cache/cache.manager';
import type { PaginatedResult } from '../types/pagination/pagination.type';
import { buildPagination } from '../utils/pagination';
import { z } from 'zod';

export const createGroupBodySchema = z.object({
  name: z.string().min(2).max(160),
  schoolId: z.string().uuid(),
  teacherMembershipId: z.string().uuid(),
  studentIds: z.array(z.string().uuid()).default([]),
});

export const updateGroupBodySchema = createGroupBodySchema.partial();

export type CreateGroupDto = z.infer<typeof createGroupBodySchema>;
export type UpdateGroupDto = z.infer<typeof updateGroupBodySchema>;

export class GroupService {
  private readonly groupRepository: GroupRepository;
  private readonly membershipRepository: Repository<UserSchoolMembership>;

  constructor(
    repository?: Repository<Group>,
    membershipRepository?: Repository<UserSchoolMembership>
  ) {
    this.groupRepository = new GroupRepository(repository ?? AppDataSource.getRepository(Group));
    this.membershipRepository =
      membershipRepository ?? AppDataSource.getRepository(UserSchoolMembership);
  }

  async create(input: CreateGroupDto): Promise<Group> {
    const teacher = await this.membershipRepository.findOne({
      where: {
        id: input.teacherMembershipId,
        schoolId: input.schoolId,
        role: 'teacher',
      },
    });

    if (!teacher) {
      throw createAppError(
        'Teacher membership not found or invalid role',
        'TEACHER_NOT_FOUND',
        404
      );
    }

    const group = this.groupRepository.create(input);
    const saved = await this.groupRepository.save(group);
    await this.invalidateCache();
    return saved;
  }

  async list(query: ListGroupsQueryDto): Promise<PaginatedResult<Group>> {
    const key = cacheManager.buildKey('groups:list', query);
    return cacheManager.getOrSet({
      key,
      ttlSeconds: 300,
      tags: ['groups'],
      loader: async () => {
        const { data, total } = await this.groupRepository.list(query);
        return {
          data,
          pagination: buildPagination(query.page, query.limit, total),
        };
      },
    });
  }

  async getById(id: string): Promise<Group> {
    const group = await this.groupRepository.findById(id);
    if (!group) {
      throw createAppError('Group not found', 'GROUP_NOT_FOUND', 404);
    }
    return group;
  }

  async update(id: string, changes: UpdateGroupDto): Promise<Group> {
    const group = await this.getById(id);

    if (changes.teacherMembershipId || changes.schoolId) {
      const schoolId = changes.schoolId ?? group.schoolId;
      const teacherId = changes.teacherMembershipId ?? group.teacherMembershipId;

      const teacher = await this.membershipRepository.findOne({
        where: {
          id: teacherId,
          schoolId: schoolId,
          role: 'teacher',
        },
      });

      if (!teacher) {
        throw createAppError('Invalid teacher membership for this school', 'INVALID_TEACHER', 400);
      }
    }

    Object.assign(group, changes);
    const saved = await this.groupRepository.save(group);
    await this.invalidateCache();
    return saved;
  }

  async deactivate(id: string): Promise<Group> {
    await this.groupRepository.handleStatus(id, false);
    await this.invalidateCache();
    return this.getById(id);
  }

  async activate(id: string): Promise<Group> {
    await this.groupRepository.handleStatus(id, true);
    await this.invalidateCache();
    return this.getById(id);
  }

  async remove(id: string): Promise<void> {
    await this.getById(id);
    await this.groupRepository.deleteById(id);
    await this.invalidateCache();
  }

  private async invalidateCache(): Promise<void> {
    await cacheManager.invalidateTags(['groups']);
  }
}

export const groupService = new GroupService();
