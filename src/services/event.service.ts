import type { Request, Response } from 'express';
import { AppDataSource } from '../config/database.pg';
import { Event } from '../models/event.entity';
import {
  auditEventInputSchema,
  eventPayloadSchema,
  type AuditEventInput,
  type EventPayload,
  type EventPayloadInput,
} from '../types/events/events.type';

const SENSITIVE_KEYS = ['password', 'token', 'secret', 'authorization'];

function canPersistEvents(): boolean {
  return AppDataSource.isInitialized && typeof AppDataSource.getRepository === 'function';
}

function redactSensitive(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => redactSensitive(entry));
  }

  if (value && typeof value === 'object') {
    const input = value as Record<string, unknown>;
    return Object.entries(input).reduce<Record<string, unknown>>((acc, [key, fieldValue]) => {
      const normalizedKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some((sensitive) => normalizedKey.includes(sensitive))) {
        acc[key] = '[REDACTED]';
        return acc;
      }
      acc[key] = redactSensitive(fieldValue);
      return acc;
    }, {});
  }

  return value;
}

function normalize(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return redactSensitive(value) as Record<string, unknown>;
}

function diffObjects(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null
): Record<string, unknown> | null {
  if (!before && !after) {
    return null;
  }

  const base = before ?? {};
  const next = after ?? {};
  const keys = new Set([...Object.keys(base), ...Object.keys(next)]);
  const changes: Record<string, unknown> = {};

  for (const key of keys) {
    const left = base[key];
    const right = next[key];
    if (JSON.stringify(left) !== JSON.stringify(right)) {
      changes[key] = { before: left ?? null, after: right ?? null };
    }
  }

  return Object.keys(changes).length > 0 ? changes : null;
}

export class EventService {
  private buildRequestScopedPayload(req: Request): Partial<EventPayload> {
    return {
      requestId: req.context?.requestId ?? null,
      tenantId: req.user?.tenantId ?? req.context?.tenantId ?? null,
      actorUserId: req.user?.id ?? req.context?.userId ?? null,
      method: req.method,
      path: req.originalUrl ?? req.path,
      client: req.context?.client ?? null,
    };
  }

  async record(payload: EventPayload): Promise<void> {
    const parsed = eventPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      console.warn('Invalid event payload:', parsed.error.flatten());
      return;
    }

    if (!canPersistEvents()) {
      return;
    }

    const repository = AppDataSource.getRepository(Event) as
      | { save?: (event: Event) => Promise<Event> }
      | undefined;
    if (!repository || typeof repository.save !== 'function') {
      return;
    }

    const validPayload = parsed.data as EventPayloadInput;
    const before = normalize(validPayload.before);
    const after = normalize(validPayload.after);
    const computedChanges = validPayload.changes ?? diffObjects(before, after);

    const entity = repository.save(
      Object.assign(new Event(), {
        requestId: validPayload.requestId ?? null,
        tenantId: validPayload.tenantId ?? null,
        actorUserId: validPayload.actorUserId ?? null,
        category: validPayload.category,
        action: validPayload.action,
        method: validPayload.method ?? null,
        path: validPayload.path ?? null,
        statusCode: validPayload.statusCode ?? null,
        resourceType: validPayload.resourceType ?? null,
        resourceId: validPayload.resourceId ?? null,
        ip: validPayload.client?.ip ?? null,
        userAgent: validPayload.client?.userAgent ?? null,
        browser: validPayload.client?.browser ?? null,
        os: validPayload.client?.os ?? null,
        before,
        after,
        changes: normalize(computedChanges),
        metadata: normalize(validPayload.metadata),
      })
    );

    await entity;
  }

  async recordRequest(req: Request, res: Response): Promise<void> {
    const metadata: Record<string, unknown> = {
      query: redactSensitive(req.query),
      params: redactSensitive(req.params),
    };

    if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
      metadata.body = redactSensitive(req.body);
    }

    await this.record({
      category: 'request',
      action: 'http.request.completed',
      ...this.buildRequestScopedPayload(req),
      actorUserId: req.user?.id ?? req.context?.userId ?? null,
      statusCode: res.statusCode,
      metadata,
    });
  }

  async recordAudit(req: Request, input: AuditEventInput): Promise<void> {
    const parsed = auditEventInputSchema.safeParse(input);
    if (!parsed.success) {
      console.warn('Invalid audit payload:', parsed.error.flatten());
      return;
    }

    await this.record({
      category: 'audit',
      ...this.buildRequestScopedPayload(req),
      actorUserId: req.user?.id ?? req.context?.userId ?? null,
      ...parsed.data,
    });
  }
}

export const eventService = new EventService();
