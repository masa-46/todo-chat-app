import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../api';

export default function Register() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState(null);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || res.status);
      }
      // 登録成功したらログインページへリダイレクト
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '100px auto' }}>
      <h2>新規登録</h2>
      <form onSubmit={handleRegister}>
        <div>
          <input
            type="email"
            value={email}
            placeholder="email"
            required
            onChange={e => setEmail(e.target.value)}
            style={{ width:'100%', padding:8, marginBottom:8 }}
          />
        </div>
        <div>
          <input
            type="password"
            value={password}
            placeholder="password"
            required
            onChange={e => setPassword(e.target.value)}
            style={{ width:'100%', padding:8, marginBottom:8 }}
          />
        </div>
        {error && (
          <p style={{ color:'red', marginBottom:8 }}>{error}</p>
        )}
        <button type="submit" style={{ padding:'8px 16px' }}>
          登録
        </button>
      </form>
      <p style={{ marginTop:12, textAlign:'center' }}>
        すでにアカウントをお持ちの方は{' '}
        <Link to="/">ログイン</Link>
      </p>
    </div>
  );
}
