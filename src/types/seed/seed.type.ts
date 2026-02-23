import type { GlobalRole } from '../../models/user.entity';
import type { TenantRole } from '../../models/user-school-membership.entity';
import type { TeacherStatus } from '../../models/membership-profile.entity';

export interface SeedUserMembership {
  schoolId: string;
  schoolName: string;
  role: TenantRole;
  isDefault?: boolean;
  profile?: {
    firstName: string;
    lastName: string;
    phoneNumber?: string | null;
    specialization?: string | null;
    hireDate?: string | Date | null;
    status?: TeacherStatus | null;
  };
}

export interface SeedUser {
  id?: string;
  email: string;
  password: string;
  globalRole?: GlobalRole;
  memberships: SeedUserMembership[];
}
