'use client';

// AdminRoomsClient — minimal Story 4.1 UI. Fetches the room list from
// /api/admin/rooms and renders a table with state + close action. Uses the
// existing q-design-system light theme via inline classes (no new tokens).

import { useEffect, useState, useCallback } from 'react';

type Row = {
  roomId: string;
  roomCode: string;
  roomName: string;
  hostId: string;
  state: string | null;
  phase: string;
  playerCount: number;
  audienceEnabled: boolean;
  audienceVotingEnabled: boolean;
  createdAt: number;
  lastActivityAt: number;
};

export function AdminRoomsClient() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetch('/api/admin/rooms', { credentials: 'include' });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        setErr(body?.code || `http_${res.status}`);
        return;
      }
      setRows(body.data.rooms);
    } catch (e: any) {
      setErr(e?.message || 'fetch_failed');
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  async function closeRoom(roomId: string) {
    if (!confirm(`Odayı kapatmak istediğine emin misin? ${roomId.slice(0, 16)}…`)) return;
    setBusy(roomId);
    try {
      const res = await fetch(`/api/admin/rooms/${encodeURIComponent(roomId)}/close`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(`Hata: ${body?.code || res.status}`);
      }
      await load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#faf7ff',
        padding: '32px',
        fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
        color: '#1f1633'
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 16
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.01em' }}>
            Aktif Odalar
          </h1>
          <a
            href="/admin"
            style={{ color: '#541fc4', fontSize: 13, textDecoration: 'none' }}
          >
            ← Operatör paneline dön
          </a>
        </header>
        <DeployWarning />
        {err ? (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              borderRadius: 12,
              color: '#9f1239',
              fontSize: 13
            }}
          >
            Hata: {err}
          </div>
        ) : null}
        <div style={{ marginTop: 16, overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 13,
              background: '#fff',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 1px 2px rgba(84,31,196,0.04), 0 12px 32px rgba(84,31,196,0.08)'
            }}
          >
            <thead
              style={{
                background: '#f3edff',
                color: '#4118a3'
              }}
            >
              <tr>
                <Th>Kod</Th>
                <Th>Oda Adı</Th>
                <Th>State</Th>
                <Th>Phase</Th>
                <Th>Oyuncu</Th>
                <Th>Voting</Th>
                <Th>Son aktivite</Th>
                <Th>İşlem</Th>
              </tr>
            </thead>
            <tbody>
              {rows === null ? (
                <tr>
                  <td colSpan={8} style={{ padding: 16, textAlign: 'center', color: '#6b5e85' }}>
                    Yükleniyor…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 16, textAlign: 'center', color: '#6b5e85' }}>
                    Aktif oda yok.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.roomId} style={{ borderTop: '1px solid #ece7f7' }}>
                    <Td>
                      <code style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}>
                        {r.roomCode}
                      </code>
                    </Td>
                    <Td>{r.roomName || '—'}</Td>
                    <Td>{r.state || '—'}</Td>
                    <Td>{r.phase}</Td>
                    <Td>{r.playerCount} / 2</Td>
                    <Td>{r.audienceVotingEnabled ? 'açık' : 'kapalı'}</Td>
                    <Td>
                      {r.lastActivityAt
                        ? new Date(r.lastActivityAt).toLocaleTimeString('tr-TR')
                        : '—'}
                    </Td>
                    <Td>
                      <button
                        type="button"
                        onClick={() => closeRoom(r.roomId)}
                        disabled={busy === r.roomId}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid #fecdd3',
                          background: '#fff1f2',
                          color: '#9f1239',
                          borderRadius: 8,
                          fontSize: 12,
                          cursor: busy === r.roomId ? 'wait' : 'pointer',
                          fontFamily: 'inherit'
                        }}
                      >
                        {busy === r.roomId ? 'Kapatılıyor…' : 'Kapat'}
                      </button>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        padding: '10px 12px',
        textAlign: 'left',
        fontWeight: 600,
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '0.08em'
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '10px 12px' }}>{children}</td>;
}

// Story 4.4 — G-3 mid-deploy warning. Reused in /admin via a future polish;
// surfaced here too so admins always see it.
function DeployWarning() {
  const [data, setData] = useState<{ activeRoomCount: number; warningLevel: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/admin/active-rooms-warning', { credentials: 'include' });
        const body = await res.json();
        if (!cancelled && res.ok && body.ok) setData(body.data);
      } catch {
        /* ignore */
      }
    }
    load();
    const t = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);
  if (!data || data.activeRoomCount === 0) return null;
  const isCritical = data.warningLevel === 'critical';
  return (
    <div
      role="status"
      style={{
        padding: '12px 16px',
        background: isCritical ? '#fff1f2' : '#fef9c3',
        border: `1px solid ${isCritical ? '#fda4af' : '#fde047'}`,
        borderRadius: 12,
        color: isCritical ? '#9f1239' : '#854d0e',
        fontSize: 13,
        fontWeight: 600
      }}
    >
      DİKKAT: Şu anda {data.activeRoomCount} aktif oda. Şu an redeploy yapılırsa hepsi düşer.
      Phase 1'de aktif oda state'i RAM'de tutuluyor; Phase 2'de snapshot-recovery eklenecek.
    </div>
  );
}
