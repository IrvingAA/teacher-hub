import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.pg';
import { School } from '../models/school.entity';
import { createAppError } from '../middlewares/errorHandler';
import type { CreateSchoolDto, ListSchoolsQueryDto, UpdateSchoolDto } from '../routes/schools/schools.schemas';
import { SchoolRepository } from '../repositories/school.repository';
import { cacheManager } from '../cache/cache.manager';
import { cachePolicies } from '../cache/cache.policies';
import { CreateSchoolWithAdminUseCase } from '../use-cases/schools/create-school-with-admin.use-case';
import type { PaginatedResult } from '../types/pagination/pagination.type';
import { buildPagination } from '../utils/pagination';

export class SchoolService {
  private readonly schoolRepository: SchoolRepository;

  constructor(repository?: Repository<School>) {
    this.schoolRepository = new SchoolRepository(repository ?? AppDataSource.getRepository(School));
  }

  async create(input: CreateSchoolDto): Promise<School> {
    const saved = await AppDataSource.manager.transaction(async (manager) => {
      const useCase = new CreateSchoolWithAdminUseCase(manager);
      return useCase.execute(input);
    });

    await this.invalidateSchoolDomainCache(saved.id);
    return saved;
  }

  async list(query: ListSchoolsQueryDto): Promise<PaginatedResult<School>> {
    const key = cacheManager.buildKey('schools:list', query);
    return cacheManager.getOrSet({
      key,
      ttlSeconds: cachePolicies.schools.list.ttlSeconds,
      tags: [...cachePolicies.schools.list.tags],
      loader: async () => {
        const { data, total } = await this.schoolRepository.list(query);
        return {
          data,
          pagination: buildPagination(query.page, query.limit, total),
        };
      },
    });
  }

  async getById(id: string): Promise<School> {
    const key = this.schoolByIdCacheKey(id);

    return cacheManager.getOrSet({
      key,
      ttlSeconds: cachePolicies.schools.byId.ttlSeconds,
      tags: [...cachePolicies.schools.byId.tags],
      loader: async () => {
        const school = await this.schoolRepository.findById(id);
        if (!school) {
          throw createAppError('School not found', 'SCHOOL_NOT_FOUND', 404);
        }

        return school;
      },
    });
  }

  async update(id: string, changes: UpdateSchoolDto): Promise<School> {
    if (changes.name) {
      const current = await this.getById(id);
      if (changes.name !== current.name) {
        const owner = await this.schoolRepository.findByName(changes.name);
        if (owner) {
          throw createAppError('A school with this name already exists', 'SCHOOL_NAME_ALREADY_EXISTS', 409);
        }
      }
    }

    const updated = await this.schoolRepository.updateSchool(id, changes);
    if (!updated) {
      throw createAppError('School not found', 'SCHOOL_NOT_FOUND', 404);
    }

    await this.invalidateSchoolDomainCache(id);
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.getById(id);
    const deleted = await this.schoolRepository.deleteById(id);

    if (!deleted) {
      throw createAppError('School not found', 'SCHOOL_NOT_FOUND', 404);
    }

    await this.invalidateSchoolDomainCache(id);
  }

  async deactivate(id: string): Promise<School> {
    const school = await this.getById(id);
    if (!school.isActive) {
      return school;
    }

    await this.schoolRepository.handleStatus(id, false);
    await this.invalidateSchoolDomainCache(id);

    return this.getById(id);
  }

  async activate(id: string): Promise<School> {
    const school = await this.getById(id);
    if (school.isActive) {
      return school;
    }

    await this.schoolRepository.handleStatus(id, true);
    await this.invalidateSchoolDomainCache(id);

    return this.getById(id);
  }

  private schoolByIdCacheKey(id: string): string {
    return cacheManager.buildKey('schools:id', { id });
  }

  private async invalidateSchoolDomainCache(id: string): Promise<void> {
    await Promise.all([
      cacheManager.invalidateKeys([this.schoolByIdCacheKey(id)]),
      cacheManager.invalidateTags([
        ...cachePolicies.schools.list.tags,
        ...cachePolicies.schools.byId.tags,
      ]),
    ]);
  }
}

export const schoolService = new SchoolService();
