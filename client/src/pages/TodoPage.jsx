// client/src/pages/TodoPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TodoForm from '../components/TodoForm';
import TodoList from '../components/TodoList';

export default function TodoPage() {
  const [todos, setTodos] = useState([]);
  const token = localStorage.getItem('accessToken');

  // Axios のデフォルトヘッダーにトークンをセット
  const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
    headers: { Authorization: `Bearer ${token}` },
  });

  useEffect(() => {
    if (token) {
      api.get('/todos')
        .then((res) => setTodos(res.data))
        .catch((err) => console.error(err));
    }
  }, [token]);

  const addTodo = (text) => {
    api.post('/todos', { text })
      .then((res) => setTodos((prev) => [...prev, res.data]))
      .catch((err) => console.error(err));
  };

  const updateTodo = (id, newText) => {
    api.put(`/todos/${id}`, { text: newText })
      .then((res) => {
        setTodos((prev) =>
          prev.map((t) => (t.id === res.data.id ? res.data : t))
        );
      })
      .catch((err) => console.error(err));
  };

  const deleteTodo = (id) => {
    api.delete(`/todos/${id}`)
      .then(() => {
        setTodos((prev) => prev.filter((t) => t.id !== id));
      })
      .catch((err) => console.error(err));
  };

  if (!token) {
    return <p>ログインしてください。</p>;
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">My ToDo List</h1>
      <TodoForm onAdd={addTodo} />
      <TodoList
        todos={todos}
        onUpdate={updateTodo}
        onDelete={deleteTodo}
      />
    </div>
  );
}
