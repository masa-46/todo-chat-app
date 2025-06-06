// client/src/App.js
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Chat from './components/Chat';
import Monitor from './components/Monitor';
import { BASE } from './api';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 簡易ログイン処理（/auth/login へリクエストを投げる）
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        alert('ログイン失敗: ' + res.status);
        return;
      }
      const body = await res.json();
      // JWT をデコードして userId を取り出す（payload.sub として返ってくる想定）
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

  // ログイン後のルーティング画面
  return (
    <BrowserRouter>
      <nav style={{ margin: '1rem auto', textAlign: 'center' }}>
        <Link to="/chat" style={{ marginRight: '1rem' }}>チャット</Link>
        <Link to="/monitor">ジョブログ</Link>
      </nav>
      <Routes>
        <Route path="/chat" element={<Chat userId={userId} />} />
        <Route path="/monitor" element={<Monitor />} />
        <Route path="*" element={<Chat userId={userId} />} />
      </Routes>
    </BrowserRouter>
  );
}
