import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { tokenStore } from './tokenStore';
import type { ProblemDetail, TokenResponse } from './types';

const BASE = import.meta.env.VITE_API_BASE ?? '/api/v1';

// UUID cho X-Correlation-Id / Idempotency-Key. crypto.randomUUID có sẵn trên
// mọi trình duyệt hiện đại (chạy trong ngữ cảnh secure/localhost).
export function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const api: AxiosInstance = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Instance riêng cho refresh để không bị interceptor lồng nhau.
const bare = axios.create({ baseURL: BASE });

// --- Request: gắn Bearer + correlation id ---
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.getAccessToken();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  config.headers.set('X-Correlation-Id', uuid());
  return config;
});

// --- Response: tự refresh khi 401 (single-flight) ---
let refreshing: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) return null;
  try {
    const { data } = await bare.post<TokenResponse>('/auth/refresh', {
      refreshToken,
    });
    tokenStore.updateTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    // refresh token đã bị xoay vòng/thu hồi -> buộc đăng nhập lại
    tokenStore.clear();
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retried?: boolean;
    };
    const status = error.response?.status;

    const isAuthCall = original?.url?.includes('/auth/');
    if (status === 401 && original && !original._retried && !isAuthCall) {
      original._retried = true;
      if (!refreshing) refreshing = doRefresh().finally(() => (refreshing = null));
      const newToken = await refreshing;
      if (newToken) {
        original.headers.set('Authorization', `Bearer ${newToken}`);
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);

// Chuẩn hoá lỗi RFC 9457 thành thông báo tiếng Việt để hiển thị.
export function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const pd = err.response?.data as ProblemDetail | undefined;
    if (pd?.errors?.length) {
      return pd.errors.map((e) => `${e.field}: ${e.message}`).join('; ');
    }
    if (pd?.detail) return pd.detail;
    switch (status) {
      case 400:
        return 'Yêu cầu không hợp lệ (400).';
      case 401:
        return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại (401).';
      case 403:
        return 'Bạn không có quyền thực hiện thao tác này (403).';
      case 404:
        return 'Không tìm thấy tài nguyên (404).';
      case 409:
        return 'Xung đột trạng thái — thao tác bị chặn (409).';
      case 422:
        return 'Dữ liệu không hợp lệ (422).';
      case 429:
        return 'Quá nhiều yêu cầu, vui lòng thử lại sau (429).';
      case 503:
        return 'Dịch vụ phụ thuộc (broker) tạm thời gián đoạn (503).';
      default:
        return err.message || 'Lỗi kết nối tới máy chủ.';
    }
  }
  return err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.';
}
