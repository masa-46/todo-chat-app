# Todo-Chat-App

リアルタイムチャット＋ToDo管理＋ジョブログ監視（リトライ付）を備えた課題アプリ  
デモ:  
- **Frontend** : https://todo-chat-app-1.onrender.com  
- **Backend / API** : https://todo-chat-app.onrender.com

---

## 1. 機能

| 区分 | 概要 |
|------|------|
| 認証   | `/auth/register`・`/auth/login`（JWT + bcrypt） |
| ToDo  | `/todos` CRUD（ユーザー毎） |
| チャット | Socket.io + MongoDB（全員共通ルーム） |
| Cron  | 毎分 `count-todos` → `TaskLog` へ記録 |
| リトライ | `POST /jobs/:id/retry` で失敗ログを再実行 |
| モニター | `/monitor` 画面でジョブログ一覧＋Retry＋リアルタイム更新 |
| セキュリティ | Helmet / CORS (prod) / CSRF (prod) / rate-limit / express-validator |

---

## 2. ローカルセットアップ

```bash
git clone https://github.com/<YOUR_NAME>/todo-chat-app.git
cd todo-chat-app
cp .env.example .env             # 値を編集
docker compose up -d postgres mongo
npm run dev                      # backend = localhost:3000
cd client
npm install
npm start                        # CRA dev server = localhost:3001
