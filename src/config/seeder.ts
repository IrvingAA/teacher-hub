import { AppDataSource } from './database.pg';
import { User } from '../models/user.entity';
import { School } from '../models/school.entity';
import { UserSchoolMembership } from '../models/user-school-membership.entity';
import { MembershipProfile } from '../models/membership-profile.entity';
import { seedUsers, seedUsersSchema } from './seeds/users.seed';
import seedApiKeys, { apiKeySeedSchema } from './seeds/api-keys.seed';
import { apiKeyService } from '../services/api-key.service';
import { ApiKey } from '../models/api-key.entity';
import type { SeedUser, SeedUserMembership } from '../types/seed/seed.type';
import { hashPassword } from '../utils/security/password';

function resolveDefaultMembership(entry: SeedUser): SeedUserMembership {
  return entry.memberships.find((membership) => membership.isDefault) ?? entry.memberships[0];
}

export async function seedUsersCatalog(): Promise<void> {
  if (!AppDataSource.isInitialized) {
    return;
  }

  const users = seedUsersSchema.parse(seedUsers);
  const userRepository = AppDataSource.getRepository(User);
  const schoolRepository = AppDataSource.getRepository(School);
  const membershipRepository = AppDataSource.getRepository(UserSchoolMembership);
  const membershipProfileRepository = AppDataSource.getRepository(MembershipProfile);

  const upsertSchool = async (membership: SeedUserMembership): Promise<School> => {
    const existingSchool = await schoolRepository.findOne({ where: { id: membership.schoolId } });
    if (!existingSchool) {
      return schoolRepository.save(
        schoolRepository.create({
          id: membership.schoolId,
          name: membership.schoolName,
        })
      );
    }

    if (existingSchool.name !== membership.schoolName) {
      existingSchool.name = membership.schoolName;
      return schoolRepository.save(existingSchool);
    }

    return existingSchool;
  };

  const syncMemberships = async (
    userId: string,
    memberships: SeedUserMembership[]
  ): Promise<void> => {
    const persistedMemberships = await membershipRepository.find({ where: { userId } });
    const persistedBySchoolId = new Map(
      persistedMemberships.map((membership) => [membership.schoolId, membership])
    );
    const desiredSchoolIds = new Set(memberships.map((membership) => membership.schoolId));

    for (const persistedMembership of persistedMemberships) {
      if (!desiredSchoolIds.has(persistedMembership.schoolId)) {
        await membershipRepository.delete({ id: persistedMembership.id });
      }
    }

    for (const membership of memberships) {
      await upsertSchool(membership);

      const currentMembership = persistedBySchoolId.get(membership.schoolId);
      if (!currentMembership) {
        await membershipRepository.save(
          membershipRepository.create({
            userId,
            schoolId: membership.schoolId,
            role: membership.role,
            isDefault: membership.isDefault ?? false,
          })
        );
        continue;
      }

      currentMembership.role = membership.role;
      currentMembership.isDefault = membership.isDefault ?? false;
      await membershipRepository.save(currentMembership);
    }

    const refreshedMemberships = await membershipRepository.find({ where: { userId } });
    const refreshedBySchoolId = new Map(
      refreshedMemberships.map((membership) => [membership.schoolId, membership])
    );

    for (const membership of memberships) {
      const persistedMembership = refreshedBySchoolId.get(membership.schoolId);
      if (!persistedMembership) {
        continue;
      }

      if (membership.role !== 'teacher' || !membership.profile) {
        await membershipProfileRepository.delete({ membershipId: persistedMembership.id });
        continue;
      }

      const existingProfile = await membershipProfileRepository.findOne({
        where: { membershipId: persistedMembership.id },
        withDeleted: true,
      });

      const profile =
        existingProfile ??
        membershipProfileRepository.create({ membershipId: persistedMembership.id });
      profile.firstName = membership.profile.firstName;
      profile.lastName = membership.profile.lastName;
      profile.phoneNumber = membership.profile.phoneNumber ?? null;
      profile.specialization = membership.profile.specialization ?? null;
      profile.hireDate = membership.profile.hireDate ? new Date(membership.profile.hireDate) : null;
      profile.status = membership.profile.status ?? 'active';
      profile.deletedAt = null;

      await membershipProfileRepository.save(profile);
    }
  };

  for (const entry of users) {
    const existing = await userRepository.findOne({ where: { email: entry.email } });
    const defaultMembership = resolveDefaultMembership(entry);

    const user =
      existing ??
      userRepository.create({ ...(entry.id ? { id: entry.id } : {}), email: entry.email });
    user.password = await hashPassword(entry.password);
    user.globalRole = entry.globalRole ?? 'user';
    user.tenantId = defaultMembership.schoolId;

    const savedUser = await userRepository.save(user);
    await syncMemberships(savedUser.id, entry.memberships);

    console.log(`${existing ? 'Refreshed' : 'Seeded'} user: ${entry.email}`);
  }
}

export async function seedApiKeysCatalog(): Promise<void> {
  if (!AppDataSource.isInitialized) {
    return;
  }

  const keys = apiKeySeedSchema.parse(seedApiKeys);

  for (const entry of keys) {
    try {
      const repo = AppDataSource.getRepository(ApiKey);

      const existing = await repo.findOne({ where: { publicKey: entry.publicKey } });

      const record = existing ? existing : repo.create({ id: entry.id } as Partial<ApiKey>);

      record.name = entry.name;
      record.publicKey = entry.publicKey;
      record.secretHash = entry.secretHash;
      record.salt = entry.salt;
      record.isActive = entry.isActive ?? true;
      record.createdByUserId = entry.createdByUserId ?? null;
      record.scopes = entry.scopes ?? null;
      record.expiresAt = entry.expiresAt ? new Date(entry.expiresAt) : null;
      record.lastUsedAt = entry.lastUsedAt ? new Date(entry.lastUsedAt) : null;
      record.createdAt = entry.createdAt
        ? new Date(entry.createdAt)
        : (existing?.createdAt ?? new Date());
      record.updatedAt = entry.updatedAt ? new Date(entry.updatedAt) : new Date();

      await repo.save(record as ApiKey);
      console.log(`${existing ? 'Updated' : 'Inserted'} API key: ${entry.name}`);
    } catch (err) {
      console.error(`Failed to seed API key ${entry.name}:`, err);
    }
  }
}
