import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.pg';
import { MembershipProfile } from '../models/membership-profile.entity';
import { createAppError } from '../middlewares/errorHandler';
import { CreateUserDto } from '../routes/users/users.schemas';
import { UpdateTeacherDto, ListTeachersQueryDto } from '../routes/teachers/teachers.schemas';
import { MembershipProfileRepository } from '../repositories/membership-profile.repository';
import type { MembershipRecord } from '../types/repositories/membership-profile-repository.type';
import { cacheManager } from '../cache/cache.manager';
import { cachePolicies } from '../cache/cache.policies';
import { CreateUserWithMembershipsUseCase } from '../use-cases/users/create-user-with-memberships.use-case';
import type { PaginatedResult } from '../types/pagination/pagination.type';
import { buildPagination } from '../utils/pagination';

/**
 * StudentService handles student-specific logic.
 */
export class StudentService {
  private readonly studentRepository: MembershipProfileRepository;

  constructor(repository?: Repository<MembershipProfile>) {
    const repo = repository ?? AppDataSource.getRepository(MembershipProfile);
    this.studentRepository = new MembershipProfileRepository(repo);
  }

  async create(input: CreateUserDto): Promise<MembershipRecord> {
    const studentInput: CreateUserDto = {
      ...input,
      memberships: input.memberships.map((m) => ({ ...m, role: 'student' })),
    };

    const savedUser = await AppDataSource.manager.transaction(async (manager) => {
      const useCase = new CreateUserWithMembershipsUseCase(manager);
      return useCase.execute(studentInput);
    });

    return this.getById(savedUser.id);
  }

  async list(query: ListTeachersQueryDto): Promise<PaginatedResult<MembershipRecord>> {
    const key = cacheManager.buildKey('students:list', query);
    return cacheManager.getOrSet({
      key,
      ttlSeconds: cachePolicies.teachers.list.ttlSeconds,
      tags: ['students'],
      loader: async () => {
        const { data, total } = await this.studentRepository.list({ ...query, role: 'student' });
        return {
          data,
          pagination: buildPagination(query.page, query.limit, total),
        };
      },
    });
  }

  async getById(id: string): Promise<MembershipRecord> {
    const student = await this.studentRepository.findById(id, 'student');
    if (!student) {
      throw createAppError('Student not found', 'STUDENT_NOT_FOUND', 404);
    }
    return student;
  }

  async update(id: string, changes: UpdateTeacherDto): Promise<MembershipRecord> {
    const updated = await this.studentRepository.updateProfile(id, changes);
    if (!updated) {
      throw createAppError('Student not found', 'STUDENT_NOT_FOUND', 404);
    }

    await this.invalidateCache(id);
    return updated;
  }

  async deactivate(id: string): Promise<MembershipRecord> {
    await this.studentRepository.handleStatus(id, false);
    await this.invalidateCache(id);
    return this.getById(id);
  }

  async activate(id: string): Promise<MembershipRecord> {
    await this.studentRepository.handleStatus(id, true);
    await this.invalidateCache(id);
    return this.getById(id);
  }

  private async invalidateCache(id: string): Promise<void> {
    await cacheManager.invalidateTags(['students']);
    await cacheManager.invalidateKeys([cacheManager.buildKey('students:id', { id })]);
  }
}

export const studentService = new StudentService();
