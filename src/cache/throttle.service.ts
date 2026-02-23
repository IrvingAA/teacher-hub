import { redis } from '../config/redis';

const THROTTLE_PREFIX = 'throttle:';

export interface ThrottleStatus {
  isBlocked: boolean;
  attempts: number;
  waitTimeSeconds: number;
  lockUntil: number | null;
}

export class ThrottleService {
  async recordAttempt(key: string): Promise<ThrottleStatus> {
    const fullKey = `${THROTTLE_PREFIX}${key}`;
    const attempts = await redis.incr(`${fullKey}:attempts`);

    if (attempts <= 10) {
      await redis.expire(`${fullKey}:attempts`, 60);
      return {
        isBlocked: false,
        attempts,
        waitTimeSeconds: 0,
        lockUntil: null,
      };
    }

    let waitTimeSeconds = 0;
    const blockCount = attempts - 10;

    if (blockCount === 1) {
      waitTimeSeconds = 30;
    } else {
      waitTimeSeconds = Math.min(30 * Math.pow(2, blockCount - 1), 3600);
    }

    const lockUntil = Date.now() + waitTimeSeconds * 1000;
    await redis.set(`${fullKey}:lock_until`, lockUntil.toString(), 'EX', waitTimeSeconds);

    return {
      isBlocked: true,
      attempts,
      waitTimeSeconds,
      lockUntil,
    };
  }

  async getStatus(key: string): Promise<ThrottleStatus> {
    const fullKey = `${THROTTLE_PREFIX}${key}`;
    const [attemptsRaw, lockUntilRaw] = await Promise.all([
      redis.get(`${fullKey}:attempts`),
      redis.get(`${fullKey}:lock_until`),
    ]);

    const attempts = parseInt(attemptsRaw || '0', 10);
    const lockUntil = lockUntilRaw ? parseInt(lockUntilRaw, 10) : null;
    const now = Date.now();

    const isBlocked = lockUntil !== null && lockUntil > now;
    const waitTimeSeconds = isBlocked ? Math.ceil((lockUntil - now) / 1000) : 0;

    return {
      isBlocked,
      attempts,
      waitTimeSeconds,
      lockUntil,
    };
  }

  async clear(key: string): Promise<void> {
    const fullKey = `${THROTTLE_PREFIX}${key}`;
    await redis.del(`${fullKey}:attempts`, `${fullKey}:lock_until`);
  }

  async clearAll(): Promise<void> {
    const keys = await redis.keys(`${THROTTLE_PREFIX}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  private async calculateWaitTime(prevAttempts: number): Promise<number> {
    if (prevAttempts <= 0) return 0;
    if (prevAttempts === 1) return 15;

    let wait = 15;
    for (let i = 2; i <= prevAttempts; i++) {
      if (wait < 300) {
        wait = Math.min(wait * 2, 300);
      } else {
        wait = 120;
      }
    }
    return wait;
  }
}

export const throttleService = new ThrottleService();
