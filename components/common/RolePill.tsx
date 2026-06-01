'use client';

/**
 * Topbar role chip — small pixel-font pill with a colored dot indicating
 * which surface the visitor is on. Used by host-control (HOST), audience
 * surfaces (AUDIENCE), and player surfaces (PLAYER) when an explicit
 * role indicator helps disambiguate.
 *
 * Ported from mockups/room-control.html .role-pill.
 */

type Kind = 'host' | 'audience' | 'player' | 'lobi';

type Props = {
  kind: Kind;
  /** Override label text; otherwise uses upper-case kind. */
  label?: string;
};

const tone: Record<Kind, { color: string; bg: string; border: string; shadow: string }> = {
  host: {
    color: 'var(--pc-accent)',
    bg: 'rgba(124,77,255,0.10)',
    border: 'rgba(124,77,255,0.34)',
    shadow: '0 0 8px rgba(124,77,255,0.5)',
  },
  audience: {
    color: '#aed24a',
    bg: 'rgba(174,210,74,0.10)',
    border: 'rgba(174,210,74,0.34)',
    shadow: '0 0 8px rgba(174,210,74,0.5)',
  },
  player: {
    color: 'var(--pc-bone)',
    bg: 'rgba(255,255,255,0.06)',
    border: 'rgba(255,255,255,0.20)',
    shadow: '0 0 8px rgba(255,255,255,0.4)',
  },
  lobi: {
    color: '#aed24a',
    bg: 'rgba(174,210,74,0.08)',
    border: 'rgba(174,210,74,0.30)',
    shadow: '0 0 8px rgba(174,210,74,0.5)',
  },
};

export function RolePill({ kind, label }: Props) {
  const t = tone[kind];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '5px 10px',
        borderRadius: 999,
        background: t.bg,
        border: `1px solid ${t.border}`,
        fontFamily: "'Inter Tight', system-ui, sans-serif",
        fontSize: 10,
        letterSpacing: '0.12em',
        color: t.color,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          background: t.color,
          flex: 'none',
          boxShadow: t.shadow,
        }}
      />
      {label ?? kind.toUpperCase()}
    </span>
  );
}
