'use client';

// Pixel axolotl mascot — extracted from mockups/landing.html as a self-contained
// SVG so screens can drop it in without juggling <symbol> + <use> across roots.

type Props = {
  size?: number;
  ariaLabel?: string;
};

export function MascotMark({ size = 28, ariaLabel }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      role={ariaLabel ? 'img' : 'presentation'}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      shapeRendering="crispEdges"
      style={{ display: 'block' }}
    >
      <g fill="#aed24a">
        <rect x="64" y="64" width="32" height="32" />
        <rect x="96" y="32" width="32" height="80" />
        <rect x="128" y="64" width="32" height="32" />
        <rect x="208" y="16" width="32" height="96" />
        <rect x="240" y="0" width="32" height="112" />
        <rect x="272" y="16" width="32" height="96" />
        <rect x="352" y="64" width="32" height="32" />
        <rect x="384" y="32" width="32" height="80" />
        <rect x="416" y="64" width="32" height="32" />
      </g>
      <g fill="#7c4dff">
        <rect x="96" y="112" width="320" height="32" />
        <rect x="64" y="144" width="384" height="32" />
        <rect x="32" y="176" width="448" height="32" />
        <rect x="32" y="208" width="448" height="32" />
        <rect x="32" y="240" width="448" height="32" />
        <rect x="32" y="272" width="448" height="32" />
        <rect x="32" y="304" width="448" height="32" />
        <rect x="32" y="336" width="448" height="32" />
        <rect x="64" y="368" width="384" height="32" />
        <rect x="96" y="400" width="64" height="32" />
        <rect x="208" y="400" width="96" height="32" />
        <rect x="352" y="400" width="64" height="32" />
        <rect x="96" y="432" width="64" height="48" />
        <rect x="352" y="432" width="64" height="48" />
      </g>
      <g fill="#f5f5f8">
        <rect x="208" y="240" width="96" height="32" />
        <rect x="176" y="272" width="160" height="32" />
        <rect x="144" y="304" width="224" height="32" />
        <rect x="144" y="336" width="224" height="32" />
        <rect x="176" y="368" width="160" height="32" />
      </g>
      <g fill="#ffffff">
        <rect x="96" y="208" width="64" height="64" />
        <rect x="352" y="208" width="64" height="64" />
      </g>
      <g fill="#14121a">
        <rect x="128" y="224" width="32" height="48" />
        <rect x="352" y="224" width="32" height="48" />
      </g>
      <g fill="#ffffff">
        <rect x="128" y="224" width="16" height="16" />
        <rect x="352" y="224" width="16" height="16" />
      </g>
      <rect x="240" y="336" width="32" height="16" fill="#5a35cc" />
    </svg>
  );
}
