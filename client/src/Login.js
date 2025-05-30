// client/src/Login.js
import React, { useState } from 'react';

export function Login({ onLogin }) {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || `HTTP ${res.status}`);
      }
      const { accessToken } = await res.json();
      // ← ここでトークンをブラウザに保存
      localStorage.setItem('token', accessToken);
      onLogin();  // App.js に「ログイン完了」を通知
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>ログイン</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input
        type="email"
        placeholder="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      <button type="submit">ログイン</button>
    </form>
  );
}

