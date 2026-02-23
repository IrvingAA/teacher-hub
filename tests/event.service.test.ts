import { AppDataSource } from '../src/config/database.pg';
import { EventService } from '../src/services/event.service';

function makeRequest(overrides: Record<string, unknown> = {}): any {
  return {
    method: 'POST',
    originalUrl: '/api/teachers',
    path: '/api/teachers',
    query: { q: 'x', token: 'abc' },
    params: { id: '1' },
    body: { password: 'secret', nested: { authorization: 'bearer x' } },
    context: {
      requestId: 'req-1',
      tenantId: 'tenant-1',
      userId: 'user-ctx',
      client: {
        ip: '127.0.0.1',
        userAgent: 'jest',
        browser: 'chrome',
        os: 'linux',
      },
    },
    user: {
      id: '11111111-1111-4111-8111-111111111111',
      tenantId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    },
    ...overrides,
  };
}

describe('EventService', () => {
  const originalInitialized = AppDataSource.isInitialized;
  const originalGetRepository = AppDataSource.getRepository;

  afterEach(() => {
    (AppDataSource as any).isInitialized = originalInitialized;
    (AppDataSource as any).getRepository = originalGetRepository;
    jest.restoreAllMocks();
  });

  it('skips invalid payloads and invalid audit input', async () => {
    const service = new EventService();
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    await service.record({} as never);
    await service.recordAudit(makeRequest(), { action: 'x', statusCode: 99 } as never);

    expect(warnSpy).toHaveBeenCalled();
  });

  it('skips when datasource is not ready or repository has no save', async () => {
    const service = new EventService();

    (AppDataSource as any).isInitialized = false;
    await service.record({
      category: 'request',
      action: 'http.request.completed',
    } as never);

    (AppDataSource as any).isInitialized = true;
    (AppDataSource as any).getRepository = jest.fn().mockReturnValue({});
    await service.record({
      category: 'request',
      action: 'http.request.completed',
    } as never);

    expect((AppDataSource as any).getRepository).toHaveBeenCalled();
  });

  it('persists normalized/redacted request and audit events', async () => {
    const savedEvents: any[] = [];
    (AppDataSource as any).isInitialized = true;
    (AppDataSource as any).getRepository = jest.fn().mockReturnValue({
      save: jest.fn(async (event) => {
        savedEvents.push(event);
        return event;
      }),
    });

    const service = new EventService();
    await service.recordRequest(makeRequest(), { statusCode: 201 } as any);
    await service.recordAudit(makeRequest(), {
      action: 'teacher.updated',
      statusCode: 200,
      resourceType: 'teacher',
      resourceId: 'm1',
      before: { firstName: 'A', password: 'x' },
      after: { firstName: 'B', token: 'y' },
      metadata: { secret: 'z', ok: true },
    });

    expect(savedEvents).toHaveLength(2);
    expect(savedEvents[0].metadata.body.password).toBe('[REDACTED]');
    expect(savedEvents[0].metadata.query.token).toBe('[REDACTED]');
    expect(savedEvents[1].before.password).toBe('[REDACTED]');
    expect(savedEvents[1].after.token).toBe('[REDACTED]');
    expect(savedEvents[1].metadata.secret).toBe('[REDACTED]');
    expect(savedEvents[1].changes.firstName).toEqual({ before: 'A', after: 'B' });
  });

  it('supports fallback path and empty body branch in recordRequest', async () => {
    const savedEvents: any[] = [];
    (AppDataSource as any).isInitialized = true;
    (AppDataSource as any).getRepository = jest.fn().mockReturnValue({
      save: jest.fn(async (event) => {
        savedEvents.push(event);
        return event;
      }),
    });

    const req = makeRequest({ originalUrl: undefined, path: '/health', body: {} });
    const service = new EventService();
    await service.recordRequest(req, { statusCode: 200 } as any);

    expect(savedEvents[0].path).toBe('/health');
    expect(savedEvents[0].metadata.body).toBeUndefined();
  });
});
