import { EntityManager, In, Repository } from 'typeorm';
import { School } from '../../models/school.entity';
import { UserSchoolMembership } from '../../models/user-school-membership.entity';
import type { UserMembershipInputDto } from '../../routes/users/users.schemas';

export function resolveDefaultMembership(memberships: UserMembershipInputDto[]): UserMembershipInputDto {
  return memberships.find((membership) => membership.isDefault) ?? memberships[0];
}

export class UserMembershipOrchestrator {
  private readonly schoolRepository: Repository<School>;
  private readonly membershipRepository: Repository<UserSchoolMembership>;

  constructor(private readonly manager: EntityManager) {
    this.schoolRepository = manager.getRepository(School);
    this.membershipRepository = manager.getRepository(UserSchoolMembership);
  }

  async syncMemberships(userId: string, memberships: UserMembershipInputDto[]): Promise<void> {
    const persisted = await this.membershipRepository.find({ where: { userId } });
    const persistedBySchoolId = new Map(persisted.map((membership) => [membership.schoolId, membership]));
    const desiredSchoolIds = new Set(memberships.map((membership) => membership.schoolId));

    for (const persistedMembership of persisted) {
      if (!desiredSchoolIds.has(persistedMembership.schoolId)) {
        await this.membershipRepository.delete({ id: persistedMembership.id });
      }
    }

    for (const membership of memberships) {
      await this.upsertSchool(membership);

      const current = persistedBySchoolId.get(membership.schoolId);
      if (!current) {
        await this.membershipRepository.save(
          this.membershipRepository.create({
            userId,
            schoolId: membership.schoolId,
            role: membership.role,
            isDefault: membership.isDefault ?? false,
          })
        );
        continue;
      }

      current.role = membership.role;
      current.isDefault = membership.isDefault ?? false;
      await this.membershipRepository.save(current);
    }
  }

  async getMembershipsForUserIds(
    userIds: string[]
  ): Promise<Map<string, Array<{ schoolId: string; schoolName: string; role: UserSchoolMembership['role']; isDefault: boolean }>>> {
    if (userIds.length === 0) {
      return new Map();
    }

    const memberships = await this.membershipRepository.find({
      where: { userId: In(userIds) },
      relations: { school: true },
      order: { createdAt: 'ASC' },
    });

    const grouped = new Map<
      string,
      Array<{ schoolId: string; schoolName: string; role: UserSchoolMembership['role']; isDefault: boolean }>
    >();

    for (const membership of memberships) {
      const current = grouped.get(membership.userId) ?? [];
      current.push({
        schoolId: membership.schoolId,
        schoolName: membership.school?.name ?? membership.schoolId,
        role: membership.role,
        isDefault: membership.isDefault,
      });
      grouped.set(membership.userId, current);
    }

    return grouped;
  }

  private async upsertSchool(membership: UserMembershipInputDto): Promise<School> {
    const existingSchool = await this.schoolRepository.findOne({ where: { id: membership.schoolId } });

    if (!existingSchool) {
      return this.schoolRepository.save(
        this.schoolRepository.create({
          id: membership.schoolId,
          name: membership.schoolName,
        })
      );
    }

    if (existingSchool.name !== membership.schoolName) {
      existingSchool.name = membership.schoolName;
      return this.schoolRepository.save(existingSchool);
    }

    return existingSchool;
  }
}
