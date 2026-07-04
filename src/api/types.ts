// Các kiểu dữ liệu khớp wire-format của backend (iot-platform-integration-guide.md §6.1).
// JSON camelCase, timestamp ISO-8601 UTC.

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'TECHNICIAN' | 'VIEWER';

// ---- Auth ----
export interface LoginRequest {
  username: string;
  password: string;
}
export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number; // giây
  refreshToken: string;
  role: Role;
}

// ---- Envelope phân trang ----
export interface CursorPage {
  nextCursor?: string | null;
  hasMore: boolean;
  pageSize: number;
}
export interface OffsetPage {
  offset: number;
  limit: number;
  total: number;
}
export interface Paged<T, P = CursorPage | OffsetPage> {
  data: T[];
  page: P;
}

// ---- Thiết bị ----
export type DeviceCategory = 'gateway' | 'sensor' | 'actuator';
export type DeviceStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'DECOMMISSIONED';

export interface Device {
  deviceId: string;
  category: DeviceCategory;
  deviceType: string; // temp | hmid | smoke | light | ac | exhst_fan | curtain | gateway ...
  zone: string;
  parentGatewayId: string | null;
  firmwareVersion: string | null;
  status: DeviceStatus;
  protocols: string[];
  createdAt: string;
}

export type ConnectionStatus = 'ONLINE' | 'OFFLINE';
export interface DeviceHealth {
  deviceId: string;
  connectionStatus: ConnectionStatus;
  lastSeen: string;
  memoryUsagePct: number;
  cpuUsagePct: number;
  wifiRssi: number;
  updatedAt: string;
}

// ---- Telemetry / trạng thái hiện tại ----
export interface Reading {
  sensorId: string;
  sensorType: string;
  valueNum?: number;
  valueBool?: boolean;
  unit?: string;
  ts: string;
  zone?: string; // current-state có thêm zone
}

export interface ZoneConnectivity {
  zone: string;
  online: number;
  offline: number;
  total: number;
}

// ---- Command / actuator ----
export type CommandStatus =
  | 'PENDING'
  | 'RECEIVED'
  | 'SUCCESS'
  | 'FAILED'
  | 'TIMEOUT';

export interface IssueCommandRequest {
  targetId: string;
  type: string; // deviceType của actuator
  action: 'SET';
  parameters: Record<string, string | number>;
}
export interface CommandAck {
  commandId: string;
  status: CommandStatus;
  issuedAt: string;
}
export interface Command {
  commandId: string;
  targetId: string;
  action: string;
  parameters: Record<string, unknown>;
  status: CommandStatus;
  issuedBy: string;
  issuedAt: string;
  receivedAt?: string | null;
  executedAt?: string | null;
}

export interface ActuatorState {
  deviceId: string;
  zone: string;
  desiredState: string;
  reportedState: string;
  inFlight: boolean;
  attributes: Record<string, unknown>;
  lastCommandId: string | null;
  commandedAt: string | null;
  updatedAt: string;
}

// ---- Alert ----
export type Severity = 'INFO' | 'WARNING' | 'CRITICAL';
export type AlertStatus = 'OPEN' | 'ACK' | 'RESOLVED';
export interface Alert {
  alertId: string;
  type: string;
  severity: Severity;
  zone: string;
  sourceDeviceId: string;
  message: string;
  status: AlertStatus;
  createdAt: string;
}

// ---- Rule ----
export interface Rule {
  ruleId: string;
  name: string;
  enabled: boolean;
  condition: string;
  action: string;
  priority: number;
  createdBy: string;
}

// ---- User ----
export type UserStatus = 'ACTIVE' | 'DISABLED';
export interface User {
  id: string;
  username: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
}

// ---- Audit ----
export type ActorType = 'USER' | 'DEVICE' | 'SYSTEM';
export interface AuditLog {
  id: string;
  ts: string;
  actor: string;
  actorType: ActorType;
  event: string; // dotted-lowercase, vd user.login, command.issue
  target: string;
  detail: Record<string, unknown>;
  ip: string;
}

// ---- Lỗi RFC 9457 ----
export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: { field: string; message: string }[];
}
