// client/src/components/TodoItem.jsx
import React, { useState } from 'react';

export default function TodoItem({ todo, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(todo.text);

  const saveEdit = () => {
    const trimmed = text.trim();
    if (trimmed && trimmed !== todo.text) {
      onUpdate(todo.id, trimmed);
    }
    setIsEditing(false);
  };

  return (
    <li className="mb-2 flex items-center">
      {isEditing ? (
        <>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="border p-1 flex-1 rounded"
          />
          <button
            onClick={saveEdit}
            className="ml-2 text-green-600"
          >
            保存
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setText(todo.text);
            }}
            className="ml-2 text-gray-500"
          >
            キャンセル
          </button>
        </>
      ) : (
        <>
          <span className="flex-1">{todo.text}</span>
          <button
            onClick={() => setIsEditing(true)}
            className="ml-2 text-blue-600"
          >
            編集
          </button>
          <button
            onClick={() => onDelete(todo.id)}
            className="ml-2 text-red-600"
          >
            削除
          </button>
        </>
      )}
    </li>
  );
}
