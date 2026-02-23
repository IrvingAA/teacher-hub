import type { TeacherStatus } from '../../models/membership-profile.entity';
import type { ListTeachersQueryDto } from '../../routes/teachers/teachers.schemas';
import type { TenantRole } from '../../models/user-school-membership.entity';

export interface ListMembershipOptions extends ListTeachersQueryDto {
  role?: TenantRole;
}

export interface MembershipRecord {
  id: string;
  userId: string;
  schoolId: string;
  email: string;
  firstName: string;
  lastName: string;
  specialization: string;
  phoneNumber: string | null;
  hireDate: Date;
  status: TeacherStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MembershipRow {
  id: string;
  userId: string;
  schoolId: string;
  email: string;
  firstName: string;
  lastName: string;
  specialization: string;
  phoneNumber: string | null;
  hireDate: string;
  status: TeacherStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const MEMBERSHIP_ALLOWED_UPDATE_FIELDS = [
  'firstName',
  'lastName',
  'specialization',
  'phoneNumber',
  'hireDate',
  'status',
] as const;

export const MEMBERSHIP_SORTABLE_COLUMNS: Record<string, string> = {
  firstName: 'profile.firstName',
  lastName: 'profile.lastName',
  hireDate: 'profile.hireDate',
  createdAt: 'profile.createdAt',
};
