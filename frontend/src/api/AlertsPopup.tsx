
import React, { useEffect, useState } from 'react';

type AlertItem = {
  id?: string;
  subject: string;
  body: string;
  date?: string;
  priority?: 'High' | 'General' | string;
  department?: string;
};

export default function AlertsPopup(): JSX.Element | null {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/alerts');
        if (!res.ok) {
          console.error('Fetch failed with status', res.status);
          return;
        }
        const data: AlertItem[] = await res.json();
        console.log('Fetched alerts:', data); // 🔍 DEBUG
        setAlerts(data);
        if (data && data.length > 0) {
          setVisible(true);
        }
      } catch (e) {
        console.error('Failed to fetch alerts', e);
      }
    };
    load();
    const id = setInterval(load, 60_000); // poll every 60s
    return () => clearInterval(id);
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed',   // 🔒 fixed so it floats above layout
        top: 70,
        right: 20,
        zIndex: 9999,        // 🔒 ensure it's always visible
        width: 360,
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 4px 18px rgba(0,0,0,0.15)',
        border: '1px solid #e6e6e6',
        padding: 14,
        fontFamily: 'inherit'
      }}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
        <h4 style={{margin: 0, fontSize: 16}}>Department Alerts</h4>
        <button onClick={() => setVisible(false)} style={{border: 'none', background: 'transparent', cursor: 'pointer'}}>✕</button>
      </div>

      <div style={{maxHeight: 320, overflowY: 'auto'}}>
        {alerts.length === 0 && <div style={{color: '#666'}}>No new alerts</div>}
        <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
          {alerts.map((a, i) => (
            <li key={a.id ?? i} style={{padding: '8px 0', borderBottom: '1px solid #f1f1f1'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <strong style={{color: a.priority === 'High' ? '#b71c1c' : '#2f4f2f'}}>{a.subject}</strong>
                <small style={{color: '#888'}}>{a.date ?? ''}</small>
              </div>
              <div style={{color: '#444', fontSize: 13, marginTop: 6}}>
                {a.body?.slice(0, 140)}
                {a.body && a.body.length > 140 ? '...' : ''}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div style={{marginTop: 10, display: 'flex', justifyContent: 'flex-end'}}>
        <button
          onClick={() => {
            fetch('/api/alerts/ack-all', {method: 'POST'})
              .finally(() => setVisible(false));
          }}
          style={{
            background:'#2f6f2f',
            color:'#fff',
            border:'none',
            padding:'8px 10px',
            borderRadius:6,
            cursor:'pointer'
          }}
        >
          Dismiss all
        </button>
      </div>
    </div>
  );
}
