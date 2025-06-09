// index.js ── Prisma + JWT 版バックエンド（テスト用ガード込み）
// テスト時は .env がなくてもよいように dotenv を使い、
// それ以外は dotenv-safe で .env と .env.example の一致を強制チェック
if (process.env.NODE_ENV === 'test') {
  require('dotenv').config();
} else {
  require('dotenv-safe').config();
}
const express = require('express');
const helmet  = require('helmet');
const rateLimit       = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const cookieParser    = require('cookie-parser');
const csurf           = require('csurf');
const cors = require('cors');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const http     = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const Message  = require('./models/Message');  // Mongoose のモデル

const prisma = new PrismaClient();
const app = express();
//  XSS など各種脅威から守る HTTP ヘッダーを追加
app.use(helmet());
// レートリミット (ログインブルートフォース対策)
 const loginLimiter = rateLimit({
   windowMs: 15 * 60 * 1000, // 15分間
   max:      10,             // 最大10リクエスト
   message:  { error: 'ログイン試行回数が多すぎます。15分後にお試しください。' }
 });

 // ③ CSRF 保護
 app.use(cookieParser());
 app.use(csurf({
   cookie: {
     httpOnly: true,
     sameSite: 'strict',
     secure: process.env.NODE_ENV === 'production'
   }
 }));
 // トークン取得用エンドポイント
 app.get('/csrf-token', (req, res) => {
   res.json({ csrfToken: req.csrfToken() });
 });
 // ────────────────────────────────────────────────────────
// CORS 設定（テスト環境ではスキップ）
if (process.env.NODE_ENV !== 'test') {
  app.use(cors({
    origin: process.env.FRONTEND_ORIGIN,
    credentials: true,
    optionsSuccessStatus: 200
  }));
}

 // JSON ボディを扱えるように設定
 app.use(express.json());
// ── テスト環境では scheduler や MongoDB 接続をスキップ ─────────────────
if (process.env.NODE_ENV === 'test') {
  console.log('ℹ️ Skipping MongoDB connect because NODE_ENV=test');
} else {
  // 開発・本番 (test 以外) では必ず scheduler を読み込んで cron を動かす
  require('./scheduler');

  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB connection error:', err));
}

// JSON ボディを扱えるように設定
app.use(express.json());
app.use(express.static('public'));  // public 以下を静的配信

// ── JWT 検証ミドルウェア ───────────────────────────────────
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

// ── Auth: ユーザー登録 ───────────────────────────────────
app.post(
   '/auth/register',
   loginLimiter,
   [
     body('email').isEmail().normalizeEmail(),
     body('password').isLength({ min: 8 })
   ],
   async (req, res) => {
     const errors = validationResult(req);
     if (!errors.isEmpty()) {
       return res.status(400).json({ errors: errors.array() });
     }
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email と password は必須' });
  }
  const hash = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({ data: { email, password: hash } });
    console.log('[auth/register] User created:', user);
    res.status(201).json({ id: user.id, email: user.email });
  } catch (e) {
    console.error('[auth/register] Error:', e.message);
    res.status(409).json({ error: '既に登録済みの email です' });
  }
});

// ── Auth: ログイン ───────────────────────────────────────
app.post(
   '/auth/login',
   loginLimiter,
   [
     body('email').isEmail().normalizeEmail(),
     body('password').notEmpty()
   ],
   async (req, res) => {
     const errors = validationResult(req);
     if (!errors.isEmpty()) {
       return res.status(400).json({ errors: errors.array() });
     }
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email と password は必須' });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  console.log('[auth/login] Prisma.findUnique returned user:', user);
  if (!user) {
    return res.status(401).json({ error: '認証に失敗しました' });
  }
  console.log('[auth/login] Comparing passwords. Plain:', password, 'Hash:', user.password);
  const ok = await bcrypt.compare(password, user.password);
  console.log('[auth/login] bcrypt.compare result:', ok);
  if (!ok) {
    return res.status(401).json({ error: '認証に失敗しました' });
  }
  console.log('[auth/login] JWT_SECRET is:', process.env.JWT_SECRET);
  const token = jwt.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
  console.log('[auth/login] JWT token created');
  res.json({ accessToken: token });
});

// ── Health Check ─────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'OK' });
});

// ── ToDo CRUD ────────────────────────────────────────────

// GET /todos  → 自分のユーザーID に紐づく ToDo をすべて取得
app.get('/todos', authRequired, async (req, res) => {
  const todos = await prisma.todo.findMany({
    where: { userId: req.user.id },
    orderBy: { id: 'asc' },
  });
  res.json(todos);
});

/// POST /todos  → 新しい ToDo を作成 (バリデーション付き)
app.post(
  '/todos',
  authRequired,
  // 入力チェック＆サニタイズ
  [ body('text').trim().notEmpty().escape() ],
  async (req, res) => {
    // バリデーション結果を確認
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // 400 Bad Request + エラー配列
      return res.status(400).json({ errors: errors.array() });
    }

    // サニタイズ済みの text
    const text = req.body.text;

    try {
      const todo = await prisma.todo.create({
        data: { text, userId: req.user.id }
      });
      res.status(201).json(todo);
    } catch (e) {
      console.error('[POST /todos] Error:', e);
      res.status(500).json({ error: 'ToDo の作成に失敗しました' });
    }
  }
);


// PUT /todos/:id  → ToDo を更新
app.put('/todos/:id', authRequired, async (req, res) => {
  try {
    const result = await prisma.todo.updateMany({
      where: {
        id: Number(req.params.id),
        userId: req.user.id,
      },
      data: { text: (req.body.text || '').trim() },
    });
    if (result.count === 0) throw new Error();
    const todo = await prisma.todo.findUnique({ where: { id: Number(req.params.id) } });
    res.json(todo);
  } catch {
    res.status(404).json({ error: '操作対象がありません' });
  }
});

// DELETE /todos/:id  → ToDo を削除
app.delete('/todos/:id', authRequired, async (req, res) => {
  try {
    const result = await prisma.todo.deleteMany({
      where: {
        id: Number(req.params.id),
        userId: req.user.id,
      }
    });
    if (result.count === 0) throw new Error();
    res.status(204).send();
  } catch {
    res.status(404).json({ error: '操作対象がありません' });
  }
});
// ── TaskLog 取得 (/tasks 旧・/jobs 新) ─────────────────────────
const fetchTaskLogs = async (_req, res) => {
  try {
    const logs = await prisma.taskLog.findMany({
      orderBy: { runAt: 'desc' },
      take: 50,                // 直近 50 件だけ
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({
      error: 'TaskLog 取得に失敗しました',
      detail: err.message,
    });
  }
};

// 既存互換（もし前から使っていれば壊さない）
app.get('/tasks', fetchTaskLogs);
// Day11 の新要件
app.get('/jobs',  fetchTaskLogs);
// ── Socket.io ＋ サーバー起動部分 ─────────────────────────
if (require.main === module) {
  const server = http.createServer(app);
  const io     = new Server(server, { cors: { origin: '*' } });

  io.on('connection', socket => {
    // 全員向けの過去メッセージ取得
    socket.on('getMessages', async () => {
      const msgs = await Message.find().sort({ createdAt: 1 });
      socket.emit('messages', msgs);
    });

    // 全員向けの新メッセージ配信
    socket.on('sendMessage', async ({ userId, text }) => {
      if (!text?.trim()) return;
      const msg = await Message.create({ userId, text });
      io.emit('newMessage', msg);
    });

    // 切断時ログ
    socket.on('disconnect', () => {
      console.log(`🔴 socket disconnected: ${socket.id}`);
    });
  });  // ← ここで connection のコールバックを閉じる

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Server (with Socket.io) listening on port ${port}`);
  });
}


// テストコードからは app と prisma を使いたいのでエクスポート
module.exports = { app, prisma };
