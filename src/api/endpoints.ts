// Hàm typed cho từng endpoint REST dùng trong dashboard.
// Tham chiếu iot-platform-integration-guide.md §6.1.
import { api, uuid } from './client';
import type {
  ActuatorState,
  Alert,
  AlertStatus,
  AuditLog,
  Command,
  CommandAck,
  CursorPage,
  Device,
  DeviceCategory,
  DeviceHealth,
  DeviceStatus,
  IssueCommandRequest,
  LoginRequest,
  OffsetPage,
  Paged,
  Reading,
  Rule,
  Severity,
  TokenResponse,
  User,
  ZoneConnectivity,
} from './types';

// ---------- Auth ----------
export async function login(body: LoginRequest): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>('/auth/login', body);
  return data;
}
export async function logout(refreshToken: string): Promise<void> {
  await api.post('/auth/logout', { refreshToken });
}

// ---------- Trạng thái hiện tại (giám sát realtime) ----------
export async function getCurrentState(zone?: string): Promise<Reading[]> {
  const { data } = await api.get<Paged<Reading>>('/current-state', {
    params: zone ? { zone } : undefined,
  });
  return data.data;
}
export async function getConnectivity(
  zone?: string
): Promise<ZoneConnectivity[]> {
  const { data } = await api.get<Paged<ZoneConnectivity>>('/connectivity', {
    params: zone ? { zone } : undefined,
  });
  return data.data;
}
export async function getSensorLatest(sensorId: string): Promise<Reading> {
  const { data } = await api.get<Reading>(
    `/sensors/${encodeURIComponent(sensorId)}/latest`
  );
  return data;
}

// ---------- Telemetry / lịch sử (biểu đồ & thống kê) ----------
export interface TelemetryQuery {
  sensorId?: string;
  zone?: string;
  from: string; // ISO
  to: string; // ISO
  cursor?: string;
  pageSize?: number;
}
export async function getTelemetry(
  q: TelemetryQuery
): Promise<Paged<Reading, CursorPage>> {
  const { data } = await api.get<Paged<Reading, CursorPage>>('/telemetry', {
    params: q,
  });
  return data;
}

// ---------- Thiết bị ----------
export interface DeviceFilter {
  zone?: string;
  category?: DeviceCategory;
  deviceType?: string;
  status?: DeviceStatus;
  offset?: number;
  limit?: number;
}
export async function getDevices(
  filter?: DeviceFilter
): Promise<Paged<Device, OffsetPage>> {
  const { data } = await api.get<Paged<Device, OffsetPage>>('/devices', {
    params: filter,
  });
  return data;
}
export async function getDeviceHealth(deviceId: string): Promise<DeviceHealth> {
  const { data } = await api.get<DeviceHealth>(
    `/devices/${encodeURIComponent(deviceId)}/health`
  );
  return data;
}

// ---------- Command / actuator (điều khiển) ----------
export async function getActuatorState(params?: {
  zone?: string;
  drifted?: boolean;
}): Promise<ActuatorState[]> {
  const { data } = await api.get<Paged<ActuatorState>>('/actuator-state', {
    params,
  });
  return data.data;
}
export async function issueCommand(
  body: IssueCommandRequest
): Promise<CommandAck> {
  // Idempotency-Key bắt buộc (§6.2) — một UUID cho mỗi ý định của người dùng.
  const { data } = await api.post<CommandAck>('/commands', body, {
    headers: { 'Idempotency-Key': uuid() },
  });
  return data;
}
export async function getCommand(commandId: string): Promise<Command> {
  const { data } = await api.get<Command>(
    `/commands/${encodeURIComponent(commandId)}`
  );
  return data;
}

// ---------- Alert (cảnh báo & bảo mật) ----------
export interface AlertFilter {
  status?: AlertStatus;
  severity?: Severity;
  zone?: string;
  from?: string;
  to?: string;
  cursor?: string;
  pageSize?: number;
}
export async function getAlerts(
  filter?: AlertFilter
): Promise<Paged<Alert, CursorPage>> {
  const { data } = await api.get<Paged<Alert, CursorPage>>('/alerts', {
    params: filter,
  });
  return data;
}
export async function acknowledgeAlert(alertId: string): Promise<Alert> {
  const { data } = await api.post<Alert>(
    `/alerts/${encodeURIComponent(alertId)}:acknowledge`
  );
  return data;
}
export async function resolveAlert(alertId: string): Promise<Alert> {
  const { data } = await api.post<Alert>(
    `/alerts/${encodeURIComponent(alertId)}:resolve`
  );
  return data;
}

// ---------- Rule ----------
export async function getRules(enabled?: boolean): Promise<Rule[]> {
  const { data } = await api.get<Paged<Rule, OffsetPage>>('/rules', {
    params: enabled === undefined ? undefined : { enabled },
  });
  return data.data;
}

// ---------- Audit (bảo mật, ADMIN) ----------
export interface AuditFilter {
  actor?: string;
  actorType?: string;
  event?: string;
  target?: string;
  from: string; // bắt buộc, cửa sổ <= 90d
  to: string;
  cursor?: string;
  pageSize?: number;
}
export async function getAuditLogs(
  filter: AuditFilter
): Promise<Paged<AuditLog, CursorPage>> {
  const { data } = await api.get<Paged<AuditLog, CursorPage>>('/audit-logs', {
    params: filter,
  });
  return data;
}

// ---------- Users (ADMIN) ----------
export async function getUsers(): Promise<Paged<User, OffsetPage>> {
  const { data } = await api.get<Paged<User, OffsetPage>>('/users');
  return data;
}
