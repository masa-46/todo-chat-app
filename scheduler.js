// scheduler.js
// ─────────────────────────────────────────────────────────────────────────────
// 「毎分 ToDo の総数をカウントして TaskLog に記録する」cron ジョブの定義ファイルです。
// テスト実行時（NODE_ENV === 'test'）にはジョブ登録そのものをスキップします。

const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── テスト環境なら cron登録をせず、PrismaClient をエクスポートして終わる ──
if (process.env.NODE_ENV === 'test') {
  // テスト中は cron.schedule をまったく実行せず、このファイルの読み込みだけで終わる
  module.exports = prisma;
} else {
  // ── テスト以外（開発・本番）環境の場合のみ、以下の cron ジョブを登録 ──

  /**
   * 毎分実行：ToDo の総数をカウントして TaskLog に記録
   */
  cron.schedule(
    '* * * * *',
    async () => {
      const jobName = 'count-todos';
      try {
        // 全 ToDo の件数を取得
        const count = await prisma.todo.count();

        // 実行ログを保存
        await prisma.taskLog.create({
          data: {
            name: jobName,
            status: 'success',
            message: `Total todos: ${count}`,
            retryCount: 0,
          },
        });

        console.log(`✔️ [${jobName}] success: ${count} todos counted`);
      } catch (err) {
        // エラーログを保存
        await prisma.taskLog.create({
          data: {
            name: jobName,
            status: 'failure',
            message: err.message,
            retryCount: 0,
          },
        });
        console.warn(`⚠️ [${jobName}] failed: ${err.message}`);
      }
    },
    {
      timezone: 'Asia/Tokyo',
    }
  );

  // PrismaClient をエクスポートしておく（cron登録後も他所から prisma を使えるように）
  module.exports = prisma;
}
