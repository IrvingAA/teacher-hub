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
import { UserSchoolMembership } from './user-school-membership.entity';

@Entity('groups')
@Index('IDX_GROUPS_SCHOOL', ['schoolId'])
@Index('IDX_GROUPS_TEACHER', ['teacherMembershipId'])
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 160 })
  name!: string;

  @Column({ type: 'uuid' })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @Column({ type: 'uuid' })
  teacherMembershipId!: string;

  @ManyToOne(() => UserSchoolMembership, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacherMembershipId' })
  teacherMembership!: UserSchoolMembership;

  @Column({ type: 'jsonb', default: [] })
  studentIds!: string[];

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
