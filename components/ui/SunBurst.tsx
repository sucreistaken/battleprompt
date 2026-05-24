'use client';

interface Props {
  size?: number;
  innerRadius?: number;
  outerRadius?: number;
  rays?: number;
  color?: string;
  className?: string;
  spinning?: boolean;
  rayWidth?: number;
  /** Sun fill — defaults to color. Set null to omit fill (rays only). */
  fillColor?: string | null;
}

export function SunBurst({
  size = 200,
  innerRadius = 30,
  outerRadius,
  rays = 18,
  color = '#f4c542',
  className = '',
  spinning = false,
  rayWidth = 4,
  fillColor
}: Props) {
  const half = size / 2;
  const outer = outerRadius ?? half;
  const fill = fillColor === undefined ? color : fillColor;
  const rayElements = [];
  for (let i = 0; i < rays; i++) {
    const angle = (i * 360) / rays;
    const a = (angle * Math.PI) / 180;
    const x1 = half + Math.cos(a) * (innerRadius + 4);
    const y1 = half + Math.sin(a) * (innerRadius + 4);
    const x2 = half + Math.cos(a) * outer;
    const y2 = half + Math.sin(a) * outer;
    rayElements.push(
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={rayWidth}
        strokeLinecap="round"
      />
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`${className} ${spinning ? 'animate-sunSpin' : ''}`}
      style={{ overflow: 'visible' }}
    >
      {fill && <circle cx={half} cy={half} r={innerRadius} fill={fill} />}
      {rayElements}
    </svg>
  );
}
