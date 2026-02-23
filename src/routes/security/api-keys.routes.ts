import { Router } from 'express';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { validate } from '../../middlewares/validate';
import { throttle } from '../../middlewares/throttle';
import { apiKeyService } from '../../services/api-key.service';
import { ApiKeysController } from './api-keys.controller';
import { apiKeyParamsSchema, createApiKeyBodySchema } from './api-keys.schemas';

const router = Router();
const controller = new ApiKeysController(apiKeyService);

/**
 * @openapi
 * /api/security/api-keys:
 *   post:
 *     tags:
 *       - Security
 *     summary: Create API key
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateApiKeyRequest'
 *     responses:
 *       201:
 *         description: API key created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiKeyCreateStandardResponse'
 */
router.post(
  '/',
  throttle({ keyPrefix: 'create-api-key', useIP: true }),
  validate({ body: createApiKeyBodySchema }),
  asyncHandler(controller.create)
);

/**
 * @openapi
 * /api/security/api-keys:
 *   get:
 *     tags:
 *       - Security
 *     summary: List API keys
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: API key list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiKeyListStandardResponse'
 */
router.get('/', asyncHandler(controller.list));

/**
 * @openapi
 * /api/security/api-keys/{id}:
 *   delete:
 *     tags:
 *       - Security
 *     summary: Revoke API key
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: API key revoked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiKeyRevokeStandardResponse'
 */
router.delete('/:id', validate({ params: apiKeyParamsSchema }), asyncHandler(controller.revoke));

export default router;
