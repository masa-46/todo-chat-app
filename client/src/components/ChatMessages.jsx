// client/src/components/ChatMessages.jsx
import React from 'react';

export default function ChatMessages({ messages }) {
  return (
    <ul>
      {messages.map((m) => (
        <li key={m._id} className="mb-2">
          <strong>{m.userId}:</strong> {m.text}
        </li>
      ))}
    </ul>
  );
}
