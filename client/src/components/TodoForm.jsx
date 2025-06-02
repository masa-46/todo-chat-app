// client/src/components/TodoForm.jsx
import React, { useState } from 'react';

export default function TodoForm({ onAdd }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 flex">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="New todo"
        className="border p-2 flex-1 rounded-l"
      />
      <button type="submit" className="bg-blue-500 text-white px-4 rounded-r">
        追加
      </button>
    </form>
  );
}
