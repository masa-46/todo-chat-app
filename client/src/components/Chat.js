// client/src/components/Chat.js
import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { BASE } from '../api'; 

// BASE を使って、WebSocket 固定で接続
const socket = io(BASE, { transports: ['websocket'] });

export default function Chat({ userId }) {
  const [messages, setMessages] = useState([]);      // メッセージ一覧
  const [inputText, setInputText] = useState('');    // 送信フォームのテキスト
  const messageListRef = useRef(null);

  useEffect(() => {
    // ① まず自分の userId を join
    socket.emit('join', { userId });
    // ② その後、自分用の過去メッセージを取得
    socket.emit('getMessages', { userId });

    // サーバーから過去メッセージ一覧が届いたとき
    socket.on('messages', (msgs) => {
      setMessages(msgs);
      // メッセージを受け取ったあとに、自動スクロール
      setTimeout(() => {
        if (messageListRef.current) {
          messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
      }, 50);
    });

    // 新着メッセージをリアルタイム受信したとき
    socket.on('newMessage', (msg) => {
      setMessages((prev) => {
        const next = [...prev, msg];
        return next;
      });
      // 新しいメッセージが来たら、自動スクロール
      setTimeout(() => {
        if (messageListRef.current) {
          messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
      }, 50);
    });

    // クリーンアップ：コンポーネント破棄時にイベントリスナーを解除
    return () => {
      socket.off('messages');
      socket.off('newMessage');
    };
  }, []);

  // フォームを送信したとき（Enter キー or 送信ボタン）
  const handleSubmit = (e) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;
    // サーバーに「sendMessage」イベントを送信
    socket.emit('sendMessage', { userId, text });
    setInputText('');
  };

  return (
    <div style={styles.container}>
      <div ref={messageListRef} style={styles.messageList}>
        {messages.map((msg) => {
          const time = new Date(msg.createdAt).toLocaleTimeString();
          return (
            <div key={msg.id} style={styles.messageItem}>
              <span style={styles.timestamp}>[{time}]</span>{' '}
              <span style={styles.user}>User{msg.userId}:</span>{' '}
              <span style={styles.text}>{msg.text}</span>
            </div>
          );
        })}
      </div>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="メッセージを入力…"
          style={styles.input}
        />
        <button type="submit" style={styles.button}>送信</button>
      </form>
    </div>
  );
}

// シンプルなインラインスタイル例
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    maxWidth: '600px',
    margin: '0 auto',
    border: '1px solid #ccc',
  },
  messageList: {
    flex: 1,
    overflowY: 'auto',
    padding: '10px',
    backgroundColor: '#f9f9f9',
  },
  messageItem: {
    marginBottom: '8px',
  },
  timestamp: {
    color: '#888',
    fontSize: '0.8rem',
  },
  user: {
    fontWeight: 'bold',
  },
  text: {
    marginLeft: '4px',
  },
  form: {
    display: 'flex',
    borderTop: '1px solid #ddd',
  },
  input: {
    flex: 1,
    padding: '8px',
    fontSize: '1rem',
    border: 'none',
    outline: 'none',
  },
  button: {
    padding: '8px 16px',
    fontSize: '1rem',
    cursor: 'pointer',
  },
};
