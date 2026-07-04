import type { Role } from '../api/types';

// Thứ bậc role: mỗi role bao hàm mọi quyền của role thấp hơn (§3.1).
const ORDER: Record<Role, number> = {
  VIEWER: 0,
  TECHNICIAN: 1,
  OPERATOR: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

export const ROLE_LABEL: Record<Role, string> = {
  VIEWER: 'Người xem',
  TECHNICIAN: 'Kỹ thuật viên',
  OPERATOR: 'Vận hành',
  ADMIN: 'Quản trị',
  SUPER_ADMIN: 'Quản trị tối cao',
};

/** role hiện tại có >= mức yêu cầu không. */
export function hasRole(current: Role | null, required: Role): boolean {
  if (!current) return false;
  return ORDER[current] >= ORDER[required];
}

// Actuator "an toàn" (config-driven ở backend; hiện chỉ exhst_fan). §6.2.
const SAFETY_TYPES = new Set(['exhst_fan']);
export function isSafetyActuator(deviceType: string): boolean {
  return SAFETY_TYPES.has(deviceType);
}

/**
 * Ước lượng client-side việc role có được phép điều khiển một actuator không —
 * CHỈ dùng để ẩn/hiện nút (UX). Server mới là nguồn phân quyền thật (map 403).
 * VIEWER: không; TECHNICIAN: chỉ routine; OPERATOR: routine + bật safety;
 * ADMIN/SUPER_ADMIN: tất cả.
 */
export function canCommand(
  role: Role | null,
  deviceType: string
): boolean {
  if (!role) return false;
  if (hasRole(role, 'ADMIN')) return true;
  const safety = isSafetyActuator(deviceType);
  if (role === 'OPERATOR') return true; // routine + bật safety (OFF sẽ bị 403)
  if (role === 'TECHNICIAN') return !safety; // chỉ routine
  return false; // VIEWER
}
