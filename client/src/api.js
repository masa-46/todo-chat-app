// client/src/api.js

// API のベース URL を環境変数から取得（なければローカル用をフォールバック）
export const BASE =
  process.env.REACT_APP_API_BASE || 'http://localhost:3001';

let csrfToken = null;

/**
 * fetchCSRFToken()
 * ─────────────────────────────────────────────────────────────────
 * CSRF トークンをバックエンドから一度だけ取得してキャッシュします。
 */
async function fetchCSRFToken() {
  if (!csrfToken) {
    const res = await fetch(`${BASE}/csrf-token`, {
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(`CSRF token fetch failed: ${res.status}`);
    }
    const data = await res.json();
    csrfToken = data.csrfToken;
  }
  return csrfToken;
}

/**
 * apiFetch(path, opts)
 * ─────────────────────────────────────────────────────────────────
 * - path: `/todos` や `/auth/login` のようなルート
 * - opts: fetch のオプション (method, headers, body など)
 *
 * ・JWT を localStorage から取り出して Authorization ヘッダーに自動で追加  
 * ・Cookie 送信のために credentials: 'include'  
 * ・POST/PUT/DELETE のときは CSRF トークンを取得して XSRF-TOKEN ヘッダーに付与  
 */
export async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem('accessToken');

  // ミューテート系なら CSRF トークンを付与
  if (opts.method && /^(POST|PUT|DELETE)$/i.test(opts.method)) {
    const csrf = await fetchCSRFToken();
    opts.headers = {
      ...opts.headers,
      'XSRF-TOKEN': csrf,
    };
  }

  const fetchOptions = {
    ...opts,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...opts.headers,
    },
  };

  return fetch(`${BASE}${path}`, fetchOptions);
}
