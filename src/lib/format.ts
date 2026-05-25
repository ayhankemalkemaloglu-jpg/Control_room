export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** A rate stored as a 0–1 fraction rendered as a percentage. */
export function pct(fraction: number | null | undefined, digits = 1): string {
  if (fraction === null || fraction === undefined || Number.isNaN(fraction)) return '—';
  return `${(fraction * 100).toFixed(digits)}%`;
}

/** A value already expressed in percent (e.g. pnl_pct = 2.5 → "+2.50%"). */
export function signedPct(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}%`;
}

export function num(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value.toFixed(digits);
}

export function pnlTone(value: number | null | undefined): 'up' | 'down' | 'flat' {
  if (value === null || value === undefined || Number.isNaN(value) || value === 0) return 'flat';
  return value > 0 ? 'up' : 'down';
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diff = Date.now() - then;
  const sec = Math.round(diff / 1000);
  if (sec < 0) return 'şimdi';
  if (sec < 60) return `${sec}s önce`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}dk önce`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}sa önce`;
  const day = Math.round(hr / 24);
  return `${day}g önce`;
}

export function holdLabel(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return '—';
  if (minutes < 60) return `${minutes}dk`;
  const hr = Math.floor(minutes / 60);
  const min = minutes % 60;
  return min ? `${hr}sa ${min}dk` : `${hr}sa`;
}
