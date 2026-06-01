'use client';

import { QRCodeSVG } from 'qrcode.react';

type Props = {
  value: string;
  size?: number;
};

export function QRCodeBlock({ value, size = 108 }: Props) {
  return (
    <div
      style={{
        width: size,
        height: size,
        flex: 'none',
        background: '#fff',
        padding: 8,
        border: '1px solid rgba(0,0,0,0.08)',
        boxSizing: 'content-box'
      }}
    >
      <QRCodeSVG value={value} size={size} level="M" />
    </div>
  );
}
