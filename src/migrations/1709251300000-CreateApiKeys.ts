import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateApiKeys1709251300000 implements MigrationInterface {
  name = 'CreateApiKeys1709251300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(120) NOT NULL,
        "publicKey" VARCHAR(64) NOT NULL,
        "secretHash" VARCHAR(255) NOT NULL,
        salt VARCHAR(255) NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdByUserId" uuid,
        scopes JSONB,
        "expiresAt" TIMESTAMPTZ,
        "lastUsedAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "IDX_API_KEYS_PUBLIC_KEY_UNIQUE" ON api_keys ("publicKey")'
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_API_KEYS_ACTIVE" ON api_keys ("isActive")'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS api_keys');
  }
}
