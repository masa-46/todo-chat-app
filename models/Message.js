// models/Message.js

const mongoose = require('mongoose');

/**
 * messageSchema の説明
 * - userId: どのユーザーが送信したかを示す数値 (JWT の payload.sub と連携)
 * - text:   実際のメッセージ本文（文字列）
 * - createdAt: メッセージ送信時刻。省略すると自動で現在時刻が入る
 */
const messageSchema = new mongoose.Schema({
  userId:    Number,
  text:      String,
  createdAt: { type: Date, default: Date.now }
});

// モデルをエクスポート。App 内 どこからでも `require('./models/Message')` で使える
module.exports = mongoose.model('Message', messageSchema);
