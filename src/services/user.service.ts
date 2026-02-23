import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.pg';
import { User } from '../models/user.entity';
import { UserSchoolMembership } from '../models/user-school-membership.entity';
import { createAppError } from '../middlewares/errorHandler';
import type { CreateUserDto, ListUsersQueryDto, UpdateUserDto } from '../routes/users/users.schemas';
import { UserRepository } from '../repositories/user.repository';
import { cacheManager } from '../cache/cache.manager';
import { cachePolicies } from '../cache/cache.policies';
import type { UserAggregate, UserMembershipResponseDto } from '../routes/users/users.mapper';
import { CreateUserWithMembershipsUseCase } from '../use-cases/users/create-user-with-memberships.use-case';
import { UpdateUserWithMembershipsUseCase } from '../use-cases/users/update-user-with-memberships.use-case';
import { UserMembershipOrchestrator } from '../use-cases/users/user-membership.orchestrator';
import type { PaginatedResult } from '../types/pagination/pagination.type';
import { buildPagination } from '../utils/pagination';

export class UserService {
  private readonly userRepository: UserRepository;
  private readonly membershipRepository: Repository<UserSchoolMembership>;

  constructor(userRepository?: Repository<User>, membershipRepository?: Repository<UserSchoolMembership>) {
    this.userRepository = new UserRepository(userRepository ?? AppDataSource.getRepository(User));
    this.membershipRepository = membershipRepository ?? AppDataSource.getRepository(UserSchoolMembership);
  }

  async create(input: CreateUserDto): Promise<UserAggregate> {
    const saved = await AppDataSource.manager.transaction(async (manager) => {
      const useCase = new CreateUserWithMembershipsUseCase(manager);
      return useCase.execute(input);
    });

    await this.invalidateUserDomainCache(saved.id);

    return this.getById(saved.id);
  }

  async list(query: ListUsersQueryDto): Promise<PaginatedResult<UserAggregate>> {
    const key = cacheManager.buildKey('users:list', query);
    return cacheManager.getOrSet({
      key,
      ttlSeconds: cachePolicies.users.list.ttlSeconds,
      tags: [...cachePolicies.users.list.tags],
      loader: async () => {
        const { data, total } = await this.userRepository.list(query);
        const aggregates = await this.hydrateUsers(data);

        return {
          data: aggregates,
          pagination: buildPagination(query.page, query.limit, total),
        };
      },
    });
  }

  async getById(id: string): Promise<UserAggregate> {
    const key = this.userByIdCacheKey(id);

    return cacheManager.getOrSet({
      key,
      ttlSeconds: cachePolicies.users.byId.ttlSeconds,
      tags: [...cachePolicies.users.byId.tags],
      loader: async () => {
        const user = await this.userRepository.findById(id);
        if (!user) {
          throw createAppError('User not found', 'USER_NOT_FOUND', 404);
        }

        const memberships = await this.getMembershipsForUserIds([id]);
        return {
          user,
          memberships: memberships.get(id) ?? [],
        };
      },
    });
  }

  async update(id: string, changes: UpdateUserDto): Promise<UserAggregate> {
    const updated = await AppDataSource.manager.transaction(async (manager) => {
      const useCase = new UpdateUserWithMembershipsUseCase(manager);
      return useCase.execute(id, changes);
    });

    await this.invalidateUserDomainCache(id);
    return this.getById(updated.id);
  }

  async remove(id: string): Promise<void> {
    await this.getById(id);
    const deleted = await this.userRepository.deleteById(id);

    if (!deleted) {
      throw createAppError('User not found', 'USER_NOT_FOUND', 404);
    }

    await this.membershipRepository.delete({ userId: id });
    await this.invalidateUserDomainCache(id);
  }

  async deactivate(id: string): Promise<UserAggregate> {
    const user = await this.getById(id);
    if (!user.user.isActive) {
      return user;
    }

    await this.userRepository.handleStatus(id, false);
    await this.invalidateUserDomainCache(id);

    return this.getById(id);
  }

  async activate(id: string): Promise<UserAggregate> {
    const user = await this.getById(id);
    if (user.user.isActive) {
      return user;
    }

    await this.userRepository.handleStatus(id, true);
    await this.invalidateUserDomainCache(id);

    return this.getById(id);
  }

  private async hydrateUsers(users: User[]): Promise<UserAggregate[]> {
    if (users.length === 0) {
      return [];
    }

    const memberships = await this.getMembershipsForUserIds(users.map((user) => user.id));
    return users.map((user) => ({
      user,
      memberships: memberships.get(user.id) ?? [],
    }));
  }

  private async getMembershipsForUserIds(userIds: string[]): Promise<Map<string, UserMembershipResponseDto[]>> {
    if (userIds.length === 0) {
      return new Map();
    }

    const orchestrator = new UserMembershipOrchestrator(AppDataSource.manager);
    return orchestrator.getMembershipsForUserIds(userIds);
  }

  private userByIdCacheKey(id: string): string {
    return cacheManager.buildKey('users:id', { id });
  }

  private async invalidateUserDomainCache(id: string): Promise<void> {
    await Promise.all([
      cacheManager.invalidateKeys([this.userByIdCacheKey(id)]),
      cacheManager.invalidateTags([
        ...cachePolicies.users.list.tags,
        ...cachePolicies.users.byId.tags,
      ]),
    ]);
  }
}

export const userService = new UserService();
