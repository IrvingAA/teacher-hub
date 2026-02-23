import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from './env';
import { User } from '../models/user.entity';
import { Event } from '../models/event.entity';
import { School } from '../models/school.entity';
import { UserSchoolMembership } from '../models/user-school-membership.entity';
import { MembershipProfile } from '../models/membership-profile.entity';
import { Group } from '../models/group.entity';
import { ApiKey } from '../models/api-key.entity';
import { InitTenantProfileModel1709251200000 } from '../migrations/1709251200000-InitTenantProfileModel';
import { CreateApiKeys1709251300000 } from '../migrations/1709251300000-CreateApiKeys';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  synchronize: env.DB_SYNCHRONIZE,
  logging: env.NODE_ENV === 'development',
  entities: [MembershipProfile, Group, User, Event, School, UserSchoolMembership, ApiKey],
  migrations: [InitTenantProfileModel1709251200000, CreateApiKeys1709251300000],
  subscribers: [],
});

export async function connectPostgres(): Promise<void> {
  if (AppDataSource.isInitialized) {
    return;
  }

  await AppDataSource.initialize();
  console.log('PostgreSQL connected');

  if (env.DB_RUN_MIGRATIONS) {
    await AppDataSource.runMigrations();
    console.log('PostgreSQL migrations applied');
  }
}
