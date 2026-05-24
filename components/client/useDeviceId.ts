'use client';

import { useEffect, useState } from 'react';

const KEY = 'pc_device_id';

function uuid() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'd_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useDeviceId(): string | null {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    let existing = localStorage.getItem(KEY);
    if (!existing) {
      existing = uuid();
      localStorage.setItem(KEY, existing);
    }
    // Mirror in cookie too (for server-side checks if needed)
    document.cookie = `${KEY}=${existing}; max-age=${60 * 60 * 24 * 365}; path=/; SameSite=Lax`;
    setId(existing);
  }, []);

  return id;
}
