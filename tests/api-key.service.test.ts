import { createAppError } from '../src/middlewares/errorHandler';

jest.mock('../src/config/database.pg', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

import { ApiKeyService } from '../src/services/api-key.service';

type ApiKeyRow = {
  id: string;
  name: string;
  publicKey: string;
  secretHash: string;
  salt: string;
  isActive: boolean;
  createdByUserId: string | null;
  scopes: string[] | null;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function createApiKeyRepoMock() {
  const rows: ApiKeyRow[] = [];

  return {
    rows,
    create: jest.fn((input: Partial<ApiKeyRow>) => input),
    save: jest.fn(async (input: Partial<ApiKeyRow>) => {
      if (input.id) {
        const idx = rows.findIndex((row) => row.id === input.id);
        if (idx >= 0) {
          rows[idx] = { ...rows[idx], ...input, updatedAt: new Date() } as ApiKeyRow;
          return rows[idx];
        }
      }

      const created: ApiKeyRow = {
        id: input.id ?? `api-key-${rows.length + 1}`,
        name: String(input.name),
        publicKey: String(input.publicKey),
        secretHash: String(input.secretHash),
        salt: String(input.salt),
        isActive: input.isActive ?? true,
        createdByUserId: input.createdByUserId ?? null,
        scopes: input.scopes ?? null,
        expiresAt: input.expiresAt ?? null,
        lastUsedAt: input.lastUsedAt ?? null,
        createdAt: input.createdAt ?? new Date(),
        updatedAt: input.updatedAt ?? new Date(),
      };

      rows.push(created);
      return created;
    }),
    find: jest.fn(async () => rows.slice().sort((a, b) => +b.createdAt - +a.createdAt)),
    findOne: jest.fn(async ({ where }: { where: Record<string, unknown> }) => {
      if (where.id) {
        return rows.find((row) => row.id === where.id) ?? null;
      }
      if (where.publicKey && Object.prototype.hasOwnProperty.call(where, 'isActive')) {
        return (
          rows.find((row) => row.publicKey === where.publicKey && row.isActive === where.isActive) ?? null
        );
      }
      if (where.publicKey) {
        return rows.find((row) => row.publicKey === where.publicKey) ?? null;
      }
      return null;
    }),
  };
}

describe('ApiKeyService', () => {
  it('creates and lists API keys', async () => {
    const repo = createApiKeyRepoMock();
    const service = new ApiKeyService(repo as never);

    const created = await service.create({ name: 'frontend-dev', scopes: ['teachers:read'] });
    expect(created.key.startsWith('thk_')).toBe(true);
    expect(created.publicKey.length).toBeGreaterThanOrEqual(8);

    const list = await service.list();
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('frontend-dev');
    expect(list[0].publicKey).toBe(created.publicKey);
  });

  it('revokes existing key and throws for unknown key', async () => {
    const repo = createApiKeyRepoMock();
    const service = new ApiKeyService(repo as never);
    const created = await service.create({ name: 'to-revoke' });

    await service.revoke(created.id);
    const revoked = repo.rows.find((row) => row.id === created.id);
    expect(revoked?.isActive).toBe(false);

    await expect(service.revoke('missing')).rejects.toMatchObject(
      createAppError('API key not found', 'API_KEY_NOT_FOUND', 404)
    );
  });

  it('validates malformed/expired/inactive and valid keys', async () => {
    const repo = createApiKeyRepoMock();
    const service = new ApiKeyService(repo as never);

    expect(await service.validate('bad-format')).toBe(false);

    await service.upsertBootstrapKey(
      'bootstrap-valid',
      'thk_aaaaaaaaaaaaaaaa.bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
    );
    expect(await service.validate('thk_aaaaaaaaaaaaaaaa.bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb')).toBe(true);

    repo.rows[0].expiresAt = new Date(Date.now() - 1000);
    expect(await service.validate('thk_aaaaaaaaaaaaaaaa.bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb')).toBe(false);

    repo.rows[0].expiresAt = null;
    repo.rows[0].isActive = false;
    expect(await service.validate('thk_aaaaaaaaaaaaaaaa.bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb')).toBe(false);
  });

  it('upserts bootstrap key and rejects invalid format', async () => {
    const repo = createApiKeyRepoMock();
    const service = new ApiKeyService(repo as never);

    await expect(service.upsertBootstrapKey('bad', 'not-valid')).rejects.toMatchObject(
      createAppError('Invalid bootstrap API key format', 'INVALID_BOOTSTRAP_API_KEY', 500)
    );

    await service.upsertBootstrapKey('bootstrap', 'thk_cccccccccccccccc.dddddddddddddddddddddddddddddddd');
    expect(repo.rows).toHaveLength(1);
    expect(repo.rows[0].name).toBe('bootstrap');

    await service.upsertBootstrapKey(
      'bootstrap-updated',
      'thk_cccccccccccccccc.dddddddddddddddddddddddddddddddd'
    );
    expect(repo.rows).toHaveLength(1);
    expect(repo.rows[0].name).toBe('bootstrap-updated');
  });
});
