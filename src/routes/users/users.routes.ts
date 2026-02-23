import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { throttle } from '../../middlewares/throttle';
import { userService } from '../../services/user.service';
import { UsersController } from './users.controller';
import {
  createUserBodySchema,
  listUsersQuerySchema,
  updateUserBodySchema,
  userParamsSchema,
} from './users.schemas';

const router = Router();
const controller = new UsersController(userService);

/**
 * @openapi
 * /api/users:
 *   post:
 *     tags:
 *       - Users
 *     summary: Create user with tenant memberships
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserStandardResponse'
 */
router.post(
  '/',
  throttle({ keyPrefix: 'create-user', useIP: true }),
  validate({ body: createUserBodySchema }),
  asyncHandler(controller.create)
);

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: List users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: globalRole
 *         schema:
 *           type: string
 *           enum: [owner, user]
 *       - in: query
 *         name: schoolId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [email, isActive, createdAt, updatedAt]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Users list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UsersListStandardResponse'
 */
router.get('/', validate({ query: listUsersQuerySchema }), asyncHandler(controller.list));

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user by id
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
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserStandardResponse'
 */
router.get('/:id', validate({ params: userParamsSchema }), asyncHandler(controller.getById));

/**
 * @openapi
 * /api/users/{id}:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update user and memberships
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: User updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserStandardResponse'
 */
router.put('/:id', validate({ params: userParamsSchema, body: updateUserBodySchema }), asyncHandler(controller.update));

/**
 * @openapi
 * /api/users/{id}/activate:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Activate user
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
 *         description: User activated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserStandardResponse'
 */
router.patch('/:id/activate', validate({ params: userParamsSchema }), asyncHandler(controller.activate));

/**
 * @openapi
 * /api/users/{id}/deactivate:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Deactivate user
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
 *         description: User deactivated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserStandardResponse'
 */
router.patch('/:id/deactivate', validate({ params: userParamsSchema }), asyncHandler(controller.deactivate));

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Delete user
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
 *         description: User removed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserDeleteStandardResponse'
 */
router.delete('/:id', validate({ params: userParamsSchema }), asyncHandler(controller.remove));

export default router;
