import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.pg';
import { ApiKey } from '../models/api-key.entity';
import { createAppError } from '../middlewares/errorHandler';

const API_KEY_PREFIX = 'thk';

export interface ApiKeyCreateInput {
  name: string;
  createdByUserId?: string | null;
  scopes?: string[];
  expiresAt?: Date | null;
}

export interface ApiKeyCreateResult {
  id: string;
  name: string;
  publicKey: string;
  key: string;
  scopes: string[] | null;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
}

export interface ApiKeyListItem {
  id: string;
  name: string;
  publicKey: string;
  isActive: boolean;
  scopes: string[] | null;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ApiKeyService {
  private readonly repository: Repository<ApiKey>;

  constructor(repository?: Repository<ApiKey>) {
    this.repository = repository ?? AppDataSource.getRepository(ApiKey);
  }

  async create(input: ApiKeyCreateInput): Promise<ApiKeyCreateResult> {
    const { publicKey, secret } = this.generateRawParts();
    const salt = this.generateSalt();
    const secretHash = this.hashSecret(secret, salt);

    const record = this.repository.create({
      name: input.name,
      publicKey,
      secretHash,
      salt,
      isActive: true,
      createdByUserId: input.createdByUserId ?? null,
      scopes: input.scopes ?? null,
      expiresAt: input.expiresAt ?? null,
      lastUsedAt: null,
    });

    const saved = await this.repository.save(record);

    return {
      id: saved.id,
      name: saved.name,
      publicKey: saved.publicKey,
      key: this.toApiKey(saved.publicKey, secret),
      scopes: saved.scopes,
      expiresAt: saved.expiresAt,
      isActive: saved.isActive,
      createdAt: saved.createdAt,
    };
  }

  async list(): Promise<ApiKeyListItem[]> {
    const rows = await this.repository.find({
      order: { createdAt: 'DESC' },
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      publicKey: row.publicKey,
      isActive: row.isActive,
      scopes: row.scopes,
      expiresAt: row.expiresAt,
      lastUsedAt: row.lastUsedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async revoke(id: string): Promise<void> {
    const row = await this.repository.findOne({ where: { id } });
    if (!row) {
      throw createAppError('API key not found', 'API_KEY_NOT_FOUND', 404);
    }

    row.isActive = false;
    await this.repository.save(row);
  }

  async validate(rawApiKey: string): Promise<boolean> {
    const parsed = this.parseApiKey(rawApiKey);
    if (!parsed) {
      return false;
    }

    const row = await this.repository.findOne({ where: { publicKey: parsed.publicKey, isActive: true } });
    if (!row) {
      return false;
    }

    if (row.expiresAt && row.expiresAt.getTime() <= Date.now()) {
      return false;
    }

    const hash = this.hashSecret(parsed.secret, row.salt);
    const isValid = timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(row.secretHash, 'hex'));

    if (isValid) {
      row.lastUsedAt = new Date();
      await this.repository.save(row);
    }

    return isValid;
  }

  async upsertBootstrapKey(name: string, rawApiKey: string): Promise<void> {
    const parsed = this.parseApiKey(rawApiKey);
    if (!parsed) {
      throw createAppError('Invalid bootstrap API key format', 'INVALID_BOOTSTRAP_API_KEY', 500);
    }

    const existing = await this.repository.findOne({ where: { publicKey: parsed.publicKey } });
    const salt = this.generateSalt();
    const secretHash = this.hashSecret(parsed.secret, salt);

    if (!existing) {
      await this.repository.save(
        this.repository.create({
          name,
          publicKey: parsed.publicKey,
          secretHash,
          salt,
          isActive: true,
          createdByUserId: null,
          scopes: null,
          expiresAt: null,
          lastUsedAt: null,
        })
      );
      return;
    }

    existing.name = name;
    existing.secretHash = secretHash;
    existing.salt = salt;
    existing.isActive = true;
    await this.repository.save(existing);
  }

  private generateRawParts(): { publicKey: string; secret: string } {
    const publicKey = randomBytes(8).toString('hex');
    const secret = randomBytes(24).toString('hex');
    return { publicKey, secret };
  }

  private toApiKey(publicKey: string, secret: string): string {
    return `${API_KEY_PREFIX}_${publicKey}.${secret}`;
  }

  private generateSalt(): string {
    return randomBytes(16).toString('hex');
  }

  private hashSecret(secret: string, salt: string): string {
    return scryptSync(secret, salt, 64).toString('hex');
  }

  private parseApiKey(raw: string | null | undefined): { publicKey: string; secret: string } | null {
    if (!raw || typeof raw !== 'string') {
      return null;
    }

    const [prefixAndPublic, secret] = raw.split('.', 2);
    if (!prefixAndPublic || !secret) {
      return null;
    }

    const firstUnderscoreIndex = prefixAndPublic.indexOf('_');
    if (firstUnderscoreIndex === -1) {
      return null;
    }

    const prefix = prefixAndPublic.substring(0, firstUnderscoreIndex);
    const publicKey = prefixAndPublic.substring(firstUnderscoreIndex + 1);

    if (prefix !== API_KEY_PREFIX || !publicKey || publicKey.length < 4 || secret.length < 16) {
      return null;
    }

    return { publicKey, secret };
  }
}

export const apiKeyService = new ApiKeyService();
