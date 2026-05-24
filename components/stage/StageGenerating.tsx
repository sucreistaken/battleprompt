'use client';

import { useGameState } from '@/components/client/useGameState';
import { useI18n } from '@/components/client/i18nContext';
import { StageFrame, TopBar, PixelText, Avatar, Lbl, StageImage, C, FONT } from './atmosphere';
import type { PlayerSnapshot } from '@/types/game';

interface Props {
  scoringMode?: boolean;
}

/**
 * GENERATING / SCORING - twin rendering tiles with per-player jersey.
 * Each tile keeps the player's prompt visible so the room has something to
 * read during the dead render seconds. Reveals the image once it lands.
 */
export function StageGenerating({ scoringMode }: Props) {
  const { state, livePrompts } = useGameState();
  const { t } = useI18n();
  if (!state) return null;

  const matchId = state.matchId ? state.matchId.slice(-4).toUpperCase() : '';

  return (
    <StageFrame>
      <TopBar liveLabel={t('live')} matchId={matchId} theme={state.theme} />

      <div
        style={{
          position: 'absolute',
          top: 150,
          left: 100,
          right: 100,
          bottom: 150,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 22, marginBottom: 36 }}>
          <PixelText size={88}>{t('aiHeadLead')}</PixelText>
          <PixelText size={88} color={C.accent}>
            {scoringMode ? t('aiHeadScoring') : t('aiHeadWorking')}
          </PixelText>
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60 }}>
          {(['A', 'B'] as const).map((letter) => (
            <GeneratingColumn
              key={letter}
              letter={letter}
              player={state.players[letter]}
              prompt={state.players[letter]?.prompt ?? livePrompts[letter]}
              showImage={!!scoringMode}
            />
          ))}
        </div>
      </div>

      {/* Indeterminate progress */}
      <div
        style={{
          position: 'absolute',
          bottom: 70,
          left: 100,
          right: 100,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <Lbl size={12} color="text2">
          {scoringMode ? t('aiScoring') : t('progressLabel')}
        </Lbl>
        <div style={{ position: 'relative', height: 4, background: C.line, overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: '34%',
              background: C.accent,
              animation: 'pcShimmer 1.6s ease-in-out infinite',
            }}
          />
        </div>
      </div>
    </StageFrame>
  );
}

function GeneratingColumn({
  letter,
  player,
  prompt,
  showImage,
}: {
  letter: 'A' | 'B';
  player: PlayerSnapshot | null;
  prompt: string;
  showImage: boolean;
}) {
  const { t } = useI18n();
  const color = C.player(letter);
  const name = player?.nickname ?? '-';

  return (
    <div style={{ background: C.ink2, border: `1px solid ${C.line}`, borderTop: `5px solid ${color}`, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 22px', background: C.ink3, borderBottom: `1px solid ${C.line}` }}>
        <Avatar letter={letter} size={36} player={letter} />
        <span style={{ fontFamily: FONT.body, fontSize: 22, fontWeight: 700, color: C.bone }}>{name}</span>
      </div>

      <StageImage
        src={showImage ? player?.imageUrl ?? null : null}
        alt={name}
        accent={color}
        loadingLabel={showImage ? t('aiScoring') : t('aiDrawing')}
        fill
      />

      <div style={{ padding: '16px 22px', borderTop: `1px solid ${C.line}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Lbl size={10} color="text3" style={{ textTransform: 'uppercase' }}>
          {name} {t('askedForLabel')}
        </Lbl>
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 15,
            lineHeight: 1.45,
            color: C.text2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {prompt || '-'}
        </div>
      </div>
    </div>
  );
}
