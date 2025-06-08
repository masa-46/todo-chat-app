// client/src/components/Monitor.jsx
import { useEffect, useState } from 'react';
import { apiFetch } from '../api';

export default function Monitor() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch('/jobs')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setLogs(data);
      })
      .catch((err) => {
        console.error('ジョブログ取得エラー', err);
        setError('ジョブログの取得に失敗しました');
      })
      .finally(() => {
        setLoading(false);
      });
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
          </tr>
        </thead>
        <tbody>
          {logs.map((log, idx) => (
            <tr key={idx}>
              <td style={{ padding: '6px 8px' }}>
                {new Date(log.runAt).toLocaleString('ja-JP')}
              </td>
              <td style={{ padding: '6px 8px' }}>{log.name}</td>
              <td style={{ padding: '6px 8px' }}>{log.status}</td>
              <td style={{ padding: '6px 8px' }}>{log.message || '―'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
