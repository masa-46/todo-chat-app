// scheduler.js
const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 毎分実行：ToDo の総数をカウントして TaskLog に記録
 */
cron.schedule('* * * * *', async () => {
  const jobName = 'count-todos';
  try {
    // 全 ToDo の数を取得
    const count = await prisma.todo.count();

    // 実行ログを保存
    await prisma.taskLog.create({
      data: {
        name: jobName,
        status: 'success',
        message: `Total todos: ${count}`,
        retryCount: 0
      }
    });

    console.log(`✔️ [${jobName}] success: ${count} todos counted`);
  } catch (err) {
    // エラーログを保存
    await prisma.taskLog.create({
      data: {
        name: jobName,
        status: 'failure',
        message: err.message,
        retryCount: 0
      }
    });

    console.warn(`⚠️ [${jobName}] failed: ${err.message}`);
  }
}, {
  timezone: 'Asia/Tokyo'
});
