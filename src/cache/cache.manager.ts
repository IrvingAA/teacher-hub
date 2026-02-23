import { redis } from '../config/redis';
import type { CacheClient, CacheGetOrSetInput } from '../types/cache/cache.type';

const TAG_KEY_PREFIX = 'cache:tag:';
const TAG_TTL_BUFFER_SECONDS = 300;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }

  if (isObject(value)) {
    return Object.keys(value)
      .sort((a, b) => a.localeCompare(b))
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = stableValue(value[key]);
        return acc;
      }, {});
  }

  return value;
}

function toTagKey(tag: string): string {
  return `${TAG_KEY_PREFIX}${tag}`;
}

export class CacheManager {
  constructor(private readonly client: CacheClient) {}

  buildKey(prefix: string, payload?: unknown): string {
    if (payload === undefined) {
      return prefix;
    }

    return `${prefix}:${JSON.stringify(stableValue(payload))}`;
  }

  async getOrSet<T>(input: CacheGetOrSetInput<T>): Promise<T> {
    const { key, ttlSeconds, tags = [], loader } = input;

    try {
      const cached = await this.client.get(key);
      if (cached !== null) {
        return JSON.parse(cached) as T;
      }
    } catch (error) {
      console.error(`Cache get failed for key "${key}":`, error);
    }

    const value = await loader();

    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);

      if (tags.length > 0) {
        await Promise.all(
          tags.map(async (tag) => {
            const tagKey = toTagKey(tag);
            await this.client.sadd(tagKey, key);
            await this.client.expire(tagKey, ttlSeconds + TAG_TTL_BUFFER_SECONDS);
          })
        );
      }
    } catch (error) {
      console.error(`Cache set failed for key "${key}":`, error);
    }

    return value;
  }

  async invalidateKeys(keys: string[]): Promise<void> {
    const uniqueKeys = [...new Set(keys)].filter((key) => key.length > 0);
    if (uniqueKeys.length === 0) {
      return;
    }

    try {
      await this.client.del(...uniqueKeys);
    } catch (error) {
      console.error('Cache key invalidation failed:', error);
    }
  }

  async invalidateTags(tags: string[]): Promise<void> {
    const uniqueTags = [...new Set(tags)].filter((tag) => tag.length > 0);
    if (uniqueTags.length === 0) {
      return;
    }

    try {
      const tagKeys = uniqueTags.map(toTagKey);
      const keysPerTag = await Promise.all(tagKeys.map((tagKey) => this.client.smembers(tagKey)));
      const keys = [...new Set(keysPerTag.flat())];

      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      await this.client.del(...tagKeys);
    } catch (error) {
      console.error('Cache tag invalidation failed:', error);
    }
  }
}

export const cacheManager = new CacheManager(redis as unknown as CacheClient);
