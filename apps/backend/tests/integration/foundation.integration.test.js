import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

let passwordHash;

const mockUserRepository = {
  findByUsernameOrEmail: jest.fn(),
  findByIdWithAccess: jest.fn(),
  updateLastLogin: jest.fn(),
  updatePasswordHash: jest.fn(),
};

const mockHealthRepository = {
  databaseStatus: jest.fn(),
};

const mockAiClient = {
  getHealth: jest.fn(),
};

jest.unstable_mockModule('../../src/modules/users/user.repository.js', () => ({
  userRepository: mockUserRepository,
}));

jest.unstable_mockModule('../../src/modules/health/health.repository.js', () => ({
  healthRepository: mockHealthRepository,
}));

jest.unstable_mockModule('../../src/modules/ai/ai.client.js', () => ({
  aiClient: mockAiClient,
}));

const { default: app } = await import('../../src/app.js');

const activeAdmin = () => ({
  id: 1,
  username: 'admin',
  email: 'admin@example.com',
  fullName: 'Development Admin',
  passwordHash,
  isLocked: false,
  roles: ['ADMIN'],
  permissions: ['USER_CREATE', 'AI_VIEW'],
});

describe('foundation API', () => {
  beforeAll(async () => {
    passwordHash = await bcrypt.hash('Admin@123456', 10);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockHealthRepository.databaseStatus.mockResolvedValue('ok');
    mockAiClient.getHealth.mockResolvedValue({
      success: true,
      data: { service: 'ai-service', status: 'ok' },
      message: 'AI Service dang hoat dong',
    });
  });

  it('returns backend health endpoint', async () => {
    const response = await request(app).get('/api/v1/health').expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.database).toBe('ok');
  });

  it('logs in with valid credentials', async () => {
    mockUserRepository.findByUsernameOrEmail.mockResolvedValue(activeAdmin());

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'admin', password: 'Admin@123456' })
      .expect(200);

    expect(response.body.data.accessToken).toBeTruthy();
    expect(response.body.data.user.passwordHash).toBeUndefined();
  });

  it('rejects wrong password', async () => {
    mockUserRepository.findByUsernameOrEmail.mockResolvedValue(activeAdmin());

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'admin', password: 'wrong-password' })
      .expect(401);

    expect(response.body.errorCode).toBe('INVALID_CREDENTIALS');
  });

  it('rejects locked account', async () => {
    mockUserRepository.findByUsernameOrEmail.mockResolvedValue({
      ...activeAdmin(),
      isLocked: true,
    });

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'admin', password: 'Admin@123456' })
      .expect(403);

    expect(response.body.errorCode).toBe('USER_LOCKED');
  });

  it('rejects request without JWT', async () => {
    const response = await request(app).get('/api/v1/auth/me').expect(401);

    expect(response.body.errorCode).toBe('UNAUTHORIZED');
  });

  it('rejects invalid JWT', async () => {
    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);

    expect(response.body.errorCode).toBe('INVALID_TOKEN');
  });

  it('rejects user without required permission', async () => {
    const token = jwt.sign({ userId: 2, username: 'hr' }, 'change_me_in_real_environment');
    mockUserRepository.findByIdWithAccess.mockResolvedValue({
      ...activeAdmin(),
      username: 'hr',
      permissions: [],
    });

    const response = await request(app)
      .get('/api/v1/auth/permission-check')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(response.body.errorCode).toBe('FORBIDDEN');
  });

  it('returns AI health through backend proxy', async () => {
    const response = await request(app).get('/api/v1/ai/health').expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.data.status).toBe('ok');
  });

  it('handles unavailable AI Service', async () => {
    const error = new Error('AI unavailable');
    error.statusCode = 503;
    error.errorCode = 'AI_SERVICE_UNAVAILABLE';
    error.details = [];
    mockAiClient.getHealth.mockRejectedValue(error);

    const response = await request(app).get('/api/v1/ai/health').expect(503);

    expect(response.body.errorCode).toBe('AI_SERVICE_UNAVAILABLE');
  });
});
