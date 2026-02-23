import { throttleService } from '../src/cache/throttle.service';
import { throttle } from '../src/middlewares/throttle';
import { redis } from '../src/config/redis';
import { Request, Response } from 'express';

jest.mock('../src/config/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    keys: jest.fn(),
  },
}));

const mockSendApiResponse = jest.fn();
jest.mock('../src/routes/_shared/response.utils', () => ({
  sendApiResponse: (...args: any[]) => mockSendApiResponse(...args),
}));

describe('Throttle System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ThrottleService', () => {
    it('does not block for first 10 attempts', async () => {
      (redis.incr as jest.Mock).mockResolvedValue(1);
      const status = await throttleService.recordAttempt('test-key');
      expect(status.isBlocked).toBe(false);
      expect(redis.expire).toHaveBeenCalledWith(expect.any(String), 60);
    });

    it('blocks starting from attempt 11', async () => {
      (redis.incr as jest.Mock).mockResolvedValue(11);
      const status = await throttleService.recordAttempt('test-key');
      expect(status.isBlocked).toBe(true);
      expect(status.waitTimeSeconds).toBe(30);
      expect(redis.set).toHaveBeenCalledWith(
        expect.stringContaining('lock_until'),
        expect.any(String),
        'EX',
        30
      );
    });

    it('returns status correctly when not blocked', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      const status = await throttleService.getStatus('test-key');
      expect(status.isBlocked).toBe(false);
      expect(status.attempts).toBe(0);
    });

    it('returns status correctly when blocked', async () => {
      const future = Date.now() + 5000;
      (redis.get as jest.Mock).mockImplementation((key: string) => {
        if (key.includes('attempts')) return '11';
        if (key.includes('lock_until')) return future.toString();
        return null;
      });

      const status = await throttleService.getStatus('test-key');
      expect(status.isBlocked).toBe(true);
      expect(status.attempts).toBe(11);
      expect(status.waitTimeSeconds).toBeLessThanOrEqual(5);
    });

    it('clears all throttles', async () => {
      (redis.keys as jest.Mock).mockResolvedValue(['k1', 'k2']);
      await throttleService.clearAll();
      expect(redis.del).toHaveBeenCalledWith('k1', 'k2');
    });
  });

  describe('throttle middleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;

    beforeEach(() => {
      req = { ip: '127.0.0.1', path: '/test', socket: {} as any };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        setHeader: jest.fn(),
        locals: {},
      };
      next = jest.fn();
    });

    it('blocks request if status is blocked', async () => {
      jest.spyOn(throttleService, 'getStatus').mockResolvedValue({
        isBlocked: true,
        attempts: 11,
        waitTimeSeconds: 100,
        lockUntil: Date.now() + 100000,
      });

      const middleware = throttle({ keyPrefix: 'test', useIP: true });
      await middleware(req as Request, res as Response, next);

      expect(mockSendApiResponse).toHaveBeenCalledWith(
        res,
        expect.objectContaining({ statusCode: 429 })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('records attempt and proceeds if not blocked', async () => {
      jest.spyOn(throttleService, 'getStatus').mockResolvedValue({
        isBlocked: false,
        attempts: 0,
        waitTimeSeconds: 0,
        lockUntil: null,
      });
      const recordSpy = jest.spyOn(throttleService, 'recordAttempt').mockResolvedValue({} as any);

      const middleware = throttle({ keyPrefix: 'test', useIP: true });
      await middleware(req as Request, res as Response, next);

      expect(recordSpy).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });
});
