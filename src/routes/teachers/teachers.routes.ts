import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { throttle } from '../../middlewares/throttle';
import { teacherService } from '../../services/teacher.service';
import { TeachersController } from './teachers.controller';
import {
  createTeacherBodySchema,
  listTeachersQuerySchema,
  teacherParamsSchema,
  updateTeacherBodySchema,
} from './teachers.schemas';

const router = Router();
const controller = new TeachersController(teacherService);

/**
 * @openapi
 * /api/teachers:
 *   post:
 *     tags:
 *       - Teachers
 *     summary: Create teacher
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTeacherRequest'
 *     responses:
 *       201:
 *         description: Teacher created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeacherStandardResponse'
 */
router.post(
  '/',
  throttle({ keyPrefix: 'create-teacher', useIP: true }),
  validate({ body: createTeacherBodySchema }),
  asyncHandler(controller.create)
);

/**
 * @openapi
 * /api/teachers:
 *   get:
 *     tags:
 *       - Teachers
 *     summary: List teachers
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
 *         name: schoolId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, on_leave]
 *       - in: query
 *         name: specialization
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [firstName, lastName, hireDate, createdAt]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Teachers list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeachersListStandardResponse'
 */
router.get('/', validate({ query: listTeachersQuerySchema }), asyncHandler(controller.list));

/**
 * @openapi
 * /api/teachers/{id}:
 *   get:
 *     tags:
 *       - Teachers
 *     summary: Get teacher by id
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
 *         description: Teacher found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeacherStandardResponse'
 */
router.get('/:id', validate({ params: teacherParamsSchema }), asyncHandler(controller.getById));

/**
 * @openapi
 * /api/teachers/{id}:
 *   put:
 *     tags:
 *       - Teachers
 *     summary: Update teacher
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
 *             $ref: '#/components/schemas/UpdateTeacherRequest'
 *     responses:
 *       200:
 *         description: Teacher updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeacherStandardResponse'
 */
router.put(
  '/:id',
  validate({ params: teacherParamsSchema, body: updateTeacherBodySchema }),
  asyncHandler(controller.update)
);

/**
 * @openapi
 * /api/teachers/{id}/activate:
 *   patch:
 *     tags:
 *       - Teachers
 *     summary: Activate teacher
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
 *         description: Teacher activated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeacherStandardResponse'
 */
router.patch('/:id/activate', validate({ params: teacherParamsSchema }), asyncHandler(controller.activate));

/**
 * @openapi
 * /api/teachers/{id}/deactivate:
 *   patch:
 *     tags:
 *       - Teachers
 *     summary: Deactivate teacher
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
 *         description: Teacher deactivated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeacherStandardResponse'
 */
router.patch('/:id/deactivate', validate({ params: teacherParamsSchema }), asyncHandler(controller.deactivate));

/**
 * @openapi
 * /api/teachers/{id}:
 *   delete:
 *     tags:
 *       - Teachers
 *     summary: Soft delete teacher
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
 *         description: Teacher removed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeacherDeleteStandardResponse'
 */
router.delete('/:id', validate({ params: teacherParamsSchema }), asyncHandler(controller.remove));

export default router;
