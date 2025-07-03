const request = require('supertest');
const app = require('../src/index');

describe('Auth Endpoints', () => {
  const testUser = {
    email: `testuser_${Date.now()}@example.com`,
    password: 'TestPass123!',
    first_name: 'Test',
    last_name: 'User'
  };
  let token;

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('email', testUser.email);
  });

  it('should login with the new user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });

  it('should get the user profile with token', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('email', testUser.email);
  });
}); 