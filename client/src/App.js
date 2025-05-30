// client/src/App.js
import React, { useEffect, useState } from 'react';
import './App.css';
import { Login } from './Login';

function App() {
  const [todos,   setTodos]   = useState([]);
  const [error,   setError]   = useState(null);
  const [isAuth,  setIsAuth]  = useState(false);
  const [newText, setNewText] = useState('');

  // ── ① ログイン完了時に onLogin() で呼ばれる
  const handleLogin = () => {
    setIsAuth(true);
  };

  // ── ② 認証済みなら ToDo を取ってくる
  useEffect(() => {
    if (!isAuth) return;

    const token = localStorage.getItem('token') || '';
    fetch('/todos', {
      headers: {
        // ← ここで Authorization ヘッダにトークンを載せる
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => setTodos(data))
      .catch(err => {
        console.error(err);
        setError(err.message);
      });
  }, [isAuth]);
  const handleAdd = () => {
    const token = localStorage.getItem('token') || '';
    fetch('/todos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text: newText.trim() }),
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(created => {
        setTodos(prev => [...prev, created]);
        setNewText('');  // 入力欄をクリア
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
      });
  };
  // App.js の中に追記
const handleDelete = id => {
  const token = localStorage.getItem('token') || '';
  fetch(`/todos/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then(res => {
      if (res.status !== 204) throw new Error(`HTTP ${res.status}`);
      // 削除成功 → ローカル state から除外
      setTodos(prev => prev.filter(t => t.id !== id));
    })
    .catch(err => {
      console.error(err);
      setError(err.message);
    });
};

const handleEdit = async id => {
  const newText = window.prompt('更新後のタスクを入力してください');
  if (!newText || !newText.trim()) return;

  const token = localStorage.getItem('token') || '';
  try {
    const res = await fetch(`/todos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text: newText.trim() }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const updated = await res.json();
    setTodos(prev =>
      prev.map(t => (t.id === id ? updated : t))
    );
  } catch (err) {
    console.error(err);
    setError(err.message);
  }
};

  // ── 認証前はログインフォーム、認証後は ToDo を表示
  if (!isAuth) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="App">
      <h1>ToDo リスト</h1>
      {error && <p style={{ color: 'red' }}>エラー: {error}</p>}
      {/* ② 入力フォーム */} 
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={newText}
          onChange={e => setNewText(e.target.value)}
          placeholder="新しいタスクを入力"
        />
        <button onClick={handleAdd} disabled={!newText.trim()}>
          追加
        </button>
      </div>
      
      <ul>
        {todos.length === 0
          ? <li>データがありません</li>
          : todos.map(todo => (
<li key={todo.id} style={{ marginBottom: '0.5rem' }}>
                {todo.text} (ID: {todo.id})
                {' '}
                <button onClick={() => handleEdit(todo.id)} style={{ marginLeft: 8 }}>
                  編集
                </button>
                <button onClick={() => handleDelete(todo.id)} style={{ marginLeft: 4 }}>
                  削除
                </button>
              </li>
            ))}
      </ul>
    </div>
  );
}

export default App;
