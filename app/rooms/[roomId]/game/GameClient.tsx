'use client';

// GameClient — room-scoped player surface. Pulls a pending nickname out of
// sessionStorage (set by /join/[code]) and auto-fires joinGame on the first
// socket connect. After that the existing MobileShell renders all phases.

import { useEffect } from 'react';
import { I18nProvider } from '@/components/client/i18nContext';
import { GameStateProvider, useGameState } from '@/components/client/useGameState';
import { MobileShell } from '@/components/client/MobileShell';

export function GameClient({ roomId }: { roomId: string }) {
  return (
    <I18nProvider>
      <GameStateProvider role="player" roomId={roomId}>
        <AutoJoin roomId={roomId} />
        <MobileShell />
      </GameStateProvider>
    </I18nProvider>
  );
}

// Story 2.1: pick up the nickname the /join/[code] page stored and emit
// join_game on mount. Idempotent: if already in a slot, the lifecycle's
// reattach-by-deviceId path silently no-ops.
function AutoJoin({ roomId }: { roomId: string }) {
  const { socket, mySlot, joinGame } = useGameState();
  useEffect(() => {
    if (!socket || mySlot) return;
    let nick: string | null = null;
    try {
      nick = sessionStorage.getItem(`pc_pending_nick:${roomId}`);
    } catch {
      // private mode — no pending nick, do nothing
    }
    if (!nick) return;
    let cancelled = false;
    (async () => {
      const res = await joinGame(nick!);
      if (cancelled) return;
      if (res?.ok) {
        try {
          sessionStorage.removeItem(`pc_pending_nick:${roomId}`);
        } catch {
          // ignore
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [socket, mySlot, roomId, joinGame]);
  return null;
}
