import { env } from './env';

const pkg = require('../../package.json') as { name?: string; version?: string };
const packageName = pkg.name?.replace(/[-_.]+/g, ' ').trim();
const fallbackName =
  packageName && packageName.toLowerCase() !== 'backend assessment' ? packageName : 'TeacherHub API';

export const apiName = env.APP_NAME?.trim() || fallbackName;
export const apiVersion = pkg.version ?? '0.0.0';
