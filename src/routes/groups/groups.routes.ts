import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { throttle } from '../../middlewares/throttle';
import { groupService, createGroupBodySchema, updateGroupBodySchema } from '../../services/group.service';
import { GroupsController } from './groups.controller';
import { listGroupsQuerySchema } from '../../repositories/group.repository';
import { idParamSchema } from '../_shared/pagination.schemas';

const router = Router();
const controller = new GroupsController(groupService);

/**
 * @openapi
 * /api/groups:
 *   post:
 *     tags:
 *       - Groups
 *     summary: Create group
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: 'string' }
 *               schoolId: { type: 'string', format: 'uuid' }
 *               teacherMembershipId: { type: 'string', format: 'uuid' }
 *               studentIds: { type: 'array', items: { type: 'string', format: 'uuid' } }
 *     responses:
 *       201:
 *         description: Group created
 */
router.post(
  '/',
  throttle({ keyPrefix: 'create-group', useIP: true }),
  validate({ body: createGroupBodySchema }),
  asyncHandler(controller.create)
);

/**
 * @openapi
 * /api/groups:
 *   get:
 *     tags:
 *       - Groups
 *     summary: List groups
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: 'integer' }
 *       - in: query
 *         name: limit
 *         schema: { type: 'integer' }
 *       - in: query
 *         name: schoolId
 *         schema: { type: 'string', format: 'uuid' }
 *     responses:
 *       200:
 *         description: Groups list
 */
router.get('/', validate({ query: listGroupsQuerySchema }), asyncHandler(controller.list));

/**
 * @openapi
 * /api/groups/{id}:
 *   get:
 *     tags:
 *       - Groups
 *     summary: Get group by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string', format: 'uuid' }
 *     responses:
 *       200:
 *         description: Group found
 */
router.get('/:id', validate({ params: idParamSchema }), asyncHandler(controller.getById));

/**
 * @openapi
 * /api/groups/{id}:
 *   put:
 *     tags:
 *       - Groups
 *     summary: Update group
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string', format: 'uuid' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: 'string' }
 *               teacherMembershipId: { type: 'string', format: 'uuid' }
 *               studentIds: { type: 'array', items: { type: 'string', format: 'uuid' } }
 *     responses:
 *       200:
 *         description: Group updated
 */
router.put('/:id', validate({ params: idParamSchema, body: updateGroupBodySchema }), asyncHandler(controller.update));

/**
 * @openapi
 * /api/groups/{id}/activate:
 *   patch:
 *     tags:
 *       - Groups
 *     summary: Activate group
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string', format: 'uuid' }
 *     responses:
 *       200:
 *         description: Group activated
 */
router.patch('/:id/activate', validate({ params: idParamSchema }), asyncHandler(controller.activate));

/**
 * @openapi
 * /api/groups/{id}/deactivate:
 *   patch:
 *     tags:
 *       - Groups
 *     summary: Deactivate group
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string', format: 'uuid' }
 *     responses:
 *       200:
 *         description: Group deactivated
 */
router.patch('/:id/deactivate', validate({ params: idParamSchema }), asyncHandler(controller.deactivate));

/**
 * @openapi
 * /api/groups/{id}:
 *   delete:
 *     tags:
 *       - Groups
 *     summary: Delete group
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string', format: 'uuid' }
 *     responses:
 *       200:
 *         description: Group removed
 */
router.delete('/:id', validate({ params: idParamSchema }), asyncHandler(controller.remove));

export default router;
