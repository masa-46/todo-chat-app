// index.js ── Prisma + JWT 版バックエンド（テスト用ガード込み）

// テスト時は .env がなくてもよいように dotenv を使い、
// それ以外は dotenv-safe で .env と .env.example の一致を強制チェック
if (process.env.NODE_ENV === 'test') {
  require('dotenv').config();
} else {
  require('dotenv-safe').config();
}

const express   = require('express');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, param, validationResult } = require('express-validator');
const cookieParser = require('cookie-parser');
const csurf     = require('csurf');
const cors      = require('cors');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const http     = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const Message  = require('./models/Message');

const prisma = new PrismaClient();
const app    = express();

// ── セキュリティ強化ミドルウェア ─────────────────────────
app.use(helmet());

// レートリミット (ログインブルートフォース対策)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分
  max:      10,             // 最大 10 リクエスト
  message:  { error: 'ログイン試行回数が多すぎます。15 分後にお試しください。' }
});

// ③ 本番かつ FRONTEND_ORIGIN があるときだけ CORS と CSRF を有効化
const isProdSecure =
  process.env.NODE_ENV === 'production' &&
  typeof process.env.FRONTEND_ORIGIN === 'string';

if (isProdSecure) {
  // CORS：本番フロントからの credentialed リクエストを許可
  app.use(cors({
    origin: process.env.FRONTEND_ORIGIN,
    credentials: true,
    optionsSuccessStatus: 200
  }));

  // CSRF 保護
  app.use(cookieParser());
  app.use(csurf({
    cookie: {
      httpOnly: true,
      sameSite: 'none',
      secure: true
    }
  }));

  // トークン取得用エンドポイント
  app.get('/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
  });
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

// 静的ファイル配信
app.use(express.static('public'));

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
    body('password').isLength({ min: 4 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    try {
      const user = await prisma.user.create({ data: { email, password: hash } });
      console.log('[auth/register] User created:', user);
      res.status(201).json({ id: user.id, email: user.email });
    } catch (e) {
      console.error('[auth/register] Error:', e.message);
      res.status(409).json({ error: '既に登録済みの email です' });
    }
  }
);

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
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: '認証に失敗しました' });
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: '認証に失敗しました' });
    }
    const token = jwt.sign(
      { sub: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.json({ accessToken: token });
  }
);

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

// POST /todos  → 新しい ToDo を作成 (バリデーション付き)
app.post(
  '/todos',
  authRequired,
  [ body('text').trim().notEmpty().escape() ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
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

// PUT /todos/:id  → ToDo を更新 (パラメータ＆本文検証付き)
app.put(
  '/todos/:id',
  authRequired,
  [
    param('id').isInt().toInt(),
    body('text').trim().notEmpty().escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { text } = req.body;
      const result = await prisma.todo.updateMany({
        where: { id, userId: req.user.id },
        data: { text },
      });
      if (result.count === 0) {
        return res.status(404).json({ error: '操作対象がありません' });
      }
      const todo = await prisma.todo.findUnique({ where: { id } });
      res.json(todo);
    } catch (e) {
      console.error('[PUT /todos/:id] Error:', e);
      res.status(500).json({ error: 'ToDo 更新に失敗しました' });
    }
  }
);

// DELETE /todos/:id  → ToDo を削除 (パラメータ検証付き)
app.delete(
  '/todos/:id',
  authRequired,
  [ param('id').isInt().toInt() ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const result = await prisma.todo.deleteMany({
        where: { id, userId: req.user.id },
      });
      if (result.count === 0) {
        return res.status(404).json({ error: '操作対象がありません' });
      }
      res.status(204).send();
    } catch (e) {
      console.error('[DELETE /todos/:id] Error:', e);
      res.status(500).json({ error: 'ToDo 削除に失敗しました' });
    }
  }
);  // ← ここにセミコロン

// ── TaskLog 取得 (/tasks 旧・/jobs 新) ─────────────────────────
const fetchTaskLogs = async (_req, res) => {
  try {
    const logs = await prisma.taskLog.findMany({
      orderBy: { runAt: 'desc' },
      take: 50,
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({
      error: 'TaskLog 取得に失敗しました',
      detail: err.message,
    });
  }
};

app.get('/tasks', fetchTaskLogs);
app.get('/jobs',  fetchTaskLogs);
// ── 失敗ジョブのリトライ ────────────────────────────────────
app.post('/jobs/:id/retry', authRequired, async (req, res) => {
  const id = Number(req.params.id);
  try {
    // retryCount を +1
    const log = await prisma.taskLog.update({
      where: { id },
      data: { retryCount: { increment: 1 } },
    });
    // scheduler を呼び出して手動実行
    await require('./scheduler').runJobByName(log.name);
    res.json({ message: 'リトライを実行キューに追加しました', log });
  } catch (e) {
    console.error('[POST /jobs/:id/retry] Error:', e);
    res.status(500).json({ error: 'リトライに失敗しました' });
  }
});


// ── Socket.io ＋ サーバー起動部分 ─────────────────────────
if (require.main === module) {
  const server = http.createServer(app);
  const io     = new Server(server, { cors: { origin: '*' } });

   // ── ジョブ実行時にリアルタイム通知 ───────────────────────
   // scheduler.js でジョブを実行したときもここに届くように
   // runJobByName のあとに以下 emit を呼び出すよう index.js でラップする例
   const scheduler = require('./scheduler');
   // 元の runJobByName をラップ
   const originalRun = scheduler.runJobByName;
   scheduler.runJobByName = async (name) => {
     // 1) 本来のジョブ実行
     const result = await originalRun(name);
     // 2) 成功／失敗のログを取得
     const log = await prisma.taskLog.findFirst({
       where: { name },
       orderBy: { runAt: 'desc' },
     });
     // 3) クライアント全員に通知
     io.emit('jobUpdate', log);
     return result;
   };
   // ────────────────────────────────────────────────────

  io.on('connection', socket => {
    socket.on('getMessages', async () => {
      const msgs = await Message.find().sort({ createdAt: 1 });
      socket.emit('messages', msgs);
    });
    socket.on('sendMessage', async ({ userId, text }) => {
      if (!text?.trim()) return;
      const msg = await Message.create({ userId, text });
      io.emit('newMessage', msg);
    });
    socket.on('disconnect', () => {
      console.log(`🔴 socket disconnected: ${socket.id}`);
    });
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Server (with Socket.io) listening on port ${port}`);
  });
}

// テストコードからは app と prisma を使いたいのでエクスポート
module.exports = { app, prisma };
