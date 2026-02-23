import type { Request } from 'express';
import { eventService } from '../../services/event.service';

export interface ResourceAuditInput {
  action: string;
  statusCode: number;
  resourceType: string;
  resourceId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

export interface CrudAuditInput {
  resourceType: string;
  resourceId: string;
  operation: 'created' | 'updated' | 'deleted' | 'status.updated';
  statusCode: number;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

export async function recordResourceAudit(req: Request, input: ResourceAuditInput): Promise<void> {
  await eventService.recordAudit(req, {
    action: input.action,
    statusCode: input.statusCode,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    before: input.before,
    after: input.after,
    metadata: input.metadata,
  });
}

export async function recordCrudAudit(req: Request, input: CrudAuditInput): Promise<void> {
  await recordResourceAudit(req, {
    action: `${input.resourceType}.${input.operation}`,
    statusCode: input.statusCode,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    before: input.before,
    after: input.after,
    metadata: input.metadata,
  });
}

export function toAuditSnapshot<T>(value: T): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}
