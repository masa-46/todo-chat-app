export const BASE =
  process.env.REACT_APP_API_BASE || 'http://localhost:3000';

export const apiFetch = (path, opts = {}) => {
  const token = localStorage.getItem('accessToken');
  return fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: {
      // JSON を送るヘッダー
      'Content-Type': 'application/json',
      // トークンがあれば追加
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // 既存の headers は上書きしない
      ...opts.headers,
    },
    // method, body など他のオプション
    ...opts,
  });
};
