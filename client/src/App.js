// client/src/App.js
import React, { useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate
} from 'react-router-dom';
import Chat from './components/Chat';
import Monitor from './components/Monitor';
import Register from './components/Register';
import { apiFetch } from './api';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userId,   setUserId]   = useState(null);
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error(res.status);
      const body = await res.json();
      const payload = JSON.parse(atob(body.accessToken.split('.')[1]));
      setUserId(payload.sub);
      setLoggedIn(true);
    } catch {
      alert('ログインに失敗しました');
    }
  };

  return (
    <BrowserRouter>
      {!loggedIn ? (
        <Routes>
          {/* 新規登録 */}
          <Route path="/register" element={<Register />} />

          {/* ログイン */}
          <Route
            path="/"
            element={
              <div style={{ maxWidth: 400, margin: '100px auto' }}>
                <h2>ログイン</h2>
                <form onSubmit={handleLogin}>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="email"
                    required
                    style={{ width: '100%', padding: 8, marginBottom: 8 }}
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="password"
                    required
                    style={{ width: '100%', padding: 8, marginBottom: 8 }}
                  />
                  <button type="submit" style={{ padding: '8px 16px' }}>
                    ログイン
                  </button>
                </form>
                <p style={{ textAlign: 'center', marginTop: 12 }}>
                  はじめての方は <Link to="/register">登録</Link>
                </p>
              </div>
            }
          />

          {/* それ以外はログイン画面へリダイレクト */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        <>
          <nav style={{ textAlign: 'center', margin: '1rem 0' }}>
            <Link to="/chat"    style={{ marginRight: '1rem' }}>チャット</Link>
            <Link to="/monitor">ジョブログ</Link>
          </nav>
          <Routes>
            <Route path="/chat"    element={<Chat    userId={userId} />} />
            <Route path="/monitor" element={<Monitor />} />
            <Route path="*"        element={<Navigate to="/chat" replace />} />
          </Routes>
        </>
      )}
    </BrowserRouter>
  );
}
