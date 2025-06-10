// client/src/components/Monitor.jsx
import React, { useEffect, useState } from 'react';
import { apiFetch, BASE } from '../api';
import { io } from 'socket.io-client';

export default function Monitor() {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Socket.io クライアントを生成し、リアルタイム更新を受け取る
  useEffect(() => {
    const socket = io(BASE || '/', { transports: ['websocket'] });
    socket.on('jobUpdate', (newLog) => {
      setLogs(prev => [newLog, ...prev]);
    });
    return () => {
      socket.off('jobUpdate');
      socket.disconnect();
    };
  }, []);

  // ジョブログ取得
  const fetchLogs = async () => {
    try {
      const res = await apiFetch('/jobs');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLogs(data);
    } catch (e) {
      console.error('ジョブログ取得エラー', e);
      setError('ジョブログの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 失敗ジョブをリトライ
  const retryJob = async (id) => {
    try {
      const res = await apiFetch(`/jobs/${id}/retry`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // REST 取得も更新
      await fetchLogs();
    } catch (e) {
      console.error('リトライ失敗', e);
      alert('リトライに失敗しました');
    }
  };

  // 初回データロード
  useEffect(() => {
    fetchLogs();
  }, []);

  if (loading) {
    return <p style={{ textAlign: 'center', marginTop: '2rem' }}>読み込み中…</p>;
  }
  if (error) {
    return <p style={{ color: 'red', textAlign: 'center', marginTop: '2rem' }}>{error}</p>;
  }
  if (logs.length === 0) {
    return <p style={{ textAlign: 'center', marginTop: '2rem' }}>ログがありません</p>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem' }}>
      <h2>ジョブログ一覧</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>時間</th>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>ジョブ名</th>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>ステータス</th>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>メッセージ</th>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td style={{ padding: '6px 8px' }}>
                {new Date(log.runAt).toLocaleString('ja-JP')}
              </td>
              <td style={{ padding: '6px 8px' }}>{log.name}</td>
              <td style={{ padding: '6px 8px' }}>{log.status}</td>
              <td style={{ padding: '6px 8px' }}>{log.message || '―'}</td>
              <td style={{ padding: '6px 8px' }}>
                <button onClick={() => retryJob(log.id)}>Retry</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
