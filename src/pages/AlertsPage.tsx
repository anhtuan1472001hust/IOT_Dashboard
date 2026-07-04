import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  acknowledgeAlert,
  getAlerts,
  resolveAlert,
} from '../api/endpoints';
import type { AlertStatus, Severity } from '../api/types';
import { errorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { hasRole } from '../auth/roles';
import { Loading, ErrorBox, Empty } from '../components/Loading';
import { AlertStatusTag, SeverityTag } from '../components/Tags';
import { DETECTION_ALERTS, isDetectionAlert, zoneLabel } from '../lib/labels';
import { formatDateTime, timeAgo } from '../lib/format';

const STATUSES: AlertStatus[] = ['OPEN', 'ACK', 'RESOLVED'];
const SEVERITIES: Severity[] = ['CRITICAL', 'WARNING', 'INFO'];

export function AlertsPage() {
  const { role } = useAuth();
  const canAct = hasRole(role, 'OPERATOR');
  const qc = useQueryClient();
  const [status, setStatus] = useState<AlertStatus | ''>('OPEN');
  const [severity, setSeverity] = useState<Severity | ''>('');
  const [actionError, setActionError] = useState<string | null>(null);

  const alerts = useQuery({
    queryKey: ['alerts', status, severity],
    queryFn: () =>
      getAlerts({
        status: status || undefined,
        severity: severity || undefined,
        pageSize: 100,
      }),
    refetchInterval: 15000,
  });

  const ackM = useMutation({
    mutationFn: acknowledgeAlert,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
    onError: (e) => setActionError(errorMessage(e)),
  });
  const resolveM = useMutation({
    mutationFn: resolveAlert,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
    onError: (e) => setActionError(errorMessage(e)),
  });

  const list = alerts.data?.data ?? [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Cảnh báo & phát hiện bất thường</h1>
          <div className="page-subtitle">
            Cảnh báo từ rule-engine và lớp phát hiện bảo mật · cập nhật mỗi 15s
          </div>
        </div>
      </div>

      <div className="card row row-wrap" style={{ marginBottom: 'var(--space-4)' }}>
        <label className="field">
          Trạng thái
          <select
            className="select"
            value={status}
            onChange={(e) => setStatus(e.target.value as AlertStatus | '')}
          >
            <option value="">Tất cả</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Mức độ
          <select
            className="select"
            value={severity}
            onChange={(e) => setSeverity(e.target.value as Severity | '')}
          >
            <option value="">Tất cả</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <div className="spacer" />
        <span className="dim">{list.length} cảnh báo</span>
      </div>

      {actionError && (
        <div className="error-box" style={{ marginBottom: 'var(--space-4)' }}>
          {actionError}
        </div>
      )}

      {alerts.isLoading ? (
        <Loading />
      ) : alerts.isError ? (
        <ErrorBox error={alerts.error} />
      ) : list.length === 0 ? (
        <Empty label="Không có cảnh báo nào khớp bộ lọc." />
      ) : (
        <div className="grid" style={{ gap: 'var(--space-3)' }}>
          {list.map((a) => {
            const detection = isDetectionAlert(a.type);
            return (
              <div
                key={a.alertId}
                className="card"
                style={
                  a.severity === 'CRITICAL'
                    ? { borderColor: 'var(--danger)' }
                    : undefined
                }
              >
                <div className="row row-wrap" style={{ gap: 'var(--space-3)' }}>
                  <SeverityTag severity={a.severity} />
                  <strong style={{ fontSize: 15 }}>{a.type}</strong>
                  {detection && (
                    <span
                      className="tag tag-info"
                      title="Cảnh báo do lớp phát hiện bất thường sinh ra"
                    >
                      🛡️ Bảo mật
                    </span>
                  )}
                  <AlertStatusTag status={a.status} />
                  <span className="tag tag-muted">{zoneLabel(a.zone)}</span>
                  <div className="spacer" />
                  <span className="dim" style={{ fontSize: 12 }}>
                    {timeAgo(a.createdAt)}
                  </span>
                </div>

                <div style={{ margin: 'var(--space-3) 0' }}>{a.message}</div>

                {detection && (
                  <div
                    className="dim"
                    style={{
                      fontSize: 12,
                      background: 'var(--info-soft)',
                      color: 'var(--info)',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: 'var(--space-3)',
                    }}
                  >
                    🛡️ {DETECTION_ALERTS[a.type]}
                  </div>
                )}

                <div className="row" style={{ fontSize: 12 }}>
                  <span className="dim">
                    Nguồn:{' '}
                    <span className="mono">{a.sourceDeviceId || '—'}</span>
                  </span>
                  <span className="dim">· {formatDateTime(a.createdAt)}</span>
                  <div className="spacer" />
                  {canAct && a.status === 'OPEN' && (
                    <button
                      className="btn btn-sm"
                      disabled={ackM.isPending}
                      onClick={() => {
                        setActionError(null);
                        ackM.mutate(a.alertId);
                      }}
                    >
                      Tiếp nhận
                    </button>
                  )}
                  {canAct && a.status !== 'RESOLVED' && (
                    <button
                      className="btn btn-sm btn-primary"
                      disabled={resolveM.isPending}
                      onClick={() => {
                        setActionError(null);
                        resolveM.mutate(a.alertId);
                      }}
                    >
                      Xử lý xong
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
