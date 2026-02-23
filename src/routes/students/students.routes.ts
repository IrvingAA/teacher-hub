import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { throttle } from '../../middlewares/throttle';
import { StudentService, studentService } from '../../services/student.service';
import { StudentsController } from './students.controller';
import { createUserBodySchema, userParamsSchema } from '../users/users.schemas';
import { updateTeacherBodySchema, listTeachersQuerySchema } from '../teachers/teachers.schemas';

const router = Router();
const controller = new StudentsController(studentService);

/**
 * @openapi
 * /api/students:
 *   post:
 *     tags:
 *       - Students
 *     summary: Create student
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
 *         description: Student created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeacherStandardResponse'
 */
router.post(
  '/',
  throttle({ keyPrefix: 'create-student', useIP: true }),
  validate({ body: createUserBodySchema }),
  asyncHandler(controller.create)
);

/**
 * @openapi
 * /api/students:
 *   get:
 *     tags:
 *       - Students
 *     summary: List students
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
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Students list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeachersListStandardResponse'
 */
router.get('/', validate({ query: listTeachersQuerySchema }), asyncHandler(controller.list));

/**
 * @openapi
 * /api/students/{id}:
 *   get:
 *     tags:
 *       - Students
 *     summary: Get student by id
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
 *         description: Student found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeacherStandardResponse'
 */
router.get('/:id', validate({ params: userParamsSchema }), asyncHandler(controller.getById));

/**
 * @openapi
 * /api/students/{id}:
 *   put:
 *     tags:
 *       - Students
 *     summary: Update student profile
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
 *         description: Student updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeacherStandardResponse'
 */
router.put(
  '/:id',
  validate({ params: userParamsSchema, body: updateTeacherBodySchema }),
  asyncHandler(controller.update)
);

/**
 * @openapi
 * /api/students/{id}/activate:
 *   patch:
 *     tags:
 *       - Students
 *     summary: Activate student
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
 *         description: Student activated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeacherStandardResponse'
 */
router.patch('/:id/activate', validate({ params: userParamsSchema }), asyncHandler(controller.activate));

/**
 * @openapi
 * /api/students/{id}/deactivate:
 *   patch:
 *     tags:
 *       - Students
 *     summary: Deactivate student
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
 *         description: Student deactivated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeacherStandardResponse'
 */
router.patch('/:id/deactivate', validate({ params: userParamsSchema }), asyncHandler(controller.deactivate));

export default router;
