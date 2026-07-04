// Tiện ích định dạng thời gian & giá trị hiển thị.

export function formatTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('vi-VN', { hour12: false });
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', { hour12: false });
}

/** "cách đây X" — dùng cho lastSeen. */
export function timeAgo(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso).getTime();
  if (isNaN(d)) return '—';
  const secs = Math.floor((Date.now() - d) / 1000);
  if (secs < 0) return 'vừa xong';
  if (secs < 60) return `${secs}s trước`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

/** Trừ ISO -> ISO ở quá khứ (giờ). */
export function isoHoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3600_000).toISOString();
}
export function isoNow(): string {
  return new Date().toISOString();
}

export function formatReadingValue(
  valueNum?: number,
  valueBool?: boolean,
  unit?: string
): string {
  if (valueBool !== undefined) return valueBool ? 'CÓ' : 'KHÔNG';
  if (valueNum !== undefined) {
    const n = Number.isInteger(valueNum) ? valueNum : valueNum.toFixed(1);
    return unit ? `${n} ${unit}` : `${n}`;
  }
  return '—';
}
