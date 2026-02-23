import { z } from 'zod';

export const apiKeySeedSchema = z.array(
  z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    publicKey: z.string().min(4),
    secretHash: z.string().min(1),
    salt: z.string().min(1),
    isActive: z.boolean().optional().default(true),
    createdByUserId: z.string().uuid().nullable().optional(),
    scopes: z.any().nullable().optional(),
    expiresAt: z.string().nullable().optional(),
    lastUsedAt: z.string().nullable().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
);

export const seedApiKeys = [
  {
    id: '40f31cdc-6667-4801-af82-ecf7d6b9ecc8',
    name: 'bootstrap',
    publicKey: 'b46213352108dedf',
    secretHash:
      '44b11e818be234584c3a12d03d3ce83f99a4773b2eb0b0ca7375fcb05504bda8dfa3471aec9fbdcdaac70a8fe575fab768815deead2c791165655c90756deaf6',
    salt: 'd45373a5bc1e33ac6c45bd149ef5f3df',
    isActive: true,
    createdByUserId: null,
    scopes: null,
    expiresAt: null,
    lastUsedAt: '2026-02-23T19:57:54.749Z',
    createdAt: '2026-02-23T19:51:14.715525Z',
    updatedAt: '2026-02-23T19:57:54.751753Z',
  },
];

export default seedApiKeys;
