// index.js
const express = require('express');
const app = express();

// JSON ボディをパースするミドルウェア
app.use(express.json());

// In-memory ストア
let todos = [];
let nextId = 1;

// Health-check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// ① GET /todos — 全件取得
app.get('/todos', (req, res) => {
  res.json(todos);
});

// ② POST /todos — 追加
app.post('/todos', (req, res) => {
  const { text } = req.body;
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'text は必須の文字列です' });
  }
  const todo = { id: nextId++, text: text.trim() };
  todos.push(todo);
  res.status(201).json(todo);
});

// ③ PUT /todos/:id — 更新
app.put('/todos/:id', (req, res) => {
  const id = Number(req.params.id);
  const { text } = req.body;
  const idx = todos.findIndex(t => t.id === id);
  if (idx < 0) {
    return res.status(404).json({ error: '該当 ToDo がありません' });
  }
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'text は必須の文字列です' });
  }
  todos[idx].text = text.trim();
  res.json(todos[idx]);
});

// ④ DELETE /todos/:id — 削除
app.delete('/todos/:id', (req, res) => {
  const id = Number(req.params.id);
  const before = todos.length;
  todos = todos.filter(t => t.id !== id);
  if (todos.length === before) {
    return res.status(404).json({ error: '該当 ToDo がありません' });
  }
  res.status(204).send();
});

// サーバー起動
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
module.exports = app;