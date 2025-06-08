// client/src/api.js

// API のベース URL を環境変数から取得（なければローカル用をフォールバック）
export const BASE =
  process.env.REACT_APP_API_BASE || 'http://localhost:3000';

/**
 * apiFetch(path, opts)
 * - path: `/todos` や `/auth/login` のようなルート
 * - opts: fetch のオプション (method, headers, body など)
 *
 * ログイン時に localStorage に保存した JWT を自動で Authorization ヘッダーに追加し、
 * クロスサイト Cookie（credentials）を含めてリクエストを送信します。
 */
export const apiFetch = (path, opts = {}) => {
  const token = localStorage.getItem('accessToken');

  const fetchOptions = {
    ...opts,
    credentials: 'include', // Cookie が必要な場合に含める
    headers: {
      'Content-Type': 'application/json',
      // トークンがあるときだけ Authorization ヘッダーを付与
      ...(token && { Authorization: `Bearer ${token}` }),
      // opts.headers があればマージ
      ...opts.headers,
    },
  };

  return fetch(`${BASE}${path}`, fetchOptions);
};
