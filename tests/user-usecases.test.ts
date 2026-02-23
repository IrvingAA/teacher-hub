import { createAppError } from '../src/middlewares/errorHandler';
import { School } from '../src/models/school.entity';
import { User } from '../src/models/user.entity';
import { UserSchoolMembership } from '../src/models/user-school-membership.entity';
import { CreateUserWithMembershipsUseCase } from '../src/use-cases/users/create-user-with-memberships.use-case';
import { UpdateUserWithMembershipsUseCase } from '../src/use-cases/users/update-user-with-memberships.use-case';

describe('User use-cases', () => {
  it('CreateUserWithMembershipsUseCase creates user and hashes password', async () => {
    const userRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ id: 'u1', ...value })),
    };
    const schoolRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 's1', name: 'School 1' }),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    const membershipRepo = {
      find: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue({ affected: 0 }),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };

    const manager = {
      getRepository: jest.fn((model) => {
        if (model === User) return userRepo;
        if (model === School) return schoolRepo;
        if (model === UserSchoolMembership) return membershipRepo;
        return null;
      }),
    };

    const useCase = new CreateUserWithMembershipsUseCase(manager as never);
    const saved = await useCase.execute({
      email: 'new@teacherhub.local',
      password: 'pass1234',
      globalRole: 'user',
      memberships: [{ schoolId: 's1', schoolName: 'School 1', role: 'student', isDefault: true }],
    });

    expect(saved.id).toBe('u1');
    expect(userRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'new@teacherhub.local',
        globalRole: 'user',
        tenantId: 's1',
      })
    );
    expect((saved as any).password).toMatch(/^\$2[aby]\$/);
  });

  it('CreateUserWithMembershipsUseCase rejects duplicate email', async () => {
    const userRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'exists' }),
      create: jest.fn(),
      save: jest.fn(),
    };
    const schoolRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
    const membershipRepo = { find: jest.fn(), delete: jest.fn(), create: jest.fn(), save: jest.fn() };
    const manager = {
      getRepository: jest.fn((model) => {
        if (model === User) return userRepo;
        if (model === School) return schoolRepo;
        if (model === UserSchoolMembership) return membershipRepo;
        return null;
      }),
    };

    const useCase = new CreateUserWithMembershipsUseCase(manager as never);
    await expect(
      useCase.execute({
        email: 'exists@teacherhub.local',
        password: 'pass1234',
        globalRole: 'user',
        memberships: [{ schoolId: 's1', schoolName: 'School 1', role: 'student', isDefault: true }],
      })
    ).rejects.toMatchObject(createAppError('A user with this email already exists', 'EMAIL_ALREADY_EXISTS', 409));
  });

  it('UpdateUserWithMembershipsUseCase handles not found, duplicate email and password hash', async () => {
    const current = {
      id: 'u1',
      email: 'old@teacherhub.local',
      password: 'old-pass',
      tenantId: 's1',
      globalRole: 'user' as const,
    };

    const userRepo = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(current)
        .mockResolvedValueOnce({ id: 'other' })
        .mockResolvedValueOnce(current)
        .mockResolvedValueOnce(null),
      save: jest.fn(async (value) => value),
    };
    const schoolRepo = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce({ id: 's2', name: 'School 2' })
        .mockResolvedValue({ id: 's2', name: 'School 2' }),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    const membershipRepo = {
      find: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue({ affected: 0 }),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };

    const manager = {
      getRepository: jest.fn((model) => {
        if (model === User) return userRepo;
        if (model === School) return schoolRepo;
        if (model === UserSchoolMembership) return membershipRepo;
        return null;
      }),
    };

    const useCase = new UpdateUserWithMembershipsUseCase(manager as never);
    await expect(useCase.execute('missing', { email: 'x@x.com' })).rejects.toMatchObject(
      createAppError('User not found', 'USER_NOT_FOUND', 404)
    );

    await expect(useCase.execute('u1', { email: 'other@teacherhub.local' })).rejects.toMatchObject(
      createAppError('A user with this email already exists', 'EMAIL_ALREADY_EXISTS', 409)
    );

    const updated = await useCase.execute('u1', {
      password: 'new-pass',
      memberships: [{ schoolId: 's2', schoolName: 'School 2', role: 'admin', isDefault: true }],
    });

    expect(updated.tenantId).toBe('s2');
    expect(updated.password).toMatch(/^\$2[aby]\$/);
  });
});
