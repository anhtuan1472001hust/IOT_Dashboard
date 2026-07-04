import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDeviceHealth, getDevices } from '../api/endpoints';
import type { DeviceCategory, DeviceStatus } from '../api/types';
import { Loading, ErrorBox, Empty } from '../components/Loading';
import { ConnDot, DeviceStatusTag } from '../components/Tags';
import { deviceTypeLabel, zoneLabel } from '../lib/labels';
import { formatDateTime, timeAgo } from '../lib/format';

const CATEGORIES: DeviceCategory[] = ['gateway', 'sensor', 'actuator'];
const STATUSES: DeviceStatus[] = [
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'DECOMMISSIONED',
];

export function DevicesPage() {
  const [category, setCategory] = useState<DeviceCategory | ''>('');
  const [status, setStatus] = useState<DeviceStatus | ''>('');
  const [selected, setSelected] = useState<string | null>(null);

  const devices = useQuery({
    queryKey: ['devices', category, status],
    queryFn: () =>
      getDevices({
        category: category || undefined,
        status: status || undefined,
        limit: 200,
      }),
  });

  const list = devices.data?.data ?? [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Danh sách thiết bị</h1>
          <div className="page-subtitle">
            Gateway, cảm biến và actuator đã đăng ký · bấm để xem tình trạng
          </div>
        </div>
      </div>

      <div className="card row row-wrap" style={{ marginBottom: 'var(--space-4)' }}>
        <label className="field">
          Loại
          <select
            className="select"
            value={category}
            onChange={(e) => setCategory(e.target.value as DeviceCategory | '')}
          >
            <option value="">Tất cả</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Trạng thái
          <select
            className="select"
            value={status}
            onChange={(e) => setStatus(e.target.value as DeviceStatus | '')}
          >
            <option value="">Tất cả</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <div className="spacer" />
        <span className="dim">{list.length} thiết bị</span>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {devices.isLoading ? (
          <Loading />
        ) : devices.isError ? (
          <div style={{ padding: 16 }}>
            <ErrorBox error={devices.error} />
          </div>
        ) : list.length === 0 ? (
          <Empty />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Device ID</th>
                <th>Loại</th>
                <th>Kiểu</th>
                <th>Khu vực</th>
                <th>Firmware</th>
                <th>Giao thức</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {list.map((d) => (
                <tr
                  key={d.deviceId}
                  style={{ cursor: 'pointer' }}
                  onClick={() =>
                    setSelected(selected === d.deviceId ? null : d.deviceId)
                  }
                >
                  <td className="mono">{d.deviceId}</td>
                  <td>{d.category}</td>
                  <td>{deviceTypeLabel(d.deviceType)}</td>
                  <td>{zoneLabel(d.zone)}</td>
                  <td className="dim">{d.firmwareVersion ?? '—'}</td>
                  <td className="dim">{d.protocols?.join(', ')}</td>
                  <td>
                    <DeviceStatusTag status={d.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && <HealthPanel deviceId={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function HealthPanel({
  deviceId,
  onClose,
}: {
  deviceId: string;
  onClose: () => void;
}) {
  const health = useQuery({
    queryKey: ['device-health', deviceId],
    queryFn: () => getDeviceHealth(deviceId),
    refetchInterval: 20000,
    retry: false,
  });

  return (
    <div className="card" style={{ marginTop: 'var(--space-4)' }}>
      <div className="row" style={{ marginBottom: 'var(--space-4)' }}>
        <h3>
          Tình trạng thiết bị · <span className="mono">{deviceId}</span>
        </h3>
        <div className="spacer" />
        <button className="btn btn-sm" onClick={onClose}>
          Đóng
        </button>
      </div>

      {health.isLoading ? (
        <Loading />
      ) : health.isError ? (
        <Empty label="Thiết bị này chưa từng báo cáo tình trạng (404) hoặc không hỗ trợ heartbeat." />
      ) : health.data ? (
        <div
          className="grid stat-grid"
        >
          <HealthMetric label="Kết nối">
            <ConnDot status={health.data.connectionStatus} />
          </HealthMetric>
          <HealthMetric label="Lần cuối online">
            <span>{timeAgo(health.data.lastSeen)}</span>
            <div className="dim" style={{ fontSize: 11 }}>
              {formatDateTime(health.data.lastSeen)}
            </div>
          </HealthMetric>
          <HealthMetric label="RAM">
            <Gauge pct={health.data.memoryUsagePct} />
          </HealthMetric>
          <HealthMetric label="CPU">
            <Gauge pct={health.data.cpuUsagePct} />
          </HealthMetric>
          <HealthMetric label="WiFi RSSI">
            <span
              style={{
                color:
                  health.data.wifiRssi > -60
                    ? 'var(--ok)'
                    : health.data.wifiRssi > -75
                      ? 'var(--warn)'
                      : 'var(--danger)',
              }}
            >
              {health.data.wifiRssi} dBm
            </span>
          </HealthMetric>
        </div>
      ) : null}
    </div>
  );
}

function HealthMetric({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        background: 'var(--surface-2)',
        borderRadius: 'var(--radius-sm)',
        padding: '12px 14px',
      }}
    >
      <div className="dim" style={{ fontSize: 11, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 600 }}>{children}</div>
    </div>
  );
}

function Gauge({ pct }: { pct: number }) {
  const color =
    pct < 60 ? 'var(--ok)' : pct < 85 ? 'var(--warn)' : 'var(--danger)';
  return (
    <div>
      <div style={{ color }}>{pct}%</div>
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: 'var(--border)',
          marginTop: 4,
        }}
      >
        <div
          style={{
            width: `${Math.min(100, pct)}%`,
            height: '100%',
            borderRadius: 3,
            background: color,
          }}
        />
      </div>
    </div>
  );
}
