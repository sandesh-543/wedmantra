const request = require('supertest');
const app = require('../src/index');

describe('Orders Endpoints', () => {
  it('should not allow creating an order without auth', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({});
    expect(res.statusCode).toBe(401);
  });
}); 