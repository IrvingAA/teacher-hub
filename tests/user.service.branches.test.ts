import { createAppError } from '../src/middlewares/errorHandler';
import { User } from '../src/models/user.entity';
import { UserSchoolMembership } from '../src/models/user-school-membership.entity';
import { UserService } from '../src/services/user.service';
import { cacheManager } from '../src/cache/cache.manager';
import { AppDataSource } from '../src/config/database.pg';
import { UserMembershipOrchestrator } from '../src/use-cases/users/user-membership.orchestrator';
import { CreateUserWithMembershipsUseCase } from '../src/use-cases/users/create-user-with-memberships.use-case';

jest.mock('../src/config/database.pg', () => ({
  AppDataSource: {
    manager: { transaction: jest.fn() },
    getRepository: jest.fn(),
  },
}));

jest.mock('../src/cache/cache.manager', () => ({
  cacheManager: {
    buildKey: jest.fn((prefix: string, payload?: unknown) => `${prefix}:${JSON.stringify(payload ?? {})}`),
    getOrSet: jest.fn(async ({ loader }) => loader()),
    invalidateKeys: jest.fn().mockResolvedValue(undefined),
    invalidateTags: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../src/use-cases/users/create-user-with-memberships.use-case', () => ({
  CreateUserWithMembershipsUseCase: jest.fn(),
}));

jest.mock('../src/use-cases/users/update-user-with-memberships.use-case', () => ({
  UpdateUserWithMembershipsUseCase: jest.fn(),
}));

jest.mock('../src/use-cases/users/user-membership.orchestrator', () => ({
  UserMembershipOrchestrator: jest.fn(),
}));

describe('UserService branch coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (cacheManager.getOrSet as jest.Mock).mockImplementation(async ({ loader }) => loader());
    (AppDataSource.manager.transaction as jest.Mock).mockImplementation(async (callback) => callback({}));
  });

  it('uses default repositories from AppDataSource when constructor deps are omitted', () => {
    (AppDataSource.getRepository as jest.Mock)
      .mockReturnValueOnce({ list: jest.fn(), findById: jest.fn(), deleteById: jest.fn() })
      .mockReturnValueOnce({ delete: jest.fn() });

    const service = new UserService();

    expect(service).toBeInstanceOf(UserService);
    expect(AppDataSource.getRepository).toHaveBeenNthCalledWith(1, User);
    expect(AppDataSource.getRepository).toHaveBeenNthCalledWith(2, UserSchoolMembership);
  });

  it('creates a user via transaction and returns hydrated aggregate', async () => {
    const execute = jest.fn().mockResolvedValue({ id: 'u-create' });
    (CreateUserWithMembershipsUseCase as unknown as jest.Mock).mockImplementation(() => ({ execute }));

    const service = new UserService({} as never, { delete: jest.fn() } as never);
    const expected = {
      user: { id: 'u-create', email: 'created@teacherhub.local' },
      memberships: [],
    };
    (service as any).getById = jest.fn().mockResolvedValue(expected);

    const result = await service.create({
      email: 'created@teacherhub.local',
      password: 'strong-password',
      globalRole: 'user',
      memberships: [],
    } as never);

    expect(result).toEqual(expected);
    expect(execute).toHaveBeenCalled();
    expect(cacheManager.invalidateKeys).toHaveBeenCalled();
    expect(cacheManager.invalidateTags).toHaveBeenCalled();
  });

  it('returns empty list payload without orchestrator calls when repository list is empty', async () => {
    const service = new UserService({} as never, { delete: jest.fn() } as never);
    (service as any).userRepository = {
      list: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    };

    const result = await service.list({ page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' } as never);

    expect(result.data).toEqual([]);
    expect(result.pagination.total).toBe(0);
    expect(UserMembershipOrchestrator).not.toHaveBeenCalled();
  });

  it('throws USER_NOT_FOUND when deleteById returns false after existence check', async () => {
    const service = new UserService({} as never, { delete: jest.fn() } as never);
    (service as any).getById = jest.fn().mockResolvedValue({ user: { id: 'u1' }, memberships: [] });
    (service as any).userRepository = {
      deleteById: jest.fn().mockResolvedValue(false),
    };

    await expect(service.remove('u1')).rejects.toMatchObject(
      createAppError('User not found', 'USER_NOT_FOUND', 404)
    );
  });

  it('handles empty and populated membership resolution branches', async () => {
    const service = new UserService({} as never, { delete: jest.fn() } as never);
    const empty = await (service as any).getMembershipsForUserIds([]);
    expect(empty).toBeInstanceOf(Map);
    expect(empty.size).toBe(0);

    const expected = new Map([['u1', [{ schoolId: 's1', schoolName: 'School 1', role: 'teacher', isDefault: true }]]]);
    (UserMembershipOrchestrator as unknown as jest.Mock).mockImplementation(() => ({
      getMembershipsForUserIds: jest.fn().mockResolvedValue(expected),
    }));

    const result = await (service as any).getMembershipsForUserIds(['u1']);
    expect(result).toEqual(expected);
    expect(UserMembershipOrchestrator).toHaveBeenCalledWith(AppDataSource.manager);
  });
});
