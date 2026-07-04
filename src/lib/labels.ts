// Nhãn tiếng Việt cho zone, loại cảm biến, loại thiết bị, loại cảnh báo detection.

export const ZONE_LABEL: Record<string, string> = {
  office_1: 'Văn phòng 1',
  office_2: 'Văn phòng 2',
  meeting: 'Phòng họp',
  pantry: 'Phòng ăn',
  storage: 'Kho',
  lobby: 'Sảnh',
};
export function zoneLabel(zone: string): string {
  return ZONE_LABEL[zone] ?? zone;
}

export const SENSOR_TYPE_LABEL: Record<string, string> = {
  temp: 'Nhiệt độ',
  hmid: 'Độ ẩm',
  smoke: 'Khói',
  light: 'Ánh sáng',
  open: 'Cửa/Cửa sổ',
};

export const DEVICE_TYPE_LABEL: Record<string, string> = {
  temp: 'Cảm biến nhiệt độ',
  hmid: 'Cảm biến độ ẩm',
  smoke: 'Cảm biến khói',
  light: 'Đèn',
  ac: 'Điều hòa',
  exhst_fan: 'Quạt hút',
  curtain: 'Rèm',
  gateway: 'Gateway',
};
export function deviceTypeLabel(t: string): string {
  return DEVICE_TYPE_LABEL[t] ?? t;
}

// Cảnh báo do lớp phát hiện bất thường sinh ra — điểm nhấn bảo mật (§6.1).
// Kèm mô tả để hiển thị tooltip giải thích ý nghĩa an ninh.
export const DETECTION_ALERTS: Record<string, string> = {
  TOKEN_REUSE_DETECTED:
    'Phát hiện tái sử dụng refresh token đã bị thu hồi — dấu hiệu token bị đánh cắp. Toàn bộ chuỗi token bị vô hiệu.',
  COMMAND_SUPPRESSION_SUSPECTED:
    'Nghi ngờ lệnh điều khiển bị chặn: ≥3 lệnh timeout tới cùng thiết bị trong 1 phút (có thể do kẻ tấn công chặn MQTT).',
  TELEMETRY_GAP:
    'Cảm biến an toàn (khói) im lặng >10 phút — có thể thiết bị bị vô hiệu hóa/che.',
  AUTH_FAILURE_BURST:
    'Bùng nổ đăng nhập thất bại (≥5 lần/phút cho một tài khoản) — dấu hiệu dò mật khẩu (brute force).',
  RATE_LIMIT_SPIKE:
    'Nhiều phản hồi 429 cho một danh tính trong 1 phút — dấu hiệu lạm dụng/thăm dò.',
  FORBIDDEN_SPIKE:
    'Nhiều phản hồi 403 từ một IP trong 1 phút — dấu hiệu thăm dò quyền truy cập.',
};
export function isDetectionAlert(type: string): boolean {
  return type in DETECTION_ALERTS;
}
