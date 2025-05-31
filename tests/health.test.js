// tests/health.test.js
const request = require('supertest');
// 必ず { app } のみを取り出す
const { app } = require('../index');

describe('GET /health', () => {
  it('should respond 200 with {status:"OK"}', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: 'OK' });
  });
});
