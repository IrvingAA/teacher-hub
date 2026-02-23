import { EntityManager } from 'typeorm';
import { School } from '../../models/school.entity';
import { User } from '../../models/user.entity';
import { UserSchoolMembership } from '../../models/user-school-membership.entity';
import { createAppError } from '../../middlewares/errorHandler';
import type { CreateSchoolDto } from '../../routes/schools/schools.schemas';

export class CreateSchoolWithAdminUseCase {
  constructor(private readonly manager: EntityManager) {}

  async execute(input: CreateSchoolDto): Promise<School> {
    const schoolRepository = this.manager.getRepository(School);
    const userRepository = this.manager.getRepository(User);
    const membershipRepository = this.manager.getRepository(UserSchoolMembership);

    const existing = await schoolRepository.findOne({ where: { name: input.name } });
    if (existing) {
      throw createAppError('A school with this name already exists', 'SCHOOL_NAME_ALREADY_EXISTS', 409);
    }

    const school = schoolRepository.create({
      name: input.name,
      isActive: input.isActive ?? true,
    });
    const saved = await schoolRepository.save(school);

    if (!input.adminUserId) {
      return saved;
    }

    const adminUser = await userRepository.findOne({ where: { id: input.adminUserId } });
    if (!adminUser) {
      const validUsers = await userRepository.find({ take: 5, select: ['id', 'email'] });
      const hints = validUsers.map(u => `${u.email} (${u.id})`).join(', ');
      throw createAppError(
        `Admin user not found. Valid IDs examples: ${hints}`, 
        'ADMIN_USER_NOT_FOUND', 
        404
      );
    }

    const existingMembership = await membershipRepository.findOne({
      where: {
        userId: adminUser.id,
        schoolId: saved.id,
      },
    });

    if (!existingMembership) {
      const hasMemberships =
        (await membershipRepository.count({ where: { userId: adminUser.id } })) > 0;

      const isDefault = input.setAdminAsDefaultMembership ?? !hasMemberships;

      if (isDefault) {
        await membershipRepository.update({ userId: adminUser.id }, { isDefault: false });
      }

      await membershipRepository.save(
        membershipRepository.create({
          userId: adminUser.id,
          schoolId: saved.id,
          role: 'admin',
          isDefault,
        })
      );

      if (isDefault) {
        adminUser.tenantId = saved.id;
        await userRepository.save(adminUser);
      }
    }

    return saved;
  }
}
