const request = require('supertest');
const { app, prisma } = require('../index');

describe('GET /jobs', () => {
  beforeAll(async () => {
    // テスト用ダミー 2 件
    await prisma.taskLog.createMany({
      data: [
        { name: 'dummy',  status: 'success', message: 'ok', retryCount: 0 },
        { name: 'dummy2', status: 'failure', message: 'ng', retryCount: 1 },
      ],
    });
  });

  afterAll(async () => {
    await prisma.taskLog.deleteMany();
    await prisma.$disconnect();
  });

  it('returns a JSON array of job logs', async () => {
    const res = await request(app).get('/jobs');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('name');
    expect(res.body[0]).toHaveProperty('status');
  });
});
