// client/src/App.js
import React, { useState } from 'react';
import Chat from './components/Chat';

// 必要であれば react-router-dom などでルーティングしてもよいのですが、最小構成として
// ログインフォーム→成功したらチャットに切り替える、という遷移を実装します。

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [userId, setUserId] = useState(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 簡易ログイン処理（/auth/login へリクエストを投げる）
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        alert('ログイン失敗: ' + res.status);
        return;
      }
      const body = await res.json();
      // JWT をデコードして userId を取り出す簡易版（payload.sub として返ってくる想定）
      const payload = JSON.parse(atob(body.accessToken.split('.')[1]));
      setUserId(payload.sub);
      setLoggedIn(true);
    } catch (err) {
      console.error(err);
      alert('エラーが発生しました');
    }
  };

  if (!loggedIn) {
    // ログイン前の画面
    return (
      <div style={{ maxWidth: '400px', margin: '100px auto' }}>
        <h2>ログイン</h2>
        <form onSubmit={handleLogin}>
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email"
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <div style={{ marginTop: '8px' }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <button type="submit" style={{ marginTop: '12px', padding: '8px 16px' }}>
            ログイン
          </button>
        </form>
      </div>
    );
  }

  // ログイン後にチャット画面を表示
  return <Chat userId={userId} />;
}
