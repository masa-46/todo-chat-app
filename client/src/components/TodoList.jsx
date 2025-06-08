import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';

export default function TodoList() {
  const [todos, setTodos] = useState([]);
  const [text, setText]   = useState('');

  // ロード時に API を叩いて一覧取得
  useEffect(() => {
    apiFetch('/todos')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setTodos)
      .catch(console.error);
  }, []);

  // ToDo 追加
  const addTodo = async () => {
    if (!text.trim()) return;
    try {
      const res = await apiFetch('/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const newTodo = await res.json();
      setTodos(prev => [...prev, newTodo]);
      setText('');
    } catch (err) {
      console.error(err);
      alert('追加に失敗しました');
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto' }}>
      <h2>My ToDo List</h2>
      <ul>
        {todos.map(todo => (
          <li key={todo.id} style={{ margin: '0.5rem 0' }}>
            {todo.text}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: '1rem' }}>
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="新しい ToDo"
          style={{ padding: '8px', width: '70%' }}
        />
        <button onClick={addTodo} style={{ padding: '8px 16px', marginLeft: '8px' }}>
          追加
        </button>
      </div>
    </div>
  );
}
