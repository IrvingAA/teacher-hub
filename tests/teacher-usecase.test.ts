import { CreateTeacherProfileUseCase } from '../src/use-cases/teachers/create-teacher-profile.use-case';

describe('CreateTeacherProfileUseCase', () => {
  it('fails when membership is not teacher in target school', async () => {
    const userRepository = {
      findOne: jest.fn().mockResolvedValue({ id: '11111111-1111-4111-8111-111111111111' }),
    };

    const membershipRepository = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    const profileRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const manager = {
      getRepository: jest
        .fn()
        .mockReturnValueOnce(userRepository)
        .mockReturnValueOnce(membershipRepository)
        .mockReturnValueOnce(profileRepository),
    } as never;

    const useCase = new CreateTeacherProfileUseCase(manager);

    await expect(
      useCase.execute({
        userId: '11111111-1111-4111-8111-111111111111',
        schoolId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        firstName: 'Demo',
        lastName: 'Teacher',
        specialization: 'Mathematics',
        hireDate: new Date('2023-01-10'),
      })
    ).rejects.toMatchObject({
      code: 'USER_NOT_TEACHER_IN_SCHOOL',
      statusCode: 409,
    });
  });
});
