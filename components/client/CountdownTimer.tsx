'use client';

import { useEffect, useState } from 'react';

interface Props {
  endsAt: number | null;
  className?: string;
}

export function CountdownTimer({ endsAt, className }: Props) {
  const [remaining, setRemaining] = useState<number>(() =>
    endsAt ? Math.max(0, endsAt - Date.now()) : 0
  );

  useEffect(() => {
    if (!endsAt) {
      setRemaining(0);
      return;
    }
    const tick = () => setRemaining(Math.max(0, endsAt - Date.now()));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endsAt]);

  const sec = Math.ceil(remaining / 1000);
  return (
    <span className={className}>
      {sec.toString().padStart(2, '0')}
    </span>
  );
}
