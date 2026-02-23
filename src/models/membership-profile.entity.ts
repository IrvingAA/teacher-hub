import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserSchoolMembership } from './user-school-membership.entity';

export type TeacherStatus = 'active' | 'inactive' | 'on_leave';

@Entity('membership_profiles')
@Index('IDX_MEMBERSHIP_PROFILES_MEMBERSHIP_UNIQUE', ['membershipId'], { unique: true })
@Index('IDX_MEMBERSHIP_PROFILES_NAME', ['lastName', 'firstName'])
@Index('IDX_MEMBERSHIP_PROFILES_STATUS', ['status'])
export class MembershipProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  membershipId!: string;

  @ManyToOne(() => UserSchoolMembership, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'membershipId' })
  membership!: UserSchoolMembership;

  @Column({ type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  phoneNumber?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  specialization?: string | null;

  @Column({ type: 'date', nullable: true })
  hireDate?: Date | null;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'on_leave'],
    nullable: true,
  })
  status?: TeacherStatus | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date | null;
}
