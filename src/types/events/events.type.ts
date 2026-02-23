import { z } from 'zod';

export type EventCategory = 'request' | 'audit';

export interface RequestClientContext {
  ip: string;
  userAgent: string;
  browser: string;
  os: string;
}

const jsonRecordSchema = z.record(z.string(), z.unknown());
const uuidSchema = z.string().uuid();

export const eventPayloadSchema = z.object({
  requestId: z.string().min(1).max(64).nullable().optional(),
  tenantId: z.string().min(1).max(120).nullable().optional(),
  actorUserId: z
    .string()
    .nullable()
    .optional()
    .transform((value) => {
      if (!value) {
        return null;
      }
      const parsed = uuidSchema.safeParse(value);
      return parsed.success ? parsed.data : null;
    }),
  category: z.enum(['request', 'audit']),
  action: z.string().min(3).max(120),
  method: z.string().min(1).max(10).nullable().optional(),
  path: z.string().min(1).max(255).nullable().optional(),
  statusCode: z.number().int().min(100).max(599).nullable().optional(),
  resourceType: z.string().min(1).max(80).nullable().optional(),
  resourceId: z.string().min(1).max(120).nullable().optional(),
  client: z
    .object({
      ip: z.string().min(1).max(64).optional(),
      userAgent: z.string().min(1).max(255).optional(),
      browser: z.string().min(1).max(120).optional(),
      os: z.string().min(1).max(120).optional(),
    })
    .nullable()
    .optional(),
  before: jsonRecordSchema.nullable().optional(),
  after: jsonRecordSchema.nullable().optional(),
  changes: jsonRecordSchema.nullable().optional(),
  metadata: jsonRecordSchema.nullable().optional(),
});

export const auditEventInputSchema = z.object({
  action: z.string().min(3).max(120),
  statusCode: z.number().int().min(100).max(599),
  resourceType: z.string().min(2).max(80).optional(),
  resourceId: z.string().min(1).max(120).optional(),
  before: jsonRecordSchema.nullable().optional(),
  after: jsonRecordSchema.nullable().optional(),
  metadata: jsonRecordSchema.nullable().optional(),
});

export type AuditEventInput = z.infer<typeof auditEventInputSchema>;
export type EventPayloadInput = z.infer<typeof eventPayloadSchema>;

export interface EventPayload extends EventPayloadInput {}
