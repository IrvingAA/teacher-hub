import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { EventCategory } from '../types/events/events.type';

@Entity('events')
@Index('IDX_EVENTS_CREATED_AT', ['createdAt'])
@Index('IDX_EVENTS_REQUEST_ID', ['requestId'])
@Index('IDX_EVENTS_ACTOR_USER_ID', ['actorUserId'])
@Index('IDX_EVENTS_RESOURCE', ['resourceType', 'resourceId'])
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  requestId!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  tenantId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  actorUserId!: string | null;

  @Column({ type: 'varchar', length: 20 })
  category!: EventCategory;

  @Column({ type: 'varchar', length: 120 })
  action!: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  method!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  path!: string | null;

  @Column({ type: 'integer', nullable: true })
  statusCode!: number | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  resourceType!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  resourceId!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  browser!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  os!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  before!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  after!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  changes!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
