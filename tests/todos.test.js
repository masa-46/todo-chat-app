// tests/todos.test.js

const request = require('supertest');
const app = require('../index');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

let token;   // JWT を保持
let todoId;  // 作成した ToDo の ID

beforeAll(async () => {
  // DB をクリーン
  await prisma.user.deleteMany();
  await prisma.todo.deleteMany();
  // テストユーザー登録
  await request(app)
    .post('/auth/register')
    .send({ email: 'test@local', password: 'password' });
  // ログインして token 獲得
  const res = await request(app)
    .post('/auth/login')
    .send({ email: 'test@local', password: 'password' });
  token = res.body.accessToken;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('ToDo CRUD (with JWT)', () => {
  it('POST → GET → PUT → DELETE がすべて成功する', async () => {
    // ① 追加
    const post = await request(app)
      .post('/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: '課題をやる' });
    expect(post.statusCode).toBe(201);
    todoId = post.body.id;

    // ② 取得
    const list1 = await request(app)
      .get('/todos')
      .set('Authorization', `Bearer ${token}`);
    expect(list1.statusCode).toBe(200);
    expect(list1.body.length).toBe(1);
    expect(list1.body[0].id).toBe(todoId);

    // ③ 更新
    const put = await request(app)
      .put(`/todos/${todoId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ text: '課題を終わらせる' });
    expect(put.statusCode).toBe(200);
    expect(put.body.text).toBe('課題を終わらせる');

    // ④ 削除
    const del = await request(app)
      .delete(`/todos/${todoId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.statusCode).toBe(204);

    // ⑤ 空に戻ったことを確認
    const list2 = await request(app)
      .get('/todos')
      .set('Authorization', `Bearer ${token}`);
    expect(list2.body).toEqual([]);
  });
});
