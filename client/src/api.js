// client/src/api.js

// API のベース URL を環境変数から取得（なければローカル用をフォールバック）
export const BASE =
   process.env.NODE_ENV === 'production'
     ? process.env.REACT_APP_API_BASE
     : '';
let csrfToken = null;

/**
 * fetchCSRFToken()
 * - 本番環境でかつ環境変数 REACT_APP_API_BASE が設定されているときだけ
 *   一度だけ /csrf-token を叩いてキャッシュする
 */
async function fetchCSRFToken() {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.REACT_APP_API_BASE &&
    !csrfToken
  ) {
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
 * - path: `/todos` や `/auth/login` のようなルート
 * - opts: fetch のオプション (method, headers, body など)
 *
 * ・JWT を localStorage から取得して Authorization ヘッダーに追加  
 * ・Cookie 送信のために credentials: 'include'  
 * ・POST/PUT/DELETE のときは必要に応じて CSRF トークンを付与  
 */
export async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem('accessToken');

  // ミューテート系なら CSRF トークンを付与
  if (opts.method && /^(POST|PUT|DELETE)$/i.test(opts.method)) {
    const csrf = await fetchCSRFToken();
    if (csrf) {
      opts.headers = {
        ...opts.headers,
        'XSRF-TOKEN': csrf,
      };
    }
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
