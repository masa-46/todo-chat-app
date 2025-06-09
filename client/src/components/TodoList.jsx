// client/src/components/TodoList.jsx
import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';

export default function TodoList() {
  const [todos, setTodos]     = useState([]);
  const [text, setText]       = useState('');
  const [loading, setLoading] = useState(true);

  // 1) 初回に /todos から読み込み
  useEffect(() => {
    apiFetch('/todos')
      .then(r => r.json())
      .then(setTodos)
      .finally(() => setLoading(false));
  }, []);

  // 2) 新規作成
  const createTodo = async () => {
    if (!text.trim()) return;
    const res = await apiFetch('/todos', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      const todo = await res.json();
      setTodos([...todos, todo]);
      setText('');
    } else {
      alert('作成失敗');
    }
  };

  // 3) 更新（シンプルにテキストだけ変えるサンプル）
  const updateTodo = async (id) => {
    const newText = window.prompt('新しいテキストを入力してください');
    if (!newText) return;
    const res = await apiFetch(`/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ text: newText }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTodos(todos.map(t => t.id === id ? updated : t));
    } else {
      alert('更新失敗');
    }
  };

  // 4) 削除
  const deleteTodo = async (id) => {
    if (!window.confirm('本当に削除しますか？')) return;
    const res = await apiFetch(`/todos/${id}`, { method: 'DELETE' });
    if (res.status === 204) {
      setTodos(todos.filter(t => t.id !== id));
    } else {
      alert('削除失敗');
    }
  };

  if (loading) return <p>読み込み中…</p>;
  return (
    <div style={{ maxWidth: 600, margin: '2rem auto' }}>
      <h2>ToDo リスト</h2>
      <div style={{ display: 'flex', marginBottom: '1rem' }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="新しい ToDo を入力…"
          style={{ flex: 1, padding: '8px' }}
        />
        <button onClick={createTodo} style={{ marginLeft: '8px' }}>追加</button>
      </div>
      {todos.length === 0
        ? <p>ToDo がありません</p>
        : (
          <ul>
            {todos.map(t => (
              <li key={t.id} style={{ marginBottom: '0.5rem' }}>
                {t.text}
                <button onClick={() => updateTodo(t.id)} style={{ margin: '0 8px' }}>
                  編集
                </button>
                <button onClick={() => deleteTodo(t.id)}>
                  削除
                </button>
              </li>
            ))}
          </ul>
        )
      }
    </div>
  );
}
