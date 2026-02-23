import { EntityManager } from 'typeorm';
import { User } from '../../models/user.entity';
import { UserSchoolMembership } from '../../models/user-school-membership.entity';
import { MembershipProfile } from '../../models/membership-profile.entity';
import { createAppError } from '../../middlewares/errorHandler';
import type { CreateTeacherDto } from '../../routes/teachers/teachers.schemas';

export class CreateTeacherProfileUseCase {
  constructor(private readonly manager: EntityManager) {}

  async execute(input: CreateTeacherDto): Promise<string> {
    const userRepository = this.manager.getRepository(User);
    const membershipRepository = this.manager.getRepository(UserSchoolMembership);
    const profileRepository = this.manager.getRepository(MembershipProfile);

    const user = await userRepository.findOne({ where: { id: input.userId } });
    if (!user) {
      throw createAppError('User not found', 'USER_NOT_FOUND', 404);
    }

    const membership = await membershipRepository.findOne({
      where: {
        userId: input.userId,
        schoolId: input.schoolId,
        role: 'teacher',
      },
    });

    if (!membership) {
      throw createAppError(
        'User is not assigned as teacher in the specified school',
        'USER_NOT_TEACHER_IN_SCHOOL',
        409
      );
    }

    const existing = await profileRepository.findOne({
      where: { membershipId: membership.id },
      withDeleted: true,
    });

    if (existing && !existing.deletedAt) {
      throw createAppError(
        'Teacher profile already exists for this user and school',
        'TEACHER_PROFILE_ALREADY_EXISTS',
        409
      );
    }

    const profile = existing ?? profileRepository.create({ membershipId: membership.id });
    profile.firstName = input.firstName;
    profile.lastName = input.lastName;
    profile.specialization = input.specialization;
    profile.phoneNumber = input.phoneNumber;
    profile.hireDate = input.hireDate;
    profile.status = 'active';
    profile.deletedAt = null;

    await profileRepository.save(profile);
    return membership.id;
  }
}
