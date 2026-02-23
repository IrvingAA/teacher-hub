import { MembershipProfileRepository } from '../src/repositories/membership-profile.repository';
import { SchoolRepository } from '../src/repositories/school.repository';
import { UserRepository } from '../src/repositories/user.repository';
import { EventRepository } from '../src/repositories/event.repository';

describe('Repositories integrity', () => {
  it('instantiates all repositories with a mock base', () => {
    const mockRepo = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      count: jest.fn(),
    } as any;

    expect(new MembershipProfileRepository(mockRepo)).toBeDefined();
    expect(new SchoolRepository(mockRepo)).toBeDefined();
    expect(new UserRepository(mockRepo)).toBeDefined();
    expect(new EventRepository(mockRepo)).toBeDefined();
  });
});
