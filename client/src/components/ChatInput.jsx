// client/src/components/ChatInput.jsx
import React, { useState } from 'react';

export default function ChatInput({ onSend }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
        className="border p-2 flex-1 rounded-l"
      />
      <button type="submit" className="bg-green-500 text-white px-4 rounded-r">
        送信
      </button>
    </form>
  );
}
