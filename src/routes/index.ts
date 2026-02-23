import { Router } from 'express';
import { requireAuth, requireGlobalOwner } from '../middlewares/auth';
import { requireApiKey } from '../middlewares/apiKey';
import authRoutes from './auth/auth.routes';
import systemRoutes from './system/system.routes';
import teacherRoutes from './teachers/teachers.routes';
import studentRoutes from './students/students.routes';
import groupRoutes from './groups/groups.routes';
import usersRoutes from './users/users.routes';
import schoolsRoutes from './schools/schools.routes';
import eventsRoutes from './events/events.routes';
import apiKeysRoutes from './security/api-keys.routes';

const router = Router();

// --- Public Routes ---
router.use('/api', systemRoutes);
router.use('/api/auth', authRoutes);

// --- Business Layer (Protected by Auth & API Key) ---
const businessRouter = Router();

businessRouter.use(requireAuth);

businessRouter.use(requireApiKey);

businessRouter.use('/teachers', teacherRoutes);
businessRouter.use('/students', studentRoutes);
businessRouter.use('/groups', groupRoutes);
businessRouter.use('/users', requireGlobalOwner, usersRoutes);
businessRouter.use('/schools', requireGlobalOwner, schoolsRoutes);
businessRouter.use('/events', requireGlobalOwner, eventsRoutes);
businessRouter.use('/security/api-keys', requireGlobalOwner, apiKeysRoutes);

router.use('/api', businessRouter);

export default router;
