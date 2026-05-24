type ClassValue = string | number | null | undefined | false | Record<string, boolean> | ClassValue[];

/**
 * Lightweight class name combiner without external deps (tailwind-merge not
 * installed in this project's stack to keep package.json lean). Same API
 * shape as clsx for familiarity.
 */
export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  const walk = (v: ClassValue) => {
    if (!v) return;
    if (typeof v === 'string' || typeof v === 'number') {
      out.push(String(v));
      return;
    }
    if (Array.isArray(v)) {
      v.forEach(walk);
      return;
    }
    if (typeof v === 'object') {
      for (const k of Object.keys(v)) {
        if ((v as Record<string, boolean>)[k]) out.push(k);
      }
    }
  };
  inputs.forEach(walk);
  return out.join(' ');
}
