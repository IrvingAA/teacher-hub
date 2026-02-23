import app from './app';
import { env } from './config/env';
import { connectPostgres } from './config/database.pg';
import { redis } from './config/redis';
import { seedUsersCatalog, seedApiKeysCatalog } from './config/seeder';
import { apiKeyService } from './services/api-key.service';
import { AppDataSource } from './config/database.pg';
import { ApiKey } from './models/api-key.entity';

const RETRY_MS = 5000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function connectPostgresWithRetry(): Promise<void> {
  while (true) {
    try {
      await connectPostgres();
      return;
    } catch (error) {
      console.error('PostgreSQL not ready, retrying in 5s:', error);
      await sleep(RETRY_MS);
    }
  }
}

async function connectRedisWithRetry(): Promise<void> {
  while (true) {
    try {
      if (redis.status !== 'ready') {
        await redis.connect();
      }
      return;
    } catch (error) {
      console.error('Redis not ready, retrying in 5s:', error);
      await sleep(RETRY_MS);
    }
  }
}

async function bootstrap(): Promise<void> {
  await connectPostgresWithRetry();
  await connectRedisWithRetry();
  await seedUsersCatalog();
  await seedApiKeysCatalog();
  if (env.API_KEY_ENABLED && env.API_KEY_BOOTSTRAP_VALUE) {
    const raw = env.API_KEY_BOOTSTRAP_VALUE;
    const parts = typeof raw === 'string' ? raw.split('.', 2) : null;
    let publicKeyFromEnv: string | null = null;
    if (parts && parts[0]) {
      const prefixAndPublic = parts[0];
      const underscoreIndex = prefixAndPublic.indexOf('_');
      if (underscoreIndex !== -1) {
        publicKeyFromEnv = prefixAndPublic.substring(underscoreIndex + 1);
      }
    }

    let shouldUpsert = true;
    if (publicKeyFromEnv) {
      try {
        const repo = AppDataSource.getRepository(ApiKey);
        const existing = await repo.findOne({ where: { publicKey: publicKeyFromEnv } });
        if (existing) {
          shouldUpsert = false;
          console.log('Bootstrap API key already exists in DB — skipping env bootstrap upsert');
        }
      } catch (err) {
        console.error('Error checking existing API key:', err);
      }
    }

    if (shouldUpsert) {
      await apiKeyService.upsertBootstrapKey(
        env.API_KEY_BOOTSTRAP_NAME,
        env.API_KEY_BOOTSTRAP_VALUE
      );
      console.log('---------------------------------------------------------');
      console.log('🔐 BOOTSTRAP API KEY INITIALIZED');
      console.log(`   Name:  ${env.API_KEY_BOOTSTRAP_NAME}`);
      console.log(`   Value: ${env.API_KEY_BOOTSTRAP_VALUE}`);
      console.log('   Usage: Add header "X-Api-Key" or "Authorization: apikey <value>"');
      console.log('---------------------------------------------------------');
    }
  }

  app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${env.PORT}`);
  });
}

void bootstrap();
