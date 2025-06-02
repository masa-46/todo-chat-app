// client/src/pages/ChatPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import ChatInput from '../components/ChatInput';
import ChatMessages from '../components/ChatMessages';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    // バックエンドの URL を指定
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:3000');
    socketRef.current = socket;

    socket.emit('getMessages');
    socket.on('messages', (msgs) => {
      setMessages(msgs);
    });

    socket.on('newMessage', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendMessage = (text) => {
    // userId はログイン情報から取得して渡す想定
    const userId = localStorage.getItem('userId');
    socketRef.current.emit('sendMessage', { userId, text });
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Chat Room</h1>
      <div className="border p-2 h-64 overflow-y-auto mb-4">
        <ChatMessages messages={messages} />
      </div>
      <ChatInput onSend={sendMessage} />
    </div>
  );
}
