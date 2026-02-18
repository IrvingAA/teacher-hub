// Set environment variables before any imports
process.env.PORT = '3000';
process.env.NODE_ENV = 'test';
process.env.PG_HOST = 'localhost';
process.env.PG_PORT = '5432';
process.env.PG_USER = 'admin';
process.env.PG_PASSWORD = 'secret';
process.env.PG_DATABASE = 'assessment_db';
process.env.MONGO_URI = 'mongodb://localhost:27017/assessment_db';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';

// Use manual mocks from __mocks__ directories
jest.mock('../src/config/env');
jest.mock('../src/config/database.pg');
jest.mock('../src/config/database.mongo');
jest.mock('../src/config/redis');

// Mock mongoose
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue(undefined),
  connection: {
    readyState: 1,
  },
}));

import request from 'supertest';
import app from '../src/app';

describe('GET /health', () => {
  beforeAll(() => {
    // Setup before tests
  });

  afterAll(() => {
    // Cleanup after tests
  });

  it('should return 200 with status ok', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('should return timestamp field', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.timestamp).toBeDefined();
    expect(typeof response.body.timestamp).toBe('string');
    // Verify it's a valid ISO date string
    expect(() => new Date(response.body.timestamp)).not.toThrow();
  });

  it('should return services field', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.services).toBeDefined();
    expect(response.body.services).toHaveProperty('postgres');
    expect(response.body.services).toHaveProperty('mongo');
    expect(response.body.services).toHaveProperty('redis');
  });
});
