// /results/[matchId] — Story 5.1. Public, link-bearer share page with OG
// meta. Reads from models/Match by _id. No auth required.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connectMongo } from '@/lib/db.js';
import { Match } from '@/models/Match.js';
import { ResultClient } from './ResultClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _fetchMatch(matchId: string) {
  try {
    await connectMongo();
    const doc = await Match.findById(matchId).lean();
    return doc;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params
}: {
  params: { matchId: string };
}): Promise<Metadata> {
  const m: any = await _fetchMatch(params.matchId);
  if (!m) return { title: 'Sonuç Bulunamadı · Prompt Clash' };
  const winnerName =
    m.winner === 'A'
      ? m.playerA?.nickname
      : m.winner === 'B'
      ? m.playerB?.nickname
      : null;
  const title = winnerName
    ? `${winnerName} kazandı · Prompt Clash`
    : 'Prompt Clash sonucu';
  const desc = m.playerA?.nickname
    ? `${m.playerA.nickname} vs ${m.playerB?.nickname || '—'} · ${m.category || ''}`
    : 'Prompt Clash maç sonucu';
  const ogImage =
    m.winner === 'A'
      ? m.playerA?.imageUrl
      : m.winner === 'B'
      ? m.playerB?.imageUrl
      : m.referenceImageUrl;
  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      images: ogImage ? [ogImage] : undefined,
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: ogImage ? [ogImage] : undefined
    }
  };
}

export default async function ResultsPage({ params }: { params: { matchId: string } }) {
  const m: any = await _fetchMatch(params.matchId);
  if (!m) notFound();
  return <ResultClient match={JSON.parse(JSON.stringify(m))} />;
}
