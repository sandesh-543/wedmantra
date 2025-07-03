const request = require('supertest');
const app = require('../src/index');

describe('Health Check', () => {
  it('should return status OK', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'OK');
  });
}); 