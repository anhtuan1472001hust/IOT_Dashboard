import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getActuatorState,
  getCommand,
  getDevices,
  issueCommand,
} from '../api/endpoints';
import type {
  ActuatorState,
  CommandStatus,
  Device,
  IssueCommandRequest,
} from '../api/types';
import { errorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { canCommand, isSafetyActuator } from '../auth/roles';
import { Loading, ErrorBox, Empty } from '../components/Loading';
import { CommandStatusTag } from '../components/Tags';
import { deviceTypeLabel, zoneLabel } from '../lib/labels';
import { timeAgo } from '../lib/format';

const TERMINAL: CommandStatus[] = ['SUCCESS', 'FAILED', 'TIMEOUT'];

export function ControlPage() {
  const { role } = useAuth();

  const actuators = useQuery({
    queryKey: ['actuator-state'],
    queryFn: () => getActuatorState(),
    refetchInterval: 5000,
  });
  // Registry để tra deviceType của từng actuator (actuator-state không kèm type).
  const devices = useQuery({
    queryKey: ['devices', 'actuator'],
    queryFn: () => getDevices({ category: 'actuator', limit: 200 }),
  });

  const typeMap = useMemo(() => {
    const m = new Map<string, Device>();
    for (const d of devices.data?.data ?? []) m.set(d.deviceId, d);
    return m;
  }, [devices.data]);

  const list = actuators.data ?? [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Điều khiển thiết bị</h1>
          <div className="page-subtitle">
            Lệnh gửi bất đồng bộ qua MQTT · trạng thái mong muốn vs thực tế · cập
            nhật mỗi 5s
          </div>
        </div>
      </div>

      <div
        className="card"
        style={{ marginBottom: 'var(--space-4)', fontSize: 13 }}
      >
        <span className="muted">
          ℹ️ Nút điều khiển được ẩn/hiện theo vai trò của bạn, nhưng quyền thực
          sự do máy chủ quyết định (có thể trả về lỗi 403/409). Lệnh là “đặt
          trạng thái tuyệt đối” (SET), không phải bật/tắt tương đối.
        </span>
      </div>

      {actuators.isLoading ? (
        <Loading label="Đang tải trạng thái actuator…" />
      ) : actuators.isError ? (
        <ErrorBox error={actuators.error} />
      ) : list.length === 0 ? (
        <Empty label="Chưa có actuator nào có trạng thái." />
      ) : (
        <div className="grid zone-grid">
          {list.map((a) => (
            <ActuatorCard
              key={a.deviceId}
              state={a}
              device={typeMap.get(a.deviceId)}
              allowed={canCommand(role, typeMap.get(a.deviceId)?.deviceType ?? '')}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ActuatorCard({
  state,
  device,
  allowed,
}: {
  state: ActuatorState;
  device?: Device;
  allowed: boolean;
}) {
  const qc = useQueryClient();
  const deviceType = device?.deviceType ?? 'unknown';
  const [commandId, setCommandId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Poll trạng thái lệnh đang bay đến khi terminal (~40s tối đa).
  const command = useQuery({
    queryKey: ['command', commandId],
    queryFn: () => getCommand(commandId!),
    enabled: !!commandId,
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s && TERMINAL.includes(s) ? false : 1500;
    },
  });

  async function send(parameters: IssueCommandRequest['parameters']) {
    setError(null);
    setBusy(true);
    try {
      const ack = await issueCommand({
        targetId: state.deviceId,
        type: deviceType,
        action: 'SET',
        parameters,
      });
      setCommandId(ack.commandId);
      // làm mới lưới để desiredState phản ánh ngay ý định
      qc.invalidateQueries({ queryKey: ['actuator-state'] });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const cmdStatus = command.data?.status;
  const inFlight = state.inFlight || (!!cmdStatus && !TERMINAL.includes(cmdStatus));

  return (
    <div className="card">
      <div className="row" style={{ marginBottom: 'var(--space-3)' }}>
        <h3 style={{ fontSize: 15 }}>{deviceTypeLabel(deviceType)}</h3>
        {isSafetyActuator(deviceType) && (
          <span className="tag tag-warn">An toàn</span>
        )}
        <div className="spacer" />
        <span className="tag tag-muted">{zoneLabel(state.zone)}</span>
      </div>
      <div className="mono dim" style={{ fontSize: 11, marginBottom: 'var(--space-3)' }}>
        {state.deviceId}
      </div>

      {/* Trạng thái mong muốn vs thực tế */}
      <div
        className="row"
        style={{
          justifyContent: 'space-between',
          background: 'var(--surface-2)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 12px',
          marginBottom: 'var(--space-3)',
        }}
      >
        <StatePair label="Mong muốn" value={state.desiredState} />
        <span className="dim">→</span>
        <StatePair label="Thực tế" value={state.reportedState} />
        {inFlight && (
          <span className="tag tag-info">
            <span className="spinner" style={{ width: 12, height: 12 }} /> đang
            thực thi
          </span>
        )}
      </div>

      {/* Điều khiển theo loại */}
      {allowed ? (
        <Controls deviceType={deviceType} busy={busy} onSend={send} />
      ) : (
        <div className="dim" style={{ fontSize: 12 }}>
          Vai trò của bạn không được phép điều khiển thiết bị này.
        </div>
      )}

      {/* Kết quả lệnh */}
      {commandId && cmdStatus && (
        <div
          className="row"
          style={{ marginTop: 'var(--space-3)', fontSize: 12 }}
        >
          <span className="dim">Lệnh gần nhất:</span>
          <CommandStatusTag status={cmdStatus} />
        </div>
      )}
      {error && (
        <div className="error-box" style={{ marginTop: 'var(--space-3)' }}>
          {error}
        </div>
      )}

      <div className="dim" style={{ fontSize: 11, marginTop: 'var(--space-3)' }}>
        Cập nhật {timeAgo(state.updatedAt)}
      </div>
    </div>
  );
}

function StatePair({ label, value }: { label: string; value: string }) {
  const on = value?.toUpperCase() === 'ON';
  return (
    <div>
      <div className="dim" style={{ fontSize: 10 }}>
        {label}
      </div>
      <div
        style={{
          fontWeight: 700,
          color: on ? 'var(--ok)' : 'var(--text-muted)',
        }}
      >
        {value || '—'}
      </div>
    </div>
  );
}

// Bộ điều khiển tương ứng whitelist tham số theo deviceType (§5.5).
function Controls({
  deviceType,
  busy,
  onSend,
}: {
  deviceType: string;
  busy: boolean;
  onSend: (p: IssueCommandRequest['parameters']) => void;
}) {
  const [temp, setTemp] = useState(24);
  const [mode, setMode] = useState('COOL');

  if (deviceType === 'curtain') {
    return (
      <div className="row">
        <button className="btn btn-sm" disabled={busy} onClick={() => onSend({ direction: 'UP' })}>
          ⬆️ Kéo lên
        </button>
        <button className="btn btn-sm" disabled={busy} onClick={() => onSend({ direction: 'STOP' })}>
          ⏹ Dừng
        </button>
        <button className="btn btn-sm" disabled={busy} onClick={() => onSend({ direction: 'DOWN' })}>
          ⬇️ Hạ xuống
        </button>
      </div>
    );
  }

  if (deviceType === 'ac') {
    return (
      <div className="grid" style={{ gap: 'var(--space-2)' }}>
        <div className="row">
          <button
            className="btn btn-sm btn-primary"
            disabled={busy}
            onClick={() => onSend({ status: 'ON', set_temp: temp, mode })}
          >
            Bật
          </button>
          <button
            className="btn btn-sm"
            disabled={busy}
            onClick={() => onSend({ status: 'OFF' })}
          >
            Tắt
          </button>
        </div>
        <div className="row row-wrap">
          <label className="field">
            Nhiệt độ đặt ({temp}°C)
            <input
              type="range"
              min={16}
              max={30}
              value={temp}
              onChange={(e) => setTemp(Number(e.target.value))}
            />
          </label>
          <label className="field">
            Chế độ
            <select
              className="select"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              {['COOL', 'HEAT', 'DRY', 'FAN', 'AUTO'].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    );
  }

  // light, exhst_fan và mặc định: bật/tắt theo status
  return (
    <div className="row">
      <button
        className="btn btn-sm btn-primary"
        disabled={busy}
        onClick={() => onSend({ status: 'ON' })}
      >
        Bật
      </button>
      <button
        className="btn btn-sm"
        disabled={busy}
        onClick={() => onSend({ status: 'OFF' })}
      >
        Tắt
      </button>
    </div>
  );
}
