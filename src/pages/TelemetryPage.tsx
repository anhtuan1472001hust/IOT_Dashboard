import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getDevices, getTelemetry } from '../api/endpoints';
import { Loading, ErrorBox, Empty } from '../components/Loading';
import { deviceTypeLabel, zoneLabel } from '../lib/labels';
import { formatTime, isoHoursAgo, isoNow } from '../lib/format';

const RANGES: { label: string; hours: number }[] = [
  { label: '1 giờ', hours: 1 },
  { label: '6 giờ', hours: 6 },
  { label: '24 giờ', hours: 24 },
  { label: '7 ngày', hours: 24 * 7 }, // tối đa theo history-max-window
];

export function TelemetryPage() {
  const [sensorId, setSensorId] = useState<string>('');
  const [hours, setHours] = useState<number>(6);

  // Danh sách cảm biến để chọn (category=sensor).
  const sensors = useQuery({
    queryKey: ['devices', 'sensor'],
    queryFn: () => getDevices({ category: 'sensor', limit: 200 }),
  });

  // Chọn sẵn cảm biến đầu tiên khi tải xong.
  const sensorList = sensors.data?.data ?? [];
  const activeSensor = sensorId || sensorList[0]?.deviceId || '';
  const sensorMeta = sensorList.find((s) => s.deviceId === activeSensor);

  const range = useMemo(
    () => ({ from: isoHoursAgo(hours), to: isoNow() }),
    [hours]
  );

  const telemetry = useQuery({
    queryKey: ['telemetry', activeSensor, hours],
    queryFn: () =>
      getTelemetry({
        sensorId: activeSensor,
        from: range.from,
        to: range.to,
        pageSize: 200,
      }),
    enabled: !!activeSensor,
  });

  const readings = telemetry.data?.data ?? [];
  const isNumeric = readings.some((r) => r.valueNum !== undefined);

  const chartData = useMemo(
    () =>
      readings
        .filter((r) => r.valueNum !== undefined)
        .map((r) => ({
          ts: r.ts,
          time: formatTime(r.ts),
          value: r.valueNum!,
        }))
        .sort((a, b) => a.ts.localeCompare(b.ts)),
    [readings]
  );

  const stats = useMemo(() => {
    const vals = chartData.map((d) => d.value);
    if (vals.length === 0) return null;
    const sum = vals.reduce((a, b) => a + b, 0);
    return {
      count: vals.length,
      min: Math.min(...vals),
      max: Math.max(...vals),
      avg: sum / vals.length,
      latest: vals[vals.length - 1],
    };
  }, [chartData]);

  const unit = readings.find((r) => r.unit)?.unit ?? '';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Biểu đồ & thống kê</h1>
          <div className="page-subtitle">
            Lịch sử telemetry theo cảm biến · cửa sổ tối đa 7 ngày
          </div>
        </div>
      </div>

      {/* Bộ lọc */}
      <div
        className="card row row-wrap"
        style={{ marginBottom: 'var(--space-5)' }}
      >
        <label className="field">
          Cảm biến
          <select
            className="select"
            value={activeSensor}
            onChange={(e) => setSensorId(e.target.value)}
          >
            {sensorList.map((s) => (
              <option key={s.deviceId} value={s.deviceId}>
                {s.deviceId} · {deviceTypeLabel(s.deviceType)} ·{' '}
                {zoneLabel(s.zone)}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          Khoảng thời gian
          <select
            className="select"
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
          >
            {RANGES.map((r) => (
              <option key={r.hours} value={r.hours}>
                {r.label}
              </option>
            ))}
          </select>
        </label>

        <div className="spacer" />
        <div className="dim" style={{ fontSize: 12 }}>
          {sensorMeta && (
            <>
              Loại: <strong>{deviceTypeLabel(sensorMeta.deviceType)}</strong>
            </>
          )}
        </div>
      </div>

      {/* Thống kê tổng hợp */}
      {stats && (
        <div
          className="grid stat-grid"
          style={{ marginBottom: 'var(--space-5)' }}
        >
          <StatCard label="Số mẫu" value={`${stats.count}`} />
          <StatCard
            label="Nhỏ nhất"
            value={`${stats.min.toFixed(1)}${unit ? ' ' + unit : ''}`}
          />
          <StatCard
            label="Lớn nhất"
            value={`${stats.max.toFixed(1)}${unit ? ' ' + unit : ''}`}
          />
          <StatCard
            label="Trung bình"
            value={`${stats.avg.toFixed(1)}${unit ? ' ' + unit : ''}`}
            highlight
          />
          <StatCard
            label="Mới nhất"
            value={`${stats.latest.toFixed(1)}${unit ? ' ' + unit : ''}`}
          />
        </div>
      )}

      {/* Biểu đồ */}
      <div className="card">
        <div className="card-title">
          Biểu đồ theo thời gian {activeSensor && `— ${activeSensor}`}
        </div>
        {telemetry.isLoading ? (
          <Loading label="Đang tải dữ liệu telemetry…" />
        ) : telemetry.isError ? (
          <ErrorBox error={telemetry.error} />
        ) : !isNumeric ? (
          <Empty label="Cảm biến này là dạng nhị phân (đóng/mở, khói) — không vẽ đường được. Chọn cảm biến số (nhiệt độ, độ ẩm, ánh sáng)." />
        ) : chartData.length === 0 ? (
          <Empty label="Không có dữ liệu trong khoảng thời gian này." />
        ) : (
          <ResponsiveContainer width="100%" height={340}>
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                stroke="var(--text-dim)"
                fontSize={11}
                minTickGap={30}
              />
              <YAxis
                stroke="var(--text-dim)"
                fontSize={11}
                domain={['auto', 'auto']}
                unit={unit ? ` ${unit}` : ''}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 8,
                  color: 'var(--text)',
                }}
                labelStyle={{ color: 'var(--text-muted)' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--brand)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                name={sensorMeta ? deviceTypeLabel(sensorMeta.deviceType) : 'Giá trị'}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="card">
      <div className="card-title">{label}</div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: highlight ? 'var(--brand)' : 'var(--text)',
        }}
      >
        {value}
      </div>
    </div>
  );
}
