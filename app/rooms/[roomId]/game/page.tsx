// /rooms/[roomId]/game — Story 2.1 (player surface) + 2.4 prompting view +
// 2.6 result view. Server resolves room; client wraps the existing
// MobileShell in a room-scoped GameStateProvider so all existing phase
// components (PromptingView, AudienceView, ResultView) Just Work.

import { notFound } from 'next/navigation';
import { getRoom } from '@/lib/game/state.js';
import { GameClient } from './GameClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Maç · Prompt Clash',
  robots: { index: false }
};

export default function RoomGamePage({ params }: { params: { roomId: string } }) {
  const room = getRoom(params.roomId);
  if (!room) notFound();
  return <GameClient roomId={room.roomId} />;
}
