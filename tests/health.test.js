const request = require('supertest');
const app = require('../index');   // index.js で export した app

describe('GET /health', () => {
  it('should respond 200 with {status:"OK"}', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: 'OK' });
  });
});
