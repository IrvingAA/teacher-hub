import { baseSchemas } from './base.schemas';
import { authSchemas } from './auth.schemas';
import { userSchemas } from './user.schemas';
import { schoolSchemas } from './school.schemas';
import { teacherSchemas } from './teacher.schemas';
import { eventSchemas } from './event.schemas';
import { apiKeySchemas } from './api-key.schemas';

export const allSchemas = {
  ...baseSchemas,
  ...authSchemas,
  ...userSchemas,
  ...schoolSchemas,
  ...teacherSchemas,
  ...eventSchemas,
  ...apiKeySchemas,
};
