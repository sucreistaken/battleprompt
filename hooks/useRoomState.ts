'use client';

// useRoomState — Story 2.8 (core). Owns socket connect + cold-load via
// GET /api/rooms/[roomId]/state + reconnect handler + state cache.
// D-13: no Zustand/Redux/SWR; existing useGameState pattern with room scoping.

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';

export type Role = 'host' | 'player' | 'audience' | 'stage';

export type RoomSnapshot = any; // shape comes from lib/socket/broadcasts.buildSnapshot

type State = {
  connected: boolean;
  cold: RoomSnapshot | null;
  live: RoomSnapshot | null;
  error: string | null;
  /** Set by socket once silent-retry exceeds 5s. UX-DR14. */
  disconnected: boolean;
  /** Set when server sends `tab_taken` (Story 2.8 / FR-14.7). */
  takenOver: boolean;
};

const SILENT_RETRY_MS = 5000;

export function useRoomState({
  roomId,
  role,
  deviceId,
  enabled = true,
  initialQuery
}: {
  roomId: string;
  role: Role;
  deviceId?: string;
  enabled?: boolean;
  /** Extra query params for cold-load (e.g., `?role=stage`). */
  initialQuery?: Record<string, string>;
}) {
  const [state, setState] = useState<State>({
    connected: false,
    cold: null,
    live: null,
    error: null,
    disconnected: false,
    takenOver: false
  });
  const socketRef = useRef<Socket | null>(null);
  const disconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Cold-load via REST ────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !roomId) return;
    let cancelled = false;
    const qs = new URLSearchParams(initialQuery || {});
    if (role === 'stage' && !qs.has('role')) qs.set('role', 'stage');
    const url = `/api/rooms/${encodeURIComponent(roomId)}/state${qs.toString() ? '?' + qs.toString() : ''}`;
    fetch(url, { credentials: 'include' })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok || !body.ok) {
          setState((s) => ({ ...s, error: body?.code || `cold_load_failed_${res.status}` }));
          return;
        }
        setState((s) => ({ ...s, cold: body.data, live: body.data, error: null }));
      })
      .catch((err) => {
        if (cancelled) return;
        setState((s) => ({ ...s, error: err?.message || 'cold_load_failed' }));
      });
    return () => {
      cancelled = true;
    };
  }, [roomId, role, enabled, initialQuery]);

  // ── Socket connect ────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !roomId) return;
    const socket = io({
      path: '/api/socket',
      auth: { roomId, role, deviceId },
      transports: ['websocket'],
      reconnection: true
    });
    socketRef.current = socket;

    function armDisconnect() {
      if (disconnectTimer.current) clearTimeout(disconnectTimer.current);
      disconnectTimer.current = setTimeout(() => {
        setState((s) => ({ ...s, disconnected: true }));
      }, SILENT_RETRY_MS);
    }
    function clearDisconnect() {
      if (disconnectTimer.current) {
        clearTimeout(disconnectTimer.current);
        disconnectTimer.current = null;
      }
      setState((s) => (s.disconnected ? { ...s, disconnected: false } : s));
    }

    socket.on('connect', () => {
      clearDisconnect();
      setState((s) => ({ ...s, connected: true, error: null }));
    });
    socket.on('disconnect', () => {
      setState((s) => ({ ...s, connected: false }));
      armDisconnect();
    });
    socket.on('connect_error', (err) => {
      setState((s) => ({ ...s, connected: false, error: err?.message || 'connect_error' }));
      armDisconnect();
    });
    socket.on('state', (snap: RoomSnapshot) => {
      clearDisconnect();
      setState((s) => ({ ...s, live: snap }));
    });
    socket.on('tab_taken', () => {
      setState((s) => ({ ...s, takenOver: true }));
    });
    socket.on('room:closed', () => {
      setState((s) => ({ ...s, error: 'room_closed' }));
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      if (disconnectTimer.current) clearTimeout(disconnectTimer.current);
    };
  }, [roomId, role, deviceId, enabled]);

  const emit = useCallback((event: string, ...args: any[]) => {
    socketRef.current?.emit(event, ...args);
  }, []);

  return {
    snapshot: state.live || state.cold,
    cold: state.cold,
    connected: state.connected,
    disconnected: state.disconnected,
    takenOver: state.takenOver,
    error: state.error,
    emit
  };
}
