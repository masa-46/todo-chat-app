// index.js
const express = require('express');
const app = express();

// Health-check エンドポイント
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// サーバー起動
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
