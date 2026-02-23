import { MembershipProfile, TeacherStatus } from '../models/membership-profile.entity';
import { BaseRepository } from './base.repository';
import type { UpdateTeacherDto } from '../routes/teachers/teachers.schemas';
import { UserSchoolMembership, TenantRole } from '../models/user-school-membership.entity';
import { User } from '../models/user.entity';
import { resolveSort } from '../utils/sort.utils';
import type { ListResult } from '../types/repositories/shared-repository.type';
import {
  ListMembershipOptions,
  MembershipRecord,
  MembershipRow,
  MEMBERSHIP_ALLOWED_UPDATE_FIELDS,
  MEMBERSHIP_SORTABLE_COLUMNS,
} from '../types/repositories/membership-profile-repository.type';

export class MembershipProfileRepository extends BaseRepository<MembershipProfile> {
  async findById(id: string, role: TenantRole = 'teacher'): Promise<MembershipRecord | null> {
    const row = await this.baseQuery(role)
      .andWhere('membership.id = :id', { id })
      .getRawOne<MembershipRow>();
    return row ? this.mapRow(row) : null;
  }

  async list(options: ListMembershipOptions): Promise<ListResult<MembershipRecord>> {
    const {
      page,
      limit,
      schoolId,
      userId,
      status,
      specialization,
      search,
      sortBy,
      sortOrder,
      role = 'teacher',
    } = options;

    const qb = this.baseQuery(role);

    if (schoolId) {
      qb.andWhere('membership."schoolId" = :schoolId', { schoolId });
    }

    if (userId) {
      qb.andWhere('membership."userId" = :userId', { userId });
    }

    if (status) {
      qb.andWhere('profile.status = :status', { status });
    }

    if (specialization) {
      qb.andWhere('profile.specialization ILIKE :specialization', {
        specialization: `%${specialization}%`,
      });
    }

    if (search) {
      qb.andWhere(
        `(profile.firstName ILIKE :searchTerm
          OR profile.lastName ILIKE :searchTerm
          OR user.email ILIKE :searchTerm
          OR COALESCE(profile.specialization, '') ILIKE :searchTerm
          OR COALESCE(profile.phoneNumber, '') ILIKE :searchTerm)`,
        { searchTerm: `%${search}%` }
      );
    }

    const total = await qb.clone().getCount();
    const sort = resolveSort(sortBy, sortOrder, MEMBERSHIP_SORTABLE_COLUMNS);

    const rows = await qb
      .orderBy(sort.column, sort.direction)
      .skip((page - 1) * limit)
      .take(limit)
      .getRawMany<MembershipRow>();

    return {
      data: rows.map((row) => this.mapRow(row)),
      total,
    };
  }

  async updateProfile(id: string, changes: UpdateTeacherDto): Promise<MembershipRecord | null> {
    const existing = await this.findProfileByMembershipId(id);

    if (!existing) {
      return null;
    }

    const safeChanges = this.sanitizePatch(changes, MEMBERSHIP_ALLOWED_UPDATE_FIELDS);

    if (this.hasPatchChanges(safeChanges)) {
      Object.assign(existing, safeChanges);
      await this.repository.save(existing);
    }

    return this.findById(id);
  }

  async updateStatus(id: string, status: TeacherStatus): Promise<MembershipRecord | null> {
    const existing = await this.findProfileByMembershipId(id);

    if (!existing) {
      return null;
    }

    existing.status = status;
    await this.repository.save(existing);
    return this.findById(id);
  }

  async softDeleteByMembershipId(id: string): Promise<boolean> {
    const existing = await this.findProfileByMembershipId(id);

    if (!existing) {
      return false;
    }

    const result = await this.repository.softDelete(existing.id);
    return Boolean(result.affected);
  }

  private baseQuery(role: TenantRole) {
    return this.repository
      .createQueryBuilder('profile')
      .innerJoin(UserSchoolMembership, 'membership', 'membership.id = profile."membershipId"')
      .innerJoin(User, 'user', 'user.id = membership."userId"')
      .where('membership.role = :role', { role })
      .andWhere('profile."deletedAt" IS NULL')
      .select([
        'membership.id AS id',
        'membership."userId" AS "userId"',
        'membership."schoolId" AS "schoolId"',
        'user.email AS email',
        'profile."firstName" AS "firstName"',
        'profile."lastName" AS "lastName"',
        'profile.specialization AS specialization',
        'profile."phoneNumber" AS "phoneNumber"',
        'profile."hireDate" AS "hireDate"',
        'profile.status AS status',
        'profile."isActive" AS "isActive"',
        'profile."createdAt" AS "createdAt"',
        'profile."updatedAt" AS "updatedAt"',
      ]);
  }

  private findProfileByMembershipId(membershipId: string): Promise<MembershipProfile | null> {
    return this.repository.findOne({ where: { membershipId } });
  }

  private mapRow(row: MembershipRow): MembershipRecord {
    return {
      id: row.id,
      userId: row.userId,
      schoolId: row.schoolId,
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      specialization: row.specialization,
      phoneNumber: row.phoneNumber,
      hireDate: new Date(row.hireDate),
      status: row.status,
      isActive: row.isActive,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }
}
