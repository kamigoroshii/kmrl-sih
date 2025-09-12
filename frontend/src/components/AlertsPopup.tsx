// ...existing code...
import React, { useEffect, useState } from 'react';
import './alerts.css';

type AlertItem = {
  id?: string;
  subject: string;
  body: string;
  date?: string;
  priority?: 'High' | 'General' | string;
  department?: string;
  from?: string;
};

export default function AlertsPopup({ forceShow }: { forceShow?: boolean }): JSX.Element | null {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [visible, setVisible] = useState<boolean>(!!forceShow);
  const [selected, setSelected] = useState<AlertItem | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/alerts');
      if (!res.ok) return;
      const data: AlertItem[] = await res.json();
      setAlerts(data);
      if ((data && data.length > 0) || forceShow) setVisible(true);
    } catch (e) {
      console.error('Failed to load alerts', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  if (!visible) return null;

  return (
    <>
      <div className="alerts-popup" role="status" aria-live="polite">
        <div className="alerts-header">
          <div className="alerts-title">Department Alerts</div>
          <div className="alerts-actions">
            <button className="btn-icon" onClick={() => setVisible(false)} aria-label="Close alerts">✕</button>
          </div>
        </div>

        <div className="alerts-body">
          {loading && <div className="alerts-loading">Checking for alerts…</div>}
          {!loading && alerts.length === 0 && <div className="alerts-empty">No new alerts</div>}

          <ul className="alerts-list">
            {alerts.map((a, i) => (
              <li key={a.id ?? i} className="alerts-item">
                <div className="alerts-item-top">
                  <div className="alerts-subject">
                    <span className={`badge ${a.priority === 'High' ? 'badge-high' : 'badge-general'}`}>
                      {a.priority ?? 'General'}
                    </span>
                    <strong>{a.subject}</strong>
                  </div>
                  <div className="alerts-meta">
                    <small>{a.date ?? ''}</small>
                  </div>
                </div>

                <div className="alerts-preview">{a.body?.slice(0, 120)}{a.body && a.body.length > 120 ? '...' : ''}</div>

                <div className="alerts-item-actions">
                  <button className="btn-link" onClick={() => setSelected(a)}>View</button>
                  <button className="btn-link" onClick={async () => {
                    setAlerts(prev => prev.filter(x => x.id !== a.id));
                    try { await fetch(`http://localhost:5000/api/alerts/ack/${a.id}`, { method: 'POST' }); } catch (_) {}
                  }}>Dismiss</button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="alerts-footer">
          <button className="btn-primary" onClick={async () => {
            try { await fetch('http://localhost:5000/api/alerts/ack-all', { method: 'POST' }); } catch (_) {}
            setAlerts([]); setVisible(false);
          }}>Dismiss all</button>
        </div>
      </div>

      {selected && (
        <div className="alerts-modal-backdrop" onClick={() => setSelected(null)}>
          <div className="alerts-modal" onClick={(e) => e.stopPropagation()}>
            <div className="alerts-modal-header">
              <h3>{selected.subject}</h3>
              <button className="btn-icon" onClick={() => setSelected(null)} aria-label="Close">✕</button>
            </div>
            <div className="alerts-modal-body">
              <div className="alerts-modal-meta"><strong>From:</strong> {selected.from ?? 'Unknown'} • <strong>Date:</strong> {selected.date}</div>
              <div className="alerts-modal-content">{selected.body}</div>
            </div>
            <div className="alerts-modal-actions">
              <button className="btn-primary" onClick={() => { setAlerts(prev => prev.filter(x => x.id !== selected.id)); setSelected(null); }}>Acknowledge</button>
              <button className="btn-secondary" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
// ...existing code...