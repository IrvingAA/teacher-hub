import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitTenantProfileModel1709251200000 implements MigrationInterface {
  name = 'InitTenantProfileModel1709251200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        "tenantId" VARCHAR(120) NOT NULL DEFAULT 'public',
        "globalRole" VARCHAR(20) NOT NULL DEFAULT 'user',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_USERS_GLOBAL_ROLE" CHECK ("globalRole" IN ('owner', 'user'))
      );
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'globalRole') THEN
          ALTER TABLE users ADD COLUMN "globalRole" VARCHAR(20) NOT NULL DEFAULT 'user';
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
          ALTER TABLE users DROP COLUMN role;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS schools (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(160) NOT NULL UNIQUE,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_school_memberships (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "schoolId" uuid NOT NULL,
        role VARCHAR(20) NOT NULL,
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "FK_USER_SCHOOL_MEMBERSHIPS_USER" FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT "FK_USER_SCHOOL_MEMBERSHIPS_SCHOOL" FOREIGN KEY ("schoolId") REFERENCES schools(id) ON DELETE CASCADE,
        CONSTRAINT "CHK_USER_SCHOOL_MEMBERSHIPS_ROLE" CHECK (role IN ('admin','teacher','student'))
      );
    `);

    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "IDX_USER_SCHOOL_MEMBERSHIPS_USER_SCHOOL_UNIQUE" ON user_school_memberships ("userId", "schoolId")'
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_USER_SCHOOL_MEMBERSHIPS_USER" ON user_school_memberships ("userId")'
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_USER_SCHOOL_MEMBERSHIPS_SCHOOL" ON user_school_memberships ("schoolId")'
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS membership_profiles (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "membershipId" uuid NOT NULL UNIQUE,
        "firstName" VARCHAR(100) NOT NULL,
        "lastName" VARCHAR(100) NOT NULL,
        "phoneNumber" VARCHAR(40),
        specialization VARCHAR(120),
        "hireDate" DATE,
        status VARCHAR(20),
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        metadata JSONB,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        CONSTRAINT "FK_MEMBERSHIP_PROFILES_MEMBERSHIP" FOREIGN KEY ("membershipId") REFERENCES user_school_memberships(id) ON DELETE CASCADE,
        CONSTRAINT "CHK_MEMBERSHIP_PROFILES_STATUS" CHECK (status IS NULL OR status IN ('active','inactive','on_leave')),
        CONSTRAINT "CHK_MEMBERSHIP_PROFILES_IS_ACTIVE" CHECK ("isActive" IS NOT NULL)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(160) NOT NULL,
        "schoolId" uuid NOT NULL,
        "teacherMembershipId" uuid NOT NULL,
        "studentIds" JSONB NOT NULL DEFAULT '[]',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "FK_GROUPS_SCHOOL" FOREIGN KEY ("schoolId") REFERENCES schools(id) ON DELETE CASCADE,
        CONSTRAINT "FK_GROUPS_TEACHER" FOREIGN KEY ("teacherMembershipId") REFERENCES user_school_memberships(id) ON DELETE CASCADE
      );
    `);

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_GROUPS_SCHOOL" ON groups ("schoolId")'
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_GROUPS_TEACHER" ON groups ("teacherMembershipId")'
    );

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_MEMBERSHIP_PROFILES_NAME" ON membership_profiles ("lastName", "firstName")'
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_MEMBERSHIP_PROFILES_STATUS" ON membership_profiles (status)'
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS events (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "requestId" VARCHAR(64),
        "tenantId" VARCHAR(120),
        "actorUserId" uuid,
        category VARCHAR(20) NOT NULL,
        action VARCHAR(120) NOT NULL,
        method VARCHAR(10),
        path VARCHAR(255),
        "statusCode" INTEGER,
        "resourceType" VARCHAR(80),
        "resourceId" VARCHAR(120),
        ip VARCHAR(64),
        "userAgent" VARCHAR(255),
        browser VARCHAR(120),
        os VARCHAR(120),
        before JSONB,
        after JSONB,
        changes JSONB,
        metadata JSONB,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_EVENTS_CATEGORY" CHECK (category IN ('request', 'audit'))
      );
    `);

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_EVENTS_CREATED_AT" ON events ("createdAt")'
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_EVENTS_REQUEST_ID" ON events ("requestId")'
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_EVENTS_ACTOR_USER_ID" ON events ("actorUserId")'
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_EVENTS_RESOURCE" ON events ("resourceType", "resourceId")'
    );

    await queryRunner.query(`
      DO $$
      DECLARE
        has_teachers_table BOOLEAN;
        has_user_id BOOLEAN;
        has_school_id BOOLEAN;
        has_email BOOLEAN;
      BEGIN
        SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teachers') INTO has_teachers_table;

        IF has_teachers_table THEN
          SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'userId') INTO has_user_id;
          SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'schoolId') INTO has_school_id;
          SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'email') INTO has_email;

          IF has_user_id AND has_school_id THEN
            INSERT INTO user_school_memberships ("userId", "schoolId", role, "isDefault", "createdAt", "updatedAt")
            SELECT DISTINCT t."userId", t."schoolId", 'teacher', false, now(), now()
            FROM teachers t
            WHERE t."deletedAt" IS NULL
              AND NOT EXISTS (
                SELECT 1
                FROM user_school_memberships m
                WHERE m."userId" = t."userId" AND m."schoolId" = t."schoolId"
              );

            INSERT INTO membership_profiles (
              "membershipId", "firstName", "lastName", "phoneNumber", specialization, "hireDate", status, "createdAt", "updatedAt", "deletedAt"
            )
            SELECT
              m.id,
              t."firstName",
              t."lastName",
              t."phoneNumber",
              t.specialization,
              t."hireDate",
              t.status,
              COALESCE(t."createdAt", now()),
              COALESCE(t."updatedAt", now()),
              t."deletedAt"
            FROM teachers t
            INNER JOIN user_school_memberships m
              ON m."userId" = t."userId" AND m."schoolId" = t."schoolId" AND m.role = 'teacher'
            WHERE NOT EXISTS (SELECT 1 FROM membership_profiles p WHERE p."membershipId" = m.id);

          ELSIF has_email THEN
            INSERT INTO user_school_memberships ("userId", "schoolId", role, "isDefault", "createdAt", "updatedAt")
            SELECT DISTINCT u.id, u."tenantId"::uuid, 'teacher', false, now(), now()
            FROM teachers t
            INNER JOIN users u ON u.email = t.email
            WHERE t."deletedAt" IS NULL
              AND u."tenantId" ~* '^[0-9a-fA-F-]{36}$'
              AND NOT EXISTS (
                SELECT 1
                FROM user_school_memberships m
                WHERE m."userId" = u.id AND m."schoolId" = (u."tenantId"::uuid)
              );

            INSERT INTO membership_profiles (
              "membershipId", "firstName", "lastName", "phoneNumber", specialization, "hireDate", status, "createdAt", "updatedAt", "deletedAt"
            )
            SELECT
              m.id,
              t."firstName",
              t."lastName",
              t."phoneNumber",
              t.specialization,
              t."hireDate",
              t.status,
              COALESCE(t."createdAt", now()),
              COALESCE(t."updatedAt", now()),
              t."deletedAt"
            FROM teachers t
            INNER JOIN users u ON u.email = t.email
            INNER JOIN user_school_memberships m
              ON m."userId" = u.id
             AND m."schoolId" = (u."tenantId"::uuid)
             AND m.role = 'teacher'
            WHERE u."tenantId" ~* '^[0-9a-fA-F-]{36}$'
              AND NOT EXISTS (SELECT 1 FROM membership_profiles p WHERE p."membershipId" = m.id);
          END IF;

          DROP TABLE IF EXISTS teachers;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS events');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS teachers (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "schoolId" uuid NOT NULL,
        "firstName" VARCHAR(100) NOT NULL,
        "lastName" VARCHAR(100) NOT NULL,
        specialization VARCHAR(120) NOT NULL,
        "phoneNumber" VARCHAR(40),
        "hireDate" DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ
      );
    `);

    await queryRunner.query(`
      INSERT INTO teachers (
        "userId", "schoolId", "firstName", "lastName", specialization, "phoneNumber", "hireDate", status, "createdAt", "updatedAt", "deletedAt"
      )
      SELECT
        m."userId",
        m."schoolId",
        p."firstName",
        p."lastName",
        COALESCE(p.specialization, 'general'),
        p."phoneNumber",
        COALESCE(p."hireDate", CURRENT_DATE),
        COALESCE(p.status, 'active'),
        p."createdAt",
        p."updatedAt",
        p."deletedAt"
      FROM membership_profiles p
      INNER JOIN user_school_memberships m ON m.id = p."membershipId"
      WHERE m.role = 'teacher';
    `);

    await queryRunner.query('DROP TABLE IF EXISTS membership_profiles');
    await queryRunner.query('DROP TABLE IF EXISTS groups');
    await queryRunner.query('DROP TABLE IF EXISTS user_school_memberships');
    await queryRunner.query('DROP TABLE IF EXISTS schools');

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
          IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'role'
          ) THEN
            ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'admin';
          END IF;

          IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'globalRole'
          ) THEN
            ALTER TABLE users DROP COLUMN "globalRole";
          END IF;
        END IF;
      END $$;
    `);
  }
}
