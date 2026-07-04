import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getAlerts,
  getConnectivity,
  getCurrentState,
} from '../api/endpoints';
import type { Reading, ZoneConnectivity } from '../api/types';
import { Loading, ErrorBox } from '../components/Loading';
import { Gauge } from '../components/Gauge';
import { SeverityTag } from '../components/Tags';
import { zoneLabel } from '../lib/labels';
import { formatTime, timeAgo } from '../lib/format';

interface ZoneView {
  zone: string;
  temp?: Reading;
  humid?: Reading;
  smoke?: Reading;
  conn?: ZoneConnectivity;
  latestTs?: string;
}

export function OverviewPage() {
  const current = useQuery({
    queryKey: ['current-state'],
    queryFn: () => getCurrentState(),
    refetchInterval: 5000,
  });
  const connectivity = useQuery({
    queryKey: ['connectivity'],
    queryFn: () => getConnectivity(),
    refetchInterval: 10000,
  });
  const openAlerts = useQuery({
    queryKey: ['alerts', 'OPEN'],
    queryFn: () => getAlerts({ status: 'OPEN', pageSize: 50 }),
    refetchInterval: 15000,
  });

  const zones = useMemo<ZoneView[]>(() => {
    const readings = current.data ?? [];
    const connMap = new Map((connectivity.data ?? []).map((c) => [c.zone, c]));
    const byZone = new Map<string, ZoneView>();
    for (const r of readings) {
      const zone = r.zone ?? 'unknown';
      if (!byZone.has(zone)) byZone.set(zone, { zone });
      const zv = byZone.get(zone)!;
      if (r.sensorType === 'temp') zv.temp = r;
      else if (r.sensorType === 'hmid') zv.humid = r;
      else if (r.sensorType === 'smoke') zv.smoke = r;
      if (!zv.latestTs || r.ts > zv.latestTs) zv.latestTs = r.ts;
    }
    for (const [zone, c] of connMap) {
      if (!byZone.has(zone)) byZone.set(zone, { zone });
      byZone.get(zone)!.conn = c;
    }
    return Array.from(byZone.values()).sort((a, b) => a.zone.localeCompare(b.zone));
  }, [current.data, connectivity.data]);

  const alerts = openAlerts.data?.data ?? [];
  const totalOnline = (connectivity.data ?? []).reduce((s, c) => s + c.online, 0);
  const totalDevices = (connectivity.data ?? []).reduce((s, c) => s + c.total, 0);
  const totalOffline = (connectivity.data ?? []).reduce((s, c) => s + c.offline, 0);
  const lastUpd = current.dataUpdatedAt
    ? formatTime(new Date(current.dataUpdatedAt).toISOString())
    : '—';

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <h1>
            Tổng quan <span className="gradient-text">hệ thống</span>
          </h1>
          <div className="page-subtitle">
            Giám sát thời gian thực theo khu vực · tự động cập nhật mỗi 5 giây
          </div>
        </div>
        <div className="row">
          <span className="tag tag-ok">
            <span className="dot dot-live" /> LIVE
          </span>
          <span className="dim" style={{ fontSize: 12 }}>
            {current.isFetching ? 'đang cập nhật…' : `cập nhật ${lastUpd}`}
          </span>
        </div>
      </div>

      {/* Dải cảnh báo đang mở */}
      {alerts.length > 0 && (
        <div
          className="card"
          style={{
            marginBottom: 'var(--space-5)',
            borderColor: 'rgba(251,93,93,0.45)',
            background:
              'linear-gradient(135deg, rgba(251,93,93,0.1), var(--surface))',
          }}
        >
          <div className="row" style={{ marginBottom: 'var(--space-3)' }}>
            <span style={{ fontSize: 18 }}>🚨</span>
            <strong style={{ color: 'var(--danger)' }}>
              {alerts.length} cảnh báo đang mở
            </strong>
          </div>
          <div className="grid" style={{ gap: 'var(--space-2)' }}>
            {alerts.slice(0, 5).map((a) => (
              <div key={a.alertId} className="row" style={{ fontSize: 13 }}>
                <SeverityTag severity={a.severity} />
                <strong>{a.type}</strong>
                <span className="muted">· {zoneLabel(a.zone)}</span>
                <span className="dim">— {a.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Thẻ tổng hợp */}
      <div className="grid stat-grid" style={{ marginBottom: 'var(--space-5)' }}>
        <SummaryCard icon="🗺️" label="Khu vực giám sát" value={zones.length} hint="đang có dữ liệu" tint="var(--brand)" />
        <SummaryCard icon="🟢" label="Thiết bị trực tuyến" value={totalOnline} hint={`/ ${totalDevices} tổng`} tint="var(--ok)" />
        <SummaryCard icon="🔌" label="Thiết bị ngoại tuyến" value={totalOffline} tint="var(--warn)" />
        <SummaryCard icon="🚨" label="Cảnh báo đang mở" value={alerts.length} tint={alerts.length ? 'var(--danger)' : 'var(--ok)'} />
      </div>

      {current.isLoading ? (
        <Loading label="Đang tải trạng thái hiện tại…" />
      ) : current.isError ? (
        <ErrorBox error={current.error} />
      ) : (
        <div className="grid zone-grid">
          {zones.map((z) => (
            <ZoneCard key={z.zone} view={z} />
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  hint,
  tint,
}: {
  icon: string;
  label: string;
  value: number;
  hint?: string;
  tint: string;
}) {
  return (
    <div className="card card-hover">
      <div className="row" style={{ marginBottom: 'var(--space-3)' }}>
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            background: `color-mix(in srgb, ${tint} 16%, transparent)`,
            border: `1px solid color-mix(in srgb, ${tint} 40%, transparent)`,
          }}
        >
          {icon}
        </span>
        <span className="card-title" style={{ margin: 0 }}>
          {label}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 34, fontWeight: 800, color: tint }}>{value}</span>
        {hint && <span className="dim">{hint}</span>}
      </div>
    </div>
  );
}

function ZoneCard({ view }: { view: ZoneView }) {
  const smokeOn = view.smoke?.valueBool === true;
  const allOnline = view.conn ? view.conn.offline === 0 : true;

  return (
    <div
      className="card card-hover"
      style={
        smokeOn
          ? {
              borderColor: 'rgba(251,93,93,0.6)',
              boxShadow: '0 0 0 1px rgba(251,93,93,0.4), var(--shadow)',
            }
          : undefined
      }
    >
      <div className="row" style={{ marginBottom: 'var(--space-4)' }}>
        <h3 style={{ fontSize: 17 }}>{zoneLabel(view.zone)}</h3>
        <div className="spacer" />
        {view.conn && (
          <span className={`tag ${allOnline ? 'tag-ok' : 'tag-warn'}`}>
            <span className="dot" style={{ background: allOnline ? 'var(--ok)' : 'var(--warn)' }} />
            {view.conn.online}/{view.conn.total}
          </span>
        )}
      </div>

      {/* Hai đồng hồ đo */}
      <div className="row" style={{ justifyContent: 'space-around', marginBottom: 'var(--space-4)' }}>
        <Gauge
          value={view.temp?.valueNum}
          min={10}
          max={40}
          unit={view.temp?.unit ?? '°C'}
          label="Nhiệt độ"
          color="var(--temp)"
        />
        <Gauge
          value={view.humid?.valueNum}
          min={0}
          max={100}
          unit={view.humid?.unit ?? '%'}
          label="Độ ẩm"
          color="var(--humid)"
        />
      </div>

      {/* Khói + cập nhật */}
      <div
        className="row"
        style={{
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          background: smokeOn ? 'var(--danger-soft)' : 'var(--surface-2)',
        }}
      >
        <span className="row" style={{ gap: 8 }}>
          <span style={{ fontSize: 16 }}>{smokeOn ? '🔥' : '🚭'}</span>
          <span style={{ fontWeight: 700, color: smokeOn ? 'var(--danger)' : 'var(--ok)' }}>
            {view.smoke ? (smokeOn ? 'PHÁT HIỆN KHÓI' : 'Không khói') : '—'}
          </span>
        </span>
        <span className="dim" style={{ fontSize: 11 }}>
          🕒 {timeAgo(view.latestTs)}
        </span>
      </div>
    </div>
  );
}
