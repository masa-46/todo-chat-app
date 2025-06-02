import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');   // env で切替も可

export default function ChatRoom() {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    socket.emit('getMessages');
    socket.on('messages', setMsgs);
    socket.on('newMessage', m => setMsgs(prev => [...prev, m]));
    return () => socket.disconnect();
  }, []);

  const send = () => {
    if (!text.trim()) return;
    socket.emit('sendMessage', { userId: 'reactUser', text });
    setText('');
  };

  return (
    <>
      <h2>Chat</h2>
      <ul>
        {msgs.map((m,i) => <li key={i}>{m.userId}: {m.text}</li>)}
      </ul>
      <input value={text} onChange={e=>setText(e.target.value)} />
      <button onClick={send}>Send</button>
    </>
  );
}
