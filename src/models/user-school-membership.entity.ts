import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { School } from './school.entity';
import { User } from './user.entity';

export type TenantRole = 'admin' | 'teacher' | 'student';

@Entity('user_school_memberships')
@Index('IDX_USER_SCHOOL_MEMBERSHIPS_USER_SCHOOL_UNIQUE', ['userId', 'schoolId'], { unique: true })
@Index('IDX_USER_SCHOOL_MEMBERSHIPS_USER', ['userId'])
@Index('IDX_USER_SCHOOL_MEMBERSHIPS_SCHOOL', ['schoolId'])
export class UserSchoolMembership {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'uuid' })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @Column({
    type: 'enum',
    enum: ['admin', 'teacher', 'student'],
  })
  role!: TenantRole;

  @Column({ type: 'boolean', default: false })
  isDefault!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
