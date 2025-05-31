// tests/todos.test.js
const request = require('supertest');
const { app, prisma } = require('../index');  // ← 分割代入する
const jwt = require('jsonwebtoken');

const testEmail = 'test@example.com';
const testPassword = 'password123';

let accessToken;

describe('ToDo CRUD (with JWT)', () => {
  beforeAll(async () => {
    // DB をクリーン（必ず Todo → User の順序で delete）
    await prisma.todo.deleteMany();
    await prisma.user.deleteMany();

    // テストユーザー登録
    const registerRes = await request(app)
      .post('/auth/register')
      .send({ email: testEmail, password: testPassword });
    expect(registerRes.statusCode).toBe(201);

    // テストユーザーログインしてトークンを取得
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword });
    expect(loginRes.statusCode).toBe(200);
    accessToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    // テスト完了後に Prisma クライアントを切断
    await prisma.$disconnect();
  });

  it('POST → GET → PUT → DELETE がすべて成功する', async () => {
    // 1) POST /todos
    const postRes = await request(app)
      .post('/todos')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ text: 'first todo' });
    expect(postRes.statusCode).toBe(201);
    const createdTodo = postRes.body;
    expect(createdTodo.text).toBe('first todo');

    // 2) GET /todos
    const getRes = await request(app)
      .get('/todos')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(getRes.statusCode).toBe(200);
    expect(Array.isArray(getRes.body)).toBe(true);
    expect(getRes.body.length).toBe(1);

    // 3) PUT /todos/:id
    const putRes = await request(app)
      .put(`/todos/${createdTodo.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ text: 'updated todo' });
    expect(putRes.statusCode).toBe(200);
    expect(putRes.body.text).toBe('updated todo');

    // 4) DELETE /todos/:id
    const delRes = await request(app)
      .delete(`/todos/${createdTodo.id}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(delRes.statusCode).toBe(204);
  });
});
