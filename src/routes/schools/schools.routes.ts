import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { throttle } from '../../middlewares/throttle';
import { schoolService } from '../../services/school.service';
import { SchoolsController } from './schools.controller';
import {
  createSchoolBodySchema,
  listSchoolsQuerySchema,
  schoolParamsSchema,
  updateSchoolBodySchema,
} from './schools.schemas';

const router = Router();
const controller = new SchoolsController(schoolService);

/**
 * @openapi
 * /api/schools:
 *   post:
 *     tags:
 *       - Schools
 *     summary: Create tenant school (optionally assign an admin user)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSchoolRequest'
 *     responses:
 *       201:
 *         description: School created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SchoolStandardResponse'
 */
router.post(
  '/',
  throttle({ keyPrefix: 'create-school', useIP: true }),
  validate({ body: createSchoolBodySchema }),
  asyncHandler(controller.create)
);

/**
 * @openapi
 * /api/schools:
 *   get:
 *     tags:
 *       - Schools
 *     summary: List schools
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
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt, updatedAt]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Schools list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SchoolsListStandardResponse'
 */
router.get('/', validate({ query: listSchoolsQuerySchema }), asyncHandler(controller.list));

/**
 * @openapi
 * /api/schools/{id}:
 *   get:
 *     tags:
 *       - Schools
 *     summary: Get school by id
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
 *         description: School found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SchoolStandardResponse'
 */
router.get('/:id', validate({ params: schoolParamsSchema }), asyncHandler(controller.getById));

/**
 * @openapi
 * /api/schools/{id}:
 *   put:
 *     tags:
 *       - Schools
 *     summary: Update school
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
 *             $ref: '#/components/schemas/UpdateSchoolRequest'
 *     responses:
 *       200:
 *         description: School updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SchoolStandardResponse'
 */
router.put('/:id', validate({ params: schoolParamsSchema, body: updateSchoolBodySchema }), asyncHandler(controller.update));

/**
 * @openapi
 * /api/schools/{id}/activate:
 *   patch:
 *     tags:
 *       - Schools
 *     summary: Activate school
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
 *         description: School activated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SchoolStandardResponse'
 */
router.patch('/:id/activate', validate({ params: schoolParamsSchema }), asyncHandler(controller.activate));

/**
 * @openapi
 * /api/schools/{id}/deactivate:
 *   patch:
 *     tags:
 *       - Schools
 *     summary: Deactivate school
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
 *         description: School deactivated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SchoolStandardResponse'
 */
router.patch('/:id/deactivate', validate({ params: schoolParamsSchema }), asyncHandler(controller.deactivate));

/**
 * @openapi
 * /api/schools/{id}:
 *   delete:
 *     tags:
 *       - Schools
 *     summary: Delete school
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
 *         description: School deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SchoolDeleteStandardResponse'
 */
router.delete('/:id', validate({ params: schoolParamsSchema }), asyncHandler(controller.remove));

export default router;
