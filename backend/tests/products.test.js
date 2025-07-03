const request = require('supertest');
const app = require('../src/index');

describe('Products Endpoints', () => {
  it('should fetch products (public)', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
}); 