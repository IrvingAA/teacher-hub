export const env = {
  PORT: 3000,
  NODE_ENV: 'test' as const,
  PG_HOST: 'localhost',
  PG_PORT: 5432,
  PG_USER: 'admin',
  PG_PASSWORD: 'secret',
  PG_DATABASE: 'assessment_db',
  MONGO_URI: 'mongodb://localhost:27017/assessment_db',
  REDIS_HOST: 'localhost',
  REDIS_PORT: 6379,
};

export type Env = typeof env;
