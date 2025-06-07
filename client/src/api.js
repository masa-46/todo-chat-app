// client/src/api.js

// 本番環境では .env.production に書いた URL を、
// 開発環境では localhost を使います
export const BASE =
  process.env.REACT_APP_API_BASE || 'http://localhost:3000';

// API 呼び出しの共通関数
export const apiFetch = (path, opts = {}) =>
  fetch(`${BASE}${path}`, {
    credentials: 'include',  // Cookie やセッションを送る場合
    ...opts,
  });
