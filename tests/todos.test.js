const request = require('supertest');
const app = require('../index');

describe('ToDo CRUD', () => {
  let id;           // 追加した ToDo の ID を保持

  it('POST /todos → 201', async () => {
    const res = await request(app)
      .post('/todos')
      .send({ text: '課題をやる' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.text).toBe('課題をやる');
    id = res.body.id;
  });

  it('GET /todos → 配列に 1 件入っている', async () => {
    const res = await request(app).get('/todos');
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].id).toBe(id);
  });

  it('PUT /todos/:id → text 更新', async () => {
    const res = await request(app)
      .put(`/todos/${id}`)
      .send({ text: '課題を終わらせる' });
    expect(res.statusCode).toBe(200);
    expect(res.body.text).toBe('課題を終わらせる');
  });

  it('DELETE /todos/:id → 204', async () => {
    const res = await request(app).delete(`/todos/${id}`);
    expect(res.statusCode).toBe(204);
  });

  it('GET /todos → 空配列に戻る', async () => {
    const res = await request(app).get('/todos');
    expect(res.body).toEqual([]);
  });
});
