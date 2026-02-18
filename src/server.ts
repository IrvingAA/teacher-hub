import app from './app';
import { env } from './config/env';
import { connectPostgres } from './config/database.pg';
import { connectMongo } from './config/database.mongo';
import { redis } from './config/redis';

async function bootstrap(): Promise<void> {
  try {
    await connectPostgres();
    await connectMongo();
    await redis.connect();

    app.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
