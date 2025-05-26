// index.js  ─ Prisma 版バックエンド
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const app = express();
app.use(express.json());

// Health
app.get('/health', (_req, res) => res.json({ status: 'OK' }));

// GET /todos
app.get('/todos', async (_req, res) => {
  const todos = await prisma.todo.findMany({ orderBy: { id: 'asc' } });
  res.json(todos);
});

// POST /todos
app.post('/todos', async (req, res) => {
  const text = req.body.text?.trim();
  if (!text) return res.status(400).json({ error: 'text は必須' });
  const todo = await prisma.todo.create({ data: { text } });
  res.status(201).json(todo);
});

// PUT /todos/:id
app.put('/todos/:id', async (req, res) => {
  try {
    const todo = await prisma.todo.update({
      where: { id: Number(req.params.id) },
      data: { text: req.body.text?.trim() },
    });
    res.json(todo);
  } catch {
    res.status(404).json({ error: '該当 ToDo なし' });
  }
});

// DELETE /todos/:id
app.delete('/todos/:id', async (req, res) => {
  try {
    await prisma.todo.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: '該当 ToDo なし' });
  }
});

// サーバー起動
// テスト実行時には listen させない
if (require.main === module) {
 const port = process.env.PORT || 3000;
 app.listen(port, () => console.log(`Server http://localhost:${port}`));
}
module.exports = app;