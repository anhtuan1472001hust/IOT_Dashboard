// Đồng hồ đo tròn (SVG) hiển thị một giá trị trong khoảng [min,max].
// Dùng cho nhiệt độ, độ ẩm... trực quan hơn con số trần.

interface GaugeProps {
  value?: number;
  min: number;
  max: number;
  unit?: string;
  label: string;
  color: string;
  size?: number;
}

export function Gauge({
  value,
  min,
  max,
  unit,
  label,
  color,
  size = 104,
}: GaugeProps) {
  const has = value !== undefined && !Number.isNaN(value);
  const clamped = has ? Math.min(max, Math.max(min, value!)) : min;
  const pct = (clamped - min) / (max - min);

  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  // Cung 270° (hở 90° phía dưới) cho cảm giác "đồng hồ".
  const arc = 0.75;
  const dash = c * arc;
  const offset = dash * (1 - pct);
  const rotation = 135; // xoay để phần hở nằm dưới

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
            transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
            strokeDashoffset={has ? offset : dash}
            transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
            style={{
              transition: 'stroke-dashoffset 0.6s ease',
              filter: `drop-shadow(0 0 6px ${color}66)`,
            }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 22, fontWeight: 800, color: has ? 'var(--text)' : 'var(--text-dim)' }}>
            {has ? (Number.isInteger(value) ? value : value!.toFixed(1)) : '—'}
          </span>
          {unit && has && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: -2 }}>
              {unit}
            </span>
          )}
        </div>
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
        {label}
      </span>
    </div>
  );
}
