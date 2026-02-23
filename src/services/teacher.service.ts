import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.pg';
import { MembershipProfile, TeacherStatus } from '../models/membership-profile.entity';
import { createAppError } from '../middlewares/errorHandler';
import {
  CreateTeacherDto,
  ListTeachersQueryDto,
  UpdateTeacherDto,
} from '../routes/teachers/teachers.schemas';
import { MembershipProfileRepository } from '../repositories/membership-profile.repository';
import type { MembershipRecord } from '../types/repositories/membership-profile-repository.type';
import { cacheManager } from '../cache/cache.manager';
import { cachePolicies } from '../cache/cache.policies';
import { CreateTeacherProfileUseCase } from '../use-cases/teachers/create-teacher-profile.use-case';
import type { PaginatedResult } from '../types/pagination/pagination.type';
import { buildPagination } from '../utils/pagination';

export class TeacherService {
  private readonly teacherRepository: MembershipProfileRepository;

  constructor(repository?: Repository<MembershipProfile>) {
    const repo = repository ?? AppDataSource.getRepository(MembershipProfile);
    this.teacherRepository = new MembershipProfileRepository(repo);
  }

  async create(input: CreateTeacherDto): Promise<MembershipRecord> {
    const membershipId = await AppDataSource.manager.transaction(async (manager) => {
      const useCase = new CreateTeacherProfileUseCase(manager);
      return useCase.execute(input);
    });

    const teacher = await this.getById(membershipId);
    await this.invalidateTeacherDomainCache(teacher.id);
    return teacher;
  }

  async list(query: ListTeachersQueryDto): Promise<PaginatedResult<MembershipRecord>> {
    const key = cacheManager.buildKey('teachers:list', query);
    return cacheManager.getOrSet({
      key,
      ttlSeconds: cachePolicies.teachers.list.ttlSeconds,
      tags: [...cachePolicies.teachers.list.tags],
      loader: async () => {
        const { data, total } = await this.teacherRepository.list({ ...query, role: 'teacher' });
        return {
          data,
          pagination: buildPagination(query.page, query.limit, total),
        };
      },
    });
  }

  async getById(id: string): Promise<MembershipRecord> {
    const key = this.teacherByIdCacheKey(id);
    return cacheManager.getOrSet({
      key,
      ttlSeconds: cachePolicies.teachers.byId.ttlSeconds,
      tags: [...cachePolicies.teachers.byId.tags],
      loader: async () => {
        const teacher = await this.teacherRepository.findById(id, 'teacher');
        if (!teacher) {
          throw createAppError('Teacher not found', 'TEACHER_NOT_FOUND', 404);
        }
        return teacher;
      },
    });
  }

  async update(id: string, changes: UpdateTeacherDto): Promise<MembershipRecord> {
    const updated = await this.teacherRepository.updateProfile(id, changes);
    if (!updated) {
      throw createAppError('Teacher not found', 'TEACHER_NOT_FOUND', 404);
    }

    await this.invalidateTeacherDomainCache(id);
    return updated;
  }

  async deactivate(id: string): Promise<MembershipRecord> {
    const teacher = await this.getById(id);
    if (!teacher.isActive) {
      return teacher;
    }

    await this.teacherRepository.handleStatus(id, false);
    await this.invalidateTeacherDomainCache(id);

    return this.getById(id);
  }

  async activate(id: string): Promise<MembershipRecord> {
    const teacher = await this.getById(id);
    if (teacher.isActive) {
      return teacher;
    }

    await this.teacherRepository.handleStatus(id, true);
    await this.invalidateTeacherDomainCache(id);

    return this.getById(id);
  }

  async remove(id: string): Promise<void> {
    await this.getById(id);
    const deleted = await this.teacherRepository.softDeleteByMembershipId(id);

    if (!deleted) {
      throw createAppError('Teacher not found', 'TEACHER_NOT_FOUND', 404);
    }

    await this.invalidateTeacherDomainCache(id);
  }

  private teacherByIdCacheKey(id: string): string {
    return cacheManager.buildKey('teachers:id', { id });
  }

  private async invalidateTeacherDomainCache(id: string): Promise<void> {
    await Promise.all([
      cacheManager.invalidateKeys([this.teacherByIdCacheKey(id)]),
      cacheManager.invalidateTags([
        ...cachePolicies.teachers.list.tags,
        ...cachePolicies.teachers.byId.tags,
      ]),
    ]);
  }
}

export const teacherService = new TeacherService();
