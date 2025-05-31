// index.js  ─ Prisma + JWT 版バックエンド
require('dotenv').config();
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const http     = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const Message  = require('./models/Message');  // Message モデル

const prisma = new PrismaClient();
const app = express();

require('./scheduler');
// MongoDB 接続（MONGODB_URI は .env に設定済みのはず）
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

app.use(express.json());
app.use(express.static('public'));


// ── JWT 検証ミドルウェア ─────────────────
function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'トークン未提供' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: 'トークン無効' });
  }
}

// ── Auth: ユーザー登録 ─────────────────
app.post('/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email と password は必須' });
  }
  const hash = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({ data: { email, password: hash } });
    res.status(201).json({ id: user.id, email: user.email });
  } catch {
    res.status(409).json({ error: '既に登録済みの email です' });
  }
});

// ── Auth: ログイン ─────────────────
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email と password は必須' });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: '認証に失敗しました' });
  }
  const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
  res.json({ accessToken: token });
});

// ── Health Check ─────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'OK' });
});

// ── ToDo CRUD ─────────────────
// GET /todos
app.get('/todos', authRequired, async (req, res) => {
  const todos = await prisma.todo.findMany({ where: { userId: req.user.id }, orderBy: { id: 'asc' } });
  res.json(todos);
});

app.get('/tasks', async (req, res) => {
  // 最新 50 件を降順に取得
  const logs = await prisma.taskLog.findMany({
    orderBy: { runAt: 'desc' },
    take: 50,
  });
  res.json(logs);
});

app.get('/tasks', async (req, res) => {
  try {
    const logs = await prisma.taskLog.findMany({
      orderBy: { runAt: 'desc' },
      take: 50,
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'TaskLog 取得に失敗しました', detail: err.message });
  }
});

// POST /todos
app.post('/todos', authRequired, async (req, res) => {
  const text = req.body.text?.trim();
  if (!text) {
    return res.status(400).json({ error: 'text は必須' });
  }
  const todo = await prisma.todo.create({ data: { text, userId: req.user.id } });
  res.status(201).json(todo);
});

// PUT /todos/:id
app.put('/todos/:id', authRequired, async (req, res) => {
  try {
    const result = await prisma.todo.updateMany({ where: { id: Number(req.params.id), userId: req.user.id }, data: { text: req.body.text?.trim() } });
    if (result.count === 0) throw new Error();
    const todo = await prisma.todo.findUnique({ where: { id: Number(req.params.id) } });
    res.json(todo);
  } catch {
    res.status(404).json({ error: '操作対象がありません' });
  }
});

// DELETE /todos/:id
app.delete('/todos/:id', authRequired, async (req, res) => {
  try {
    const result = await prisma.todo.deleteMany({ where: { id: Number(req.params.id), userId: req.user.id } });
    if (result.count === 0) throw new Error();
    res.status(204).send();
  } catch {
    res.status(404).json({ error: '操作対象がありません' });
  }
});

 // ── HTTP サーバー＋Socket.io セットアップ ──
 const server = http.createServer(app);
 const io = new Server(server, { cors: { origin: '*' } });

 // ── Socket.io のイベントハンドラ ──
 io.on('connection', socket => {
   console.log(`🟢 socket connected: ${socket.id}`);
   socket.on('getMessages', async () => {
     const msgs = await Message.find().sort({ createdAt: 1 });
     socket.emit('messages', msgs);
   });
  socket.on('sendMessage', async ({ userId, text }) => {
     console.log('🔥 Received sendMessage:', text);
    const msg = await Message.create({ userId, text });
     io.emit('newMessage', msg);
   });
   socket.on('disconnect', () => {
     console.log(`🔴 socket disconnected: ${socket.id}`);
   });
 });

 // ── サーバー起動 ──
 if (require.main === module) {
   const port = process.env.PORT || 3000;
   server.listen(port, () => {
     console.log(`Server (with Socket.io) listening on http://localhost:${port}`);
   });
 }

 module.exports = { app, server };
