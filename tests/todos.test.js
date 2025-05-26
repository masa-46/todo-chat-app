const request = require('supertest');
const app = require('../index');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/* テスト前に必ずテーブルを空にする */
beforeEach(async () => {
  await prisma.todo.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();      // ハンドルを閉じて警告を消す
});

describe('ToDo CRUD 一連テスト', () => {
  it('POST → GET → PUT → DELETE がすべて成功する', async () => {
    /* ① 追加 */
    const post = await request(app)
      .post('/todos')
      .send({ text: '課題をやる' });
    expect(post.statusCode).toBe(201);
    const id = post.body.id;

    /* ② 取得 */
    const list1 = await request(app).get('/todos');
    expect(list1.statusCode).toBe(200);
    expect(list1.body.length).toBe(1);
    expect(list1.body[0].id).toBe(id);

    /* ③ 更新 */
    const put = await request(app)
      .put(`/todos/${id}`)
      .send({ text: '課題を終わらせる' });
    expect(put.statusCode).toBe(200);
    expect(put.body.text).toBe('課題を終わらせる');

    /* ④ 削除 */
    const del = await request(app).delete(`/todos/${id}`);
    expect(del.statusCode).toBe(204);

    /* ⑤ 空に戻ったことを確認 */
    const list2 = await request(app).get('/todos');
    expect(list2.body).toEqual([]);
  });
});
