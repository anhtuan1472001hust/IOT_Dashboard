import type {
  AlertStatus,
  CommandStatus,
  ConnectionStatus,
  DeviceStatus,
  Severity,
} from '../api/types';

export function SeverityTag({ severity }: { severity: Severity }) {
  const map: Record<Severity, [string, string]> = {
    INFO: ['tag-info', 'Thông tin'],
    WARNING: ['tag-warn', 'Cảnh báo'],
    CRITICAL: ['tag-danger', 'Nghiêm trọng'],
  };
  const [cls, label] = map[severity];
  return <span className={`tag ${cls}`}>{label}</span>;
}

export function AlertStatusTag({ status }: { status: AlertStatus }) {
  const map: Record<AlertStatus, [string, string]> = {
    OPEN: ['tag-danger', 'Đang mở'],
    ACK: ['tag-warn', 'Đã tiếp nhận'],
    RESOLVED: ['tag-ok', 'Đã xử lý'],
  };
  const [cls, label] = map[status];
  return <span className={`tag ${cls}`}>{label}</span>;
}

export function DeviceStatusTag({ status }: { status: DeviceStatus }) {
  const map: Record<DeviceStatus, [string, string]> = {
    ACTIVE: ['tag-ok', 'Hoạt động'],
    INACTIVE: ['tag-muted', 'Chưa kích hoạt'],
    SUSPENDED: ['tag-warn', 'Tạm ngưng'],
    DECOMMISSIONED: ['tag-danger', 'Ngừng sử dụng'],
  };
  const [cls, label] = map[status];
  return <span className={`tag ${cls}`}>{label}</span>;
}

export function ConnDot({ status }: { status: ConnectionStatus }) {
  const online = status === 'ONLINE';
  return (
    <span className={`tag ${online ? 'tag-ok' : 'tag-muted'}`}>
      <span
        className="dot"
        style={{ background: online ? 'var(--ok)' : 'var(--text-dim)' }}
      />
      {online ? 'Trực tuyến' : 'Ngoại tuyến'}
    </span>
  );
}

export function CommandStatusTag({ status }: { status: CommandStatus }) {
  const map: Record<CommandStatus, [string, string]> = {
    PENDING: ['tag-muted', 'Chờ gửi'],
    RECEIVED: ['tag-info', 'Đã nhận'],
    SUCCESS: ['tag-ok', 'Thành công'],
    FAILED: ['tag-danger', 'Thất bại'],
    TIMEOUT: ['tag-warn', 'Quá hạn'],
  };
  const [cls, label] = map[status];
  return <span className={`tag ${cls}`}>{label}</span>;
}
