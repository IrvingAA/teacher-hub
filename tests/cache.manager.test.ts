import { CacheManager } from '../src/cache/cache.manager';

describe('CacheManager', () => {
  it('builds stable keys for objects regardless of key order', () => {
    const client = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      sadd: jest.fn(),
      smembers: jest.fn(),
      expire: jest.fn(),
    };
    const manager = new CacheManager(client as never);

    const left = manager.buildKey('users:list', { b: 2, a: 1, c: { y: 2, x: 1 } });
    const right = manager.buildKey('users:list', { a: 1, b: 2, c: { x: 1, y: 2 } });
    expect(left).toBe(right);
  });

  it('returns cached value when key exists', async () => {
    const client = {
      get: jest.fn().mockResolvedValue('{"ok":true}'),
      set: jest.fn(),
      del: jest.fn(),
      sadd: jest.fn(),
      smembers: jest.fn(),
      expire: jest.fn(),
    };
    const manager = new CacheManager(client as never);
    const loader = jest.fn().mockResolvedValue({ ok: false });

    const value = await manager.getOrSet({
      key: 'k1',
      ttlSeconds: 10,
      loader,
    });

    expect(value).toEqual({ ok: true });
    expect(loader).not.toHaveBeenCalled();
  });

  it('loads, sets cache and tags on cache miss', async () => {
    const client = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      sadd: jest.fn().mockResolvedValue(1),
      smembers: jest.fn().mockResolvedValue([]),
      expire: jest.fn().mockResolvedValue(1),
    };
    const manager = new CacheManager(client as never);

    const value = await manager.getOrSet({
      key: 'k2',
      ttlSeconds: 30,
      tags: ['t1', 't2'],
      loader: async () => ({ id: 123 }),
    });

    expect(value).toEqual({ id: 123 });
    expect(client.set).toHaveBeenCalledWith('k2', JSON.stringify({ id: 123 }), 'EX', 30);
    expect(client.sadd).toHaveBeenCalledTimes(2);
    expect(client.expire).toHaveBeenCalledTimes(2);
  });

  it('invalidates keys and tags', async () => {
    const client = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn().mockResolvedValue(1),
      sadd: jest.fn(),
      smembers: jest.fn().mockResolvedValue(['k1', 'k2']),
      expire: jest.fn(),
    };
    const manager = new CacheManager(client as never);

    await manager.invalidateKeys(['k1', 'k1', '']);
    expect(client.del).toHaveBeenCalledWith('k1');

    await manager.invalidateTags(['users', 'users', '']);
    expect(client.smembers).toHaveBeenCalled();
    expect(client.del).toHaveBeenCalledWith('k1', 'k2');
  });
});
