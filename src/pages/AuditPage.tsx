import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuditLogs } from '../api/endpoints';
import type { ActorType } from '../api/types';
import { Loading, ErrorBox, Empty } from '../components/Loading';
import { formatDateTime, isoHoursAgo, isoNow } from '../lib/format';

const RANGES: { label: string; hours: number }[] = [
  { label: '24 giờ', hours: 24 },
  { label: '7 ngày', hours: 24 * 7 },
  { label: '30 ngày', hours: 24 * 30 },
  { label: '90 ngày', hours: 24 * 90 }, // tối đa audit.history-max-window
];

function actorTypeTag(t: ActorType): string {
  return t === 'USER' ? 'tag-info' : t === 'DEVICE' ? 'tag-muted' : 'tag-warn';
}

export function AuditPage() {
  const [hours, setHours] = useState(24 * 7);
  const [event, setEvent] = useState('');

  const logs = useQuery({
    queryKey: ['audit-logs', hours, event],
    queryFn: () =>
      getAuditLogs({
        from: isoHoursAgo(hours),
        to: isoNow(),
        event: event || undefined,
        pageSize: 100,
      }),
  });

  const list = logs.data?.data ?? [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Nhật ký kiểm toán</h1>
          <div className="page-subtitle">
            Bản ghi chỉ-thêm (append-only) mọi hành động kiểm soát · cửa sổ tối
            đa 90 ngày
          </div>
        </div>
      </div>

      <div className="card row row-wrap" style={{ marginBottom: 'var(--space-4)' }}>
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
        <label className="field">
          Sự kiện (mã dotted, vd user.login)
          <input
            className="input"
            value={event}
            placeholder="tất cả"
            onChange={(e) => setEvent(e.target.value.trim())}
          />
        </label>
        <div className="spacer" />
        <span className="dim">{list.length} bản ghi</span>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {logs.isLoading ? (
          <Loading />
        ) : logs.isError ? (
          <div style={{ padding: 16 }}>
            <ErrorBox error={logs.error} />
          </div>
        ) : list.length === 0 ? (
          <Empty label="Không có bản ghi kiểm toán trong khoảng này." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Sự kiện</th>
                <th>Chủ thể</th>
                <th>Loại</th>
                <th>Đối tượng</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {list.map((l) => (
                <tr key={l.id}>
                  <td className="dim" style={{ whiteSpace: 'nowrap' }}>
                    {formatDateTime(l.ts)}
                  </td>
                  <td className="mono">{l.event}</td>
                  <td>{l.actor}</td>
                  <td>
                    <span className={`tag ${actorTypeTag(l.actorType)}`}>
                      {l.actorType}
                    </span>
                  </td>
                  <td className="mono dim">{l.target || '—'}</td>
                  <td className="dim mono">{l.ip || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
