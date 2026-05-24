'use client';

import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';

interface QRCardProps {
  value: string;
  size?: number;
  caption?: string;
  className?: string;
}

/**
 * QR display card — used on stage idle to invite mobile audience.
 * Premium card frame, violet-tinted shadow, big QR centered.
 */
export function QRCard({ value, size = 320, caption, className }: QRCardProps) {
  return (
    <div className={cn('q-card-elevated p-8 flex flex-col items-center gap-4', className)}>
      <div className="rounded-2xl bg-white p-4">
        <QRCodeSVG
          value={value}
          size={size}
          level="M"
          fgColor="#541fc4"
          bgColor="#ffffff"
          includeMargin={false}
        />
      </div>
      {caption && (
        <p className="q-label text-center max-w-xs">{caption}</p>
      )}
    </div>
  );
}
