import { createAppError } from '../src/middlewares/errorHandler';

const mockRepositoryInstance: any = {
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
  update: jest.fn().mockResolvedValue({ affected: 1 }),
  findById: jest.fn(),
  list: jest.fn(),
  handleStatus: jest.fn().mockResolvedValue(true),
  deleteById: jest.fn().mockResolvedValue(true),
  updateProfile: jest.fn(),
};

jest.mock('../src/config/database.pg', () => ({
  AppDataSource: {
    manager: {
      transaction: jest.fn(async (cb) => cb({})),
    },
    getRepository: jest.fn(() => mockRepositoryInstance),
    isInitialized: true,
  },
}));

jest.mock('../src/cache/cache.manager', () => ({
  cacheManager: {
    buildKey: jest.fn(() => 'key'),
    getOrSet: jest.fn(async ({ loader }) => loader()),
    invalidateTags: jest.fn(),
    invalidateKeys: jest.fn(),
  },
}));

jest.mock('../src/use-cases/users/create-user-with-memberships.use-case', () => ({
  CreateUserWithMembershipsUseCase: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue({ id: 'u1' }),
  })),
}));

import { studentService } from '../src/services/student.service';
import { groupService } from '../src/services/group.service';

describe('Services Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (studentService as any).studentRepository = mockRepositoryInstance;
    (groupService as any).groupRepository = mockRepositoryInstance;
    (groupService as any).membershipRepository = mockRepositoryInstance;
  });

  describe('StudentService', () => {
    it('creates a student forcing student role', async () => {
      mockRepositoryInstance.findById.mockResolvedValue({ id: 'u1', isActive: true });
      const res = await studentService.create({ memberships: [{}] } as any);
      expect(res.id).toBe('u1');
    });

    it('lists students', async () => {
      mockRepositoryInstance.list.mockResolvedValue({ data: [], total: 0 });
      const res = await studentService.list({ page: 1, limit: 10 } as any);
      expect(res.data).toHaveLength(0);
    });

    it('activates and deactivates student', async () => {
      mockRepositoryInstance.findById.mockResolvedValue({ id: 'u1', isActive: true });
      await studentService.deactivate('u1');
      expect(mockRepositoryInstance.handleStatus).toHaveBeenCalled();

      mockRepositoryInstance.findById.mockResolvedValue({ id: 'u1', isActive: false });
      await studentService.activate('u1');
      expect(mockRepositoryInstance.handleStatus).toHaveBeenCalled();
    });
  });

  describe('GroupService', () => {
    it('creates group after validating teacher', async () => {
      mockRepositoryInstance.findOne.mockResolvedValue({ id: 'm1', role: 'teacher' });
      mockRepositoryInstance.create.mockReturnValue({ id: 'g1' });
      mockRepositoryInstance.save.mockResolvedValue({ id: 'g1' });

      const res = await groupService.create({ teacherMembershipId: 'm1', schoolId: 's1' } as any);
      expect(res.id).toBe('g1');
    });

    it('throws error if teacher not found during creation', async () => {
      mockRepositoryInstance.findOne.mockResolvedValue(null);
      await expect(groupService.create({ teacherMembershipId: 'm1' } as any)).rejects.toThrow();
    });

    it('removes a group', async () => {
      mockRepositoryInstance.findById.mockResolvedValue({ id: 'g1' });
      mockRepositoryInstance.deleteById.mockResolvedValue(true);

      await groupService.remove('g1');
      expect(mockRepositoryInstance.deleteById).toHaveBeenCalledWith('g1');
    });
  });
});
