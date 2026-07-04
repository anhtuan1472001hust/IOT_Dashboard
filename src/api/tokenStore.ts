// Kho lưu token dùng chung giữa axios client và AuthContext.
// accessToken giữ trong bộ nhớ (an toàn hơn với XSS-persistence), refreshToken +
// role lưu localStorage để giữ phiên qua reload. Refresh token xoay vòng mỗi lần
// dùng (§3.1) nên luôn ghi đè giá trị mới nhất.
import type { Role } from './types';

const LS_REFRESH = 'iot.refreshToken';
const LS_ROLE = 'iot.role';
const LS_USERNAME = 'iot.username';

interface Session {
  accessToken: string | null;
  refreshToken: string | null;
  role: Role | null;
  username: string | null;
}

let accessToken: string | null = null;
type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

export const tokenStore = {
  subscribe(l: Listener): () => void {
    listeners.add(l);
    return () => listeners.delete(l);
  },

  get(): Session {
    return {
      accessToken,
      refreshToken: localStorage.getItem(LS_REFRESH),
      role: localStorage.getItem(LS_ROLE) as Role | null,
      username: localStorage.getItem(LS_USERNAME),
    };
  },

  getAccessToken(): string | null {
    return accessToken;
  },
  getRefreshToken(): string | null {
    return localStorage.getItem(LS_REFRESH);
  },

  setSession(s: {
    accessToken: string;
    refreshToken: string;
    role: Role;
    username?: string;
  }) {
    accessToken = s.accessToken;
    localStorage.setItem(LS_REFRESH, s.refreshToken);
    localStorage.setItem(LS_ROLE, s.role);
    if (s.username) localStorage.setItem(LS_USERNAME, s.username);
    notify();
  },

  // Cập nhật cặp token sau khi refresh xoay vòng (giữ nguyên role/username).
  updateTokens(accessTok: string, refreshTok: string) {
    accessToken = accessTok;
    localStorage.setItem(LS_REFRESH, refreshTok);
    notify();
  },

  clear() {
    accessToken = null;
    localStorage.removeItem(LS_REFRESH);
    localStorage.removeItem(LS_ROLE);
    localStorage.removeItem(LS_USERNAME);
    notify();
  },

  isAuthenticated(): boolean {
    // Có refreshToken là đủ để coi như còn phiên; access token sẽ được cấp lại.
    return !!localStorage.getItem(LS_REFRESH);
  },
};
