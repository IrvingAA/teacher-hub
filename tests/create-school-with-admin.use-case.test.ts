import { createAppError } from '../src/middlewares/errorHandler';
import { School } from '../src/models/school.entity';
import { User } from '../src/models/user.entity';
import { UserSchoolMembership } from '../src/models/user-school-membership.entity';
import { CreateSchoolWithAdminUseCase } from '../src/use-cases/schools/create-school-with-admin.use-case';

describe('CreateSchoolWithAdminUseCase', () => {
  it('creates school without admin when adminUserId is absent', async () => {
    const schoolRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ id: 's1', ...value })),
    };
    const userRepo = { findOne: jest.fn(), save: jest.fn() };
    const membershipRepo = { findOne: jest.fn(), count: jest.fn(), update: jest.fn(), create: jest.fn(), save: jest.fn() };

    const manager = {
      getRepository: jest.fn((model) => {
        if (model === School) return schoolRepo;
        if (model === User) return userRepo;
        if (model === UserSchoolMembership) return membershipRepo;
        return null;
      }),
    };

    const useCase = new CreateSchoolWithAdminUseCase(manager as never);
    const saved = await useCase.execute({ name: 'School 1' });
    expect(saved.id).toBe('s1');
    expect(userRepo.findOne).not.toHaveBeenCalled();
  });

  it('rejects duplicate school and missing admin', async () => {
    const schoolRepo = {
      findOne: jest.fn().mockResolvedValueOnce({ id: 'exists' }).mockResolvedValueOnce(null),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ id: 's1', ...value })),
    };
    const userRepo = { 
      findOne: jest.fn().mockResolvedValue(null), 
      find: jest.fn().mockResolvedValue([{ id: 'u1', email: 'owner@mail.com' }]),
      save: jest.fn() 
    };
    const membershipRepo = { findOne: jest.fn(), count: jest.fn(), update: jest.fn(), create: jest.fn(), save: jest.fn() };

    const manager = {
      getRepository: jest.fn((model) => {
        if (model === School) return schoolRepo;
        if (model === User) return userRepo;
        if (model === UserSchoolMembership) return membershipRepo;
        return null;
      }),
    };

    const useCase = new CreateSchoolWithAdminUseCase(manager as never);

    await expect(useCase.execute({ name: 'Duplicated' })).rejects.toMatchObject(
      createAppError('A school with this name already exists', 'SCHOOL_NAME_ALREADY_EXISTS', 409)
    );

    await expect(useCase.execute({ name: 'School 2', adminUserId: 'u1' })).rejects.toThrow(/Admin user not found/);
  });

  it('assigns admin membership and updates default tenant when needed', async () => {
    const schoolRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ id: 's-new', ...value })),
    };
    const adminUser = {
      id: 'u1',
      tenantId: 'old-school',
    };
    const userRepo = {
      findOne: jest.fn().mockResolvedValue(adminUser),
      save: jest.fn(async (value) => value),
    };
    const membershipRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };

    const manager = {
      getRepository: jest.fn((model) => {
        if (model === School) return schoolRepo;
        if (model === User) return userRepo;
        if (model === UserSchoolMembership) return membershipRepo;
        return null;
      }),
    };

    const useCase = new CreateSchoolWithAdminUseCase(manager as never);
    const saved = await useCase.execute({ name: 'School 3', adminUserId: 'u1' });

    expect(saved.id).toBe('s-new');
    expect(membershipRepo.update).toHaveBeenCalledWith({ userId: 'u1' }, { isDefault: false });
    expect(membershipRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        schoolId: 's-new',
        role: 'admin',
        isDefault: true,
      })
    );
    expect(adminUser.tenantId).toBe('s-new');
    expect(userRepo.save).toHaveBeenCalled();
  });
});
