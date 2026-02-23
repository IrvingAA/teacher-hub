import { School } from '../src/models/school.entity';
import { UserSchoolMembership } from '../src/models/user-school-membership.entity';
import { UserMembershipOrchestrator, resolveDefaultMembership } from '../src/use-cases/users/user-membership.orchestrator';

describe('UserMembershipOrchestrator', () => {
  it('resolves default membership fallback', () => {
    const result = resolveDefaultMembership([
      { schoolId: 'a', schoolName: 'A', role: 'student' },
      { schoolId: 'b', schoolName: 'B', role: 'teacher', isDefault: true },
    ]);
    expect(result.schoolId).toBe('b');

    const fallback = resolveDefaultMembership([
      { schoolId: 'a', schoolName: 'A', role: 'student' },
      { schoolId: 'b', schoolName: 'B', role: 'teacher' },
    ]);
    expect(fallback.schoolId).toBe('a');
  });

  it('syncs memberships (delete stale, update existing, create new)', async () => {
    const schoolRepo = {
      findOne: jest
        .fn()
        .mockImplementation(({ where }: { where: { id: string } }) =>
          Promise.resolve(where.id === 'school-a' ? { id: 'school-a', name: 'School A' } : null)
        ),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };

    const membershipRepo = {
      find: jest.fn().mockResolvedValue([
        { id: 'm-a', userId: 'u1', schoolId: 'school-a', role: 'student', isDefault: true },
        { id: 'm-old', userId: 'u1', schoolId: 'school-old', role: 'teacher', isDefault: false },
      ]),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };

    const manager = {
      getRepository: jest.fn((model) => {
        if (model === School) return schoolRepo;
        if (model === UserSchoolMembership) return membershipRepo;
        return null;
      }),
    };

    const orchestrator = new UserMembershipOrchestrator(manager as never);
    await orchestrator.syncMemberships('u1', [
      { schoolId: 'school-a', schoolName: 'School A', role: 'teacher', isDefault: false },
      { schoolId: 'school-new', schoolName: 'School New', role: 'admin', isDefault: true },
    ]);

    expect(membershipRepo.delete).toHaveBeenCalledWith({ id: 'm-old' });
    expect(membershipRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'm-a', role: 'teacher', isDefault: false })
    );
    expect(membershipRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', schoolId: 'school-new', role: 'admin', isDefault: true })
    );
  });

  it('groups memberships by user id', async () => {
    const schoolRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
    const membershipRepo = {
      find: jest.fn().mockResolvedValue([
        {
          userId: 'u1',
          schoolId: 's1',
          role: 'admin',
          isDefault: true,
          createdAt: new Date(),
          school: { name: 'School 1' },
        },
        {
          userId: 'u2',
          schoolId: 's2',
          role: 'student',
          isDefault: false,
          createdAt: new Date(),
          school: null,
        },
      ]),
    };

    const manager = {
      getRepository: jest.fn((model) => {
        if (model === School) return schoolRepo;
        if (model === UserSchoolMembership) return membershipRepo;
        return null;
      }),
    };

    const orchestrator = new UserMembershipOrchestrator(manager as never);
    const grouped = await orchestrator.getMembershipsForUserIds(['u1', 'u2']);

    expect(grouped.get('u1')).toEqual([
      { schoolId: 's1', schoolName: 'School 1', role: 'admin', isDefault: true },
    ]);
    expect(grouped.get('u2')).toEqual([
      { schoolId: 's2', schoolName: 's2', role: 'student', isDefault: false },
    ]);
  });
});
