import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Backend chưa cấu hình CORS (xem iot-platform-integration-guide.md §2.4/§8.1).
// Dev proxy chuyển /api tới Spring Boot ở cổng 8080 để trình duyệt gọi same-origin,
// né hoàn toàn preflight CORS. Đổi target qua biến môi trường VITE_PROXY_TARGET nếu cần.
const proxyTarget = process.env.VITE_PROXY_TARGET ?? 'http://localhost:8080';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
});
