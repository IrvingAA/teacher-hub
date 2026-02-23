import type { MembershipRecord as TeacherRecord } from '../../types/repositories/membership-profile-repository.type';

export type TeacherResponseDto = TeacherRecord;

export function toTeacherResponseDto(teacher: TeacherRecord): TeacherResponseDto {
  return {
    id: teacher.id,
    userId: teacher.userId,
    schoolId: teacher.schoolId,
    email: teacher.email,
    firstName: teacher.firstName,
    lastName: teacher.lastName,
    specialization: teacher.specialization,
    phoneNumber: teacher.phoneNumber,
    hireDate: teacher.hireDate,
    status: teacher.status,
    isActive: teacher.isActive,
    createdAt: teacher.createdAt,
    updatedAt: teacher.updatedAt,
  };
}
